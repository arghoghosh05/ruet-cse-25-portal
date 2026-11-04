"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  hasValidImageSignature,
  maxProfileImageSize,
  profileImageExtensions,
} from "../lib/profile-image";

type FormState = { error: string | null };
type StudentAction = (formData: FormData) => Promise<void>;

/**
 * Compresses an image file on the client using HTML5 canvas before uploading.
 * Reduces raw multi-megabyte camera photos to a compact WebP (~80-120 KB),
 * preventing storage ballooning and keeping Spark Plan egress well within limits.
 */
async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Your browser could not process this image."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Your browser could not encode this image."));
          }
        },
        "image/webp",
        quality
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

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
          const compressedBlob = await compressImage(imageFile, 800, 800, 0.8);
          if (compressedBlob.type !== "image/webp" || compressedBlob.size > 1_500_000) {
            return { error: "The compressed photo is too large. Choose a smaller image." };
          }
          const imagePath = `avatars/${currentUser.uid}/${crypto.randomUUID()}.webp`;
          const storageRef = ref(storage, imagePath);
          await uploadBytes(storageRef, compressedBlob, {
            contentType: "image/webp",
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
