import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface CodeProps extends ComponentPropsWithoutRef<"code"> {
  children: ReactNode;
}
