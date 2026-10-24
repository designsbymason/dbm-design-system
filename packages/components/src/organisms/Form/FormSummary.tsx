import { cx, mergeRefs } from "@dbm-system/primitives";
import { forwardRef, useEffect, useId, type ReactNode } from "react";
import { Link } from "../../atoms/Link";
import { useForm } from "../../internal/formContext";
import { Alert } from "../../molecules/Alert";
import styles from "./Form.module.css";
import type { FormSummaryProps } from "./Form.types";

/**
 * A list of everything wrong with the form, as links that move focus to each control. Drawn as a danger `Alert`,
 * and shown only while there is something to list. Put it at the top of the form (or near its actions) and set the
 * form's `focusTarget="summary"` to have focus land on it when a submit is refused. It is not announced as it
 * appears: the form announces the count, and focus does the rest.
 *
 * @example
 * ```tsx
 * <Form focusTarget="summary" onSubmit={save}>
 *   <Form.Summary />
 *   …fields…
 * </Form>
 * ```
 */
export const FormSummary = forwardRef<HTMLDivElement, FormSummaryProps>(
  ({ title, className, ...props }, ref) => {
    const form = useForm();
    const titleId = useId();
    const outsideForm = form === null;
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && outsideForm) {
        console.warn("Form.Summary: rendered outside a <Form>, so there are no errors to list. Put it inside the form.");
      }
    }, [outsideForm]);
    if (!form) return null;
    const entries = Object.entries(form.errors).filter(([, error]) => Boolean(error));
    if (entries.length === 0) return null;

    return (
      // A group named by its heading, so focus moved here (a refused submit with `focusTarget="summary"`) is
      // announced as "3 problems with this form, group" and not as a nameless element.
      <div
        {...props}
        ref={mergeRefs(ref, form.setSummaryElement)}
        role="group"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(styles.summary, className)}
      >
        <Alert tone="danger" role="none">
          <Alert.Title id={titleId}>{title ?? form.summaryTitle(entries.length)}</Alert.Title>
          <Alert.Description>
            <ul className={styles.summaryList}>
              {entries.map(([key, error]) => {
                const field = form.getField(key);
                return (
                  <li key={key}>
                    {field ? (
                      <Link
                        href={`#${field.controlId}`}
                        onClick={(event) => {
                          event.preventDefault();
                          form.focusField(key);
                        }}
                      >
                        {field.label}: {error as ReactNode}
                      </Link>
                    ) : (
                      (error as ReactNode)
                    )}
                  </li>
                );
              })}
            </ul>
          </Alert.Description>
        </Alert>
      </div>
    );
  },
);
FormSummary.displayName = "Form.Summary";
