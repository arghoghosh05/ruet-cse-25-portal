#!/usr/bin/env node
/**
 * Prune orphaned files from the Supabase `avatars` bucket.
 *
 * Every avatar upload writes a fresh `<user_id>/<uuid>.<ext>` object and nothing
 * in the app ever deletes one, so replaced photos, rejected submissions and
 * abandoned forms accumulate forever. This lists the objects no row points at
 * any more, and deletes them on request.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/prune-avatars.mjs
 *   … add --delete to actually remove what the dry run lists
 *
 * Safe by construction:
 *   - dry run unless --delete is passed
 *   - only ever targets paths shaped like <uuid>/<uuid>.<ext>
 *   - skips any path referenced by profiles or student_submissions
 *   - aborts without deleting if a stored path doesn't fit that shape
 *
 * The service role key bypasses row level security. It is read from the
 * environment only and never written anywhere.
 */

const BUCKET = "avatars";
const BATCH_SIZE = 100;
const PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DELETE = process.argv.includes("--delete");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run it with both set in the environment.",
  );
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });

  if (response.status === 402) {
    const body = await response.text();
    throw new Error(`Supabase rejected the request (402): ${body}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} -> ${response.status} ${response.statusText}: ${body}`);
  }

  return response.json();
}

async function fetchReferencedPaths(table) {
  const paths = new Set();
  let offset = 0;

  for (;;) {
    const rows = await request(
      `/rest/v1/${table}?select=image_url&image_url=not.is.null&limit=1000&offset=${offset}`,
    );
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      if (typeof row.image_url === "string") {
        const marker = `/${BUCKET}/`;
        const index = row.image_url.indexOf(marker);
        if (index !== -1) {
          paths.add(decodeURIComponent(row.image_url.slice(index + marker.length)));
        }
      }
    }

    offset += rows.length;
    if (rows.length < 1000) break;
  }

  return paths;
}

async function listFolder(prefix) {
  const objects = [];
  let offset = 0;

  for (;;) {
    const page = await request(`/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      body: JSON.stringify({
        prefix,
        limit: 100,
        offset,
        sortBy: { column: "created_at", order: "asc" },
      }),
    });

    if (!Array.isArray(page) || page.length === 0) break;

    for (const entry of page) {
      // Folders carry no metadata; files do.
      if (entry.metadata && typeof entry.metadata.size === "number") {
        objects.push({
          name: prefix ? `${prefix}/${entry.name}` : entry.name,
          size: entry.metadata.size,
          created_at: entry.created_at,
        });
      } else {
        const child = await listFolder(prefix ? `${prefix}/${entry.name}` : entry.name);
        objects.push(...child);
      }
    }

    offset += page.length;
    if (page.length < 100) break;
  }

  return objects;
}

function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  console.log(`Project: ${SUPABASE_URL}`);
  console.log(`Mode:    ${DELETE ? "DELETE" : "dry run (nothing is removed)"}`);
  console.log("");

  const [profilePaths, submissionPaths, stored] = await Promise.all([
    fetchReferencedPaths("profiles"),
    fetchReferencedPaths("student_submissions"),
    listFolder(""),
  ]);

  const referenced = new Set([...profilePaths, ...submissionPaths]);
  const orphans = stored.filter((object) => !referenced.has(object.name));
  const unrecognised = stored.filter((object) => !PATH_PATTERN.test(object.name));

  const orphanBytes = orphans.reduce((sum, object) => sum + object.size, 0);
  console.log(`Stored objects:      ${stored.length}`);
  console.log(`Referenced by rows:  ${referenced.size}`);
  console.log(`Orphaned:            ${orphans.length} (${human(orphanBytes)})`);

  if (unrecognised.length > 0) {
    console.log(
      `\nRefusing to continue: ${unrecognised.length} object(s) do not look like ` +
        `<user_id>/<uuid>.<ext>. Review them in the dashboard first:`,
    );
    for (const object of unrecognised.slice(0, 20)) console.log(`  - ${object.name}`);
    process.exit(2);
  }

  if (orphans.length === 0) {
    console.log("\nNothing to prune.");
    return;
  }

  const sorted = [...orphans].sort((a, b) => b.size - a.size);
  console.log("\nLargest orphans:");
  for (const object of sorted.slice(0, 15)) {
    console.log(`  ${human(object.size).padStart(9)}  ${object.name}`);
  }

  if (!DELETE) {
    console.log(`\nDry run only. Re-run with --delete to remove these ${orphans.length} files.`);
    return;
  }

  let removed = 0;
  let freed = 0;
  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    const batch = orphans.slice(i, i + BATCH_SIZE);
    await request(`/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      body: JSON.stringify({ prefixes: batch.map((object) => object.name) }),
    });
    removed += batch.length;
    freed += batch.reduce((sum, object) => sum + object.size, 0);
    console.log(`  removed ${removed}/${orphans.length}`);
  }

  console.log(`\nDeleted ${removed} file(s), freeing ${human(freed)}.`);
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});
