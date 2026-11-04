"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  compressProfileImage,
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

        try {
          const currentUser = auth?.currentUser;
          if (!currentUser || !storage) {
            return { error: "Sign in with Google before uploading a profile photo." };
          }
          const uploadFile = await compressProfileImage(imageFile);
          const uploadExtension = profileImageExtensions[uploadFile.type];
          if (!uploadExtension || uploadFile.size > 1_500_000) {
            return { error: "The compressed photo is too large. Choose a smaller image." };
          }
          const imagePath = `avatars/${currentUser.uid}/${crypto.randomUUID()}.${uploadExtension}`;
          const storageRef = ref(storage, imagePath);
          await uploadBytes(storageRef, uploadFile, {
            contentType: uploadFile.type,
          });
          const downloadUrl = await getDownloadURL(storageRef);
          formData.set("image_path", downloadUrl);
        } catch (uploadError) {
          console.error(
            "Student image upload to Firebase Storage failed:",
            uploadError instanceof Error ? uploadError.message : uploadError,
          );
          return { error: "The image could not be uploaded. Please try again." };
        }
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
