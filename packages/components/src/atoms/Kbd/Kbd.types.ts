import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface KbdProps extends ComponentPropsWithoutRef<"kbd"> {
  children: ReactNode;
}
