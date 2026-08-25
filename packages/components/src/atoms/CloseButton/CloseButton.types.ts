import type { ComponentPropsWithoutRef } from "react";
import type { ButtonSize } from "../Button/Button.types";

export interface CloseButtonProps extends ComponentPropsWithoutRef<"button"> {
  /**
   * Controls the button's clickable box and its glyph together, as one
   * step — the icon always fills the box exactly (no separate icon-size
   * override), matching `IconButton`'s own single-`size` model.
   * @default 'md'
   */
  size?: ButtonSize;
}
