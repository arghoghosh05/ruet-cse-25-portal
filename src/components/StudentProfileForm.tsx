"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { createClient } from "../../utils/supabase/client";
import {
  hasValidImageSignature,
  maxProfileImageSize,
  profileImageExtensions,
} from "../lib/profile-image";

type FormState = { error: string | null };
type StudentAction = (formData: FormData) => Promise<void>;

export default function StudentProfileForm({
  action,
  children,
  className,
}: {
  action: StudentAction;
  children: ReactNode;
  className: string;
}) {
  const [state, formAction] = useActionState(
    async (_previousState: FormState, formData: FormData): Promise<FormState> => {
      const imageValue = formData.get("image");
      if (imageValue && typeof imageValue !== "string" && !(imageValue instanceof File)) {
        return { error: "Invalid image upload." };
      }

      const imageFile = imageValue instanceof File && imageValue.size > 0 ? imageValue : null;
      formData.delete("image");

      if (imageFile) {
        const extension = profileImageExtensions[imageFile.type];
        if (!extension || imageFile.size > maxProfileImageSize) {
          return { error: "Choose a PNG, JPEG, or WebP image no larger than 15 MB." };
        }

        const signature = new Uint8Array(await imageFile.slice(0, 12).arrayBuffer());
        if (!hasValidImageSignature(imageFile.type, signature)) {
          return { error: "The selected file is not a valid image." };
        }

        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          return { error: "Your session has expired. Sign in again and retry." };
        }

        const imagePath = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(imagePath, imageFile, { contentType: imageFile.type, upsert: false });
        if (uploadError) {
          console.error("Student image upload failed:", uploadError.message);
          return { error: "The image could not be uploaded. Please try again." };
        }
        formData.set("image_path", imagePath);
      }

      await action(formData);
      return { error: null };
    },
    { error: null },
  );

  return (
    <form action={formAction} className={className} autoComplete="off">
      {children}
      <input type="hidden" name="image_path" value="" />
      {state.error && (
        <p role="alert" className="profile-form-error rounded-lg border px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
