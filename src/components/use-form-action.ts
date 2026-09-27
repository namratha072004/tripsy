"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import type { FormState } from "@/app/actions";

// Like useActionState, but submits via onSubmit so React doesn't reset the
// form after an error; people keep what they typed.
export function useFormAction(fn: (s: FormState, fd: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState<FormState, FormData>(fn, undefined);
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  return { state, pending, onSubmit };
}
