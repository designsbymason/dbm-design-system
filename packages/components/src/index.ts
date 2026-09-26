import "./styles/global.css";

export * from "./atoms/Affix";
export * from "./atoms/AspectRatio";
export * from "./atoms/Avatar";
export * from "./atoms/Backdrop";
export * from "./atoms/BackToTop";
export * from "./atoms/Badge";
export * from "./atoms/Bleed";
export * from "./atoms/Blockquote";
export * from "./atoms/Box";
export * from "./atoms/Button";
export * from "./atoms/Center";
export * from "./atoms/Checkbox";
export * from "./atoms/ClientOnly";
export * from "./atoms/CloseButton";
export * from "./atoms/Code";
export * from "./atoms/Collapse";
export * from "./atoms/Container";
export * from "./atoms/Divider";
export * from "./atoms/FieldError";
export * from "./atoms/FieldHelperText";
export * from "./atoms/FieldLabel";
export * from "./atoms/FocusTrap";
export * from "./atoms/GridItem";
export * from "./atoms/Heading";
export * from "./atoms/Highlight";
export * from "./atoms/Icon";
export * from "./atoms/IconButton";
export * from "./atoms/Image";
export * from "./atoms/Indicators";
export * from "./atoms/Input";
export * from "./atoms/Kbd";
export * from "./atoms/Link";
export * from "./atoms/ListItem";
export * from "./atoms/Portal";
export * from "./atoms/ProgressBar";
export * from "./atoms/ProgressCircle";
export * from "./atoms/Radio";
export * from "./atoms/Skeleton";
export * from "./atoms/Spacer";
export * from "./atoms/Spinner";
export * from "./atoms/Stack";
export * from "./atoms/Switch";
export * from "./atoms/Tag";
export * from "./atoms/Text";
export * from "./atoms/Textarea";
export * from "./atoms/ThemeProvider";
export * from "./atoms/Tooltip";
export * from "./atoms/VisuallyHidden";

export * from "./molecules/Accordion";
export * from "./molecules/Alert";
export * from "./molecules/Breadcrumb";
export * from "./molecules/Card";
export * from "./molecules/CheckboxGroup";
export * from "./molecules/EmptyState";
export * from "./molecules/FormField";
export * from "./molecules/Grid";
export * from "./molecules/List";
export * from "./molecules/NumberInput";
export * from "./molecules/Pagination";
export * from "./molecules/PasswordInput";
export * from "./molecules/Popover";
export * from "./molecules/RadioGroup";
export * from "./molecules/RangeSlider";
export * from "./molecules/SearchInput";
export * from "./molecules/Select";
export * from "./molecules/Slider";
export * from "./molecules/Table";
export * from "./molecules/Tabs";

// What a consumer is meant to use from `@dbm-design-system/primitives`, re-exported so that installing only this package
// is enough (ADR-0023, `02-tech-stack-and-structure.md` §2) — never the helpers only components use.
//
// A hook: pair it with `Alert`'s controlled `open` to remember a dismissal across visits.
export { usePersistentDismiss } from "@dbm-design-system/primitives";
export type { PersistentDismiss, PersistentDismissStorage, UsePersistentDismissOptions } from "@dbm-design-system/primitives";
// The types in thirteen components' public props (`Stack`'s `gap`, `Tabs`' `orientation`, `Grid`'s `columns`…), for a
// consumer writing a typed wrapper around one.
export type { Breakpoint, Responsive, SpaceValue } from "@dbm-design-system/primitives";
