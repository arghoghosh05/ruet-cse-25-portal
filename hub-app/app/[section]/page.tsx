import { notFound } from "next/navigation";
import { HubView, type HubSection } from "@/components/hub-view";

const sections: HubSection[] = [
  "notices",
  "routine",
  "work",
  "courses",
  "directory",
  "admin",
];

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section as HubSection)) notFound();

  return <HubView section={section as HubSection} />;
}
