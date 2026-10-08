"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  pendingText: string;
  className: string;
  disabled?: boolean;
};

export default function SubmitButton({
  children,
  pendingText,
  className,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
          <span>{pendingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
