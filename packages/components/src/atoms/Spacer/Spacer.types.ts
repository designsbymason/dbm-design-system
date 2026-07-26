import type { ComponentPropsWithoutRef } from "react";

export type SpacerProps = Omit<ComponentPropsWithoutRef<"div">, "children">;
