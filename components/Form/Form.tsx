"use client";

import { ReactNode, useCallback, DetailedHTMLProps, FormHTMLAttributes, FormEvent } from "react";

interface FormProps
  extends DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> {
  onSubmit?: (event: FormEvent) => void;
  preventDefault?: boolean;
  children?: ReactNode;
}

export default function Form({
  preventDefault = true,
  onSubmit,
  children,
  ...otherProps
}: FormProps) {
  const handleSubmit = useCallback(
    (event: FormEvent) => {
      console.log("Form submitted!");
      if (preventDefault) event.preventDefault();
      if (onSubmit) onSubmit(event);
    },
    [preventDefault, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} {...otherProps}>
      {children}
    </form>
  );
}
