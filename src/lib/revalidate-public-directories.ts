import { revalidatePath } from "next/cache";

export function revalidatePublicDirectories() {
  for (const section of ["a", "b", "c"]) {
    revalidatePath(`/sections/${section}`);
  }
}
