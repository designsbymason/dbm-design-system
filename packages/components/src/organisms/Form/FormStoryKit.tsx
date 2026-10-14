import { useState, type ReactNode } from "react";
import { Input } from "../../atoms/Input";
import { FormField } from "../../molecules/FormField";
import type { FormValues } from "./Form.types";

/**
 * What the demo forms do with a valid submit, for Storybook only: shows the values under the form, so a reader can
 * see what `onSubmit` was given.
 */
export function useSubmitted() {
  const [values, setValues] = useState<FormValues | null>(null);
  return { values, setValues };
}

export function Submitted({ values }: { values: FormValues | null }) {
  return (
    <output
      style={{
        display: "block",
        marginBlockStart: "var(--dbm-space-4)",
        fontFamily: "var(--dbm-font-family-primary)",
        fontSize: "var(--dbm-font-size-sm)",
        color: "var(--dbm-text-secondary)",
      }}
    >
      {values ? `Submitted: ${JSON.stringify(values)}` : "Nothing submitted yet."}
    </output>
  );
}

export function Stage({ children, width = "28rem" }: { children: ReactNode; width?: string }) {
  return <div style={{ maxInlineSize: width }}>{children}</div>;
}

/** The two fields most demos use. */
export const EmailAndUsername = (
  <>
    <FormField label="Email" name="email" required>
      {(field) => <Input {...field} type="email" placeholder="you@example.com" />}
    </FormField>
    <FormField
      label="Username"
      name="username"
      helperText="3 or more characters"
      validate={(value) => (String(value ?? "").length > 0 && String(value).length < 3 ? "Use 3 or more characters" : undefined)}
    >
      {(field) => <Input {...field} />}
    </FormField>
  </>
);
