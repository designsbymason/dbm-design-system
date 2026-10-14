import {
  cx,
  mergeDefined,
  mergeRefs,
  useAnnouncement,
  useResolvedResponsiveValue,
  type SpaceValue,
} from "@dbm-design-system/primitives";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "../../atoms/Button";
import { Link } from "../../atoms/Link";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { FieldGroupProvider, useFieldGroup } from "../../internal/fieldGroupContext";
import {
  FormProvider,
  useForm,
  type FormContextValue,
  type FormErrors,
  type FormFieldRegistration,
  type FormValues,
} from "../../internal/formContext";
import { Alert } from "../../molecules/Alert";
import styles from "./Form.module.css";
import type {
  FormActionsProps,
  FormLabels,
  FormProps,
  FormSubmitProps,
  FormSummaryProps,
} from "./Form.types";

const makeDefaultLabels = (formatNumber: (value: number) => string): FormLabels => ({
  summaryTitle: (count) =>
    count === 1 ? "There is 1 problem with this form" : `There are ${formatNumber(count)} problems with this form`,
  errorCount: (count) => (count === 1 ? "1 error." : `${formatNumber(count)} errors.`),
  invalidValue: "This value is not valid.",
});

// What a person can put focus on: the control itself, or the first of them inside a container (a radio group's
// `div` is the control's id, and the thing to focus is the radio in it).
const FOCUSABLE =
  'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])';

function focusWithin(element: Element) {
  const target = element.matches(FOCUSABLE) ? element : element.querySelector(FOCUSABLE);
  if (target instanceof HTMLElement) target.focus();
}

// What a browser calls a form control that takes part in constraint validation.
type ConstraintControl = Element & {
  name: string;
  validity: ValidityState;
  validationMessage: string;
  willValidate: boolean;
};

function isConstraintControl(element: Element): element is ConstraintControl {
  return "validity" in element && "willValidate" in element;
}

function readValues(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const [key, value] of formData.entries()) {
    const existing = values[key];
    if (existing === undefined) values[key] = value;
    else values[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  }
  return values;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as PromiseLike<unknown>).then === "function";
}

function hasKeys(errors: FormErrors) {
  return Object.keys(errors).length > 0;
}

/**
 * Whether an event came from this form's own controls. React sends an event from a portaled child (a dialog with a
 * form of its own, rendered inside this one) up to this form's handlers through the React tree, though its DOM is
 * elsewhere, so a handler that acts on anything it hears would validate or submit the wrong form.
 */
function belongsTo(form: HTMLFormElement, target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const owner = "form" in target ? (target as { form: HTMLFormElement | null }).form : null;
  return (owner ?? target.closest("form")) === form;
}

/**
 * A form: the native `<form>` plus the wiring that makes the fields inside it one thing. On submit it checks every
 * control (the browser's own rules, each `FormField`'s `validate`, and the form's), shows the messages in the
 * fields' own error slots, moves focus to the first one that is wrong and says how many there are; when it is
 * valid it hands `onSubmit` what the form holds, and while a returned promise runs the form is busy.
 *
 * It owns no values — each control keeps its own — and runs no rules of its own: it reads the browser's, and calls
 * the ones you write. Give each `FormField` a `name` and spread `{...field}` onto its control, so the control is
 * submitted under that name and its error is found by it. `ref` forwards to the `<form>`.
 *
 * @example
 * ```tsx
 * <Form aria-label="Sign up" onSubmit={(values) => api.signUp(values)}>
 *   <FormField label="Email" name="email" required>
 *     {(field) => <Input {...field} type="email" />}
 *   </FormField>
 *   <FormField label="Username" name="username" validate={(value) => (String(value).length < 3 ? "Use 3 or more characters" : undefined)}>
 *     {(field) => <Input {...field} />}
 *   </FormField>
 *   <Form.Summary />
 *   <Form.Actions>
 *     <Form.Submit>Create account</Form.Submit>
 *   </Form.Actions>
 * </Form>
 * ```
 */
const FormRoot = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      children,
      onSubmit,
      onSubmitError,
      onInvalidSubmit,
      validate,
      errors: externalErrors,
      onErrorsChange,
      validateOn = "submit",
      focusTarget = "field",
      disabled = false,
      size,
      gap = 4,
      noValidate = true,
      labels: labelOverrides,
      formatNumber = String,
      onChange,
      onBlur,
      onReset,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const formRef = useRef<HTMLFormElement | null>(null);
    const summaryRef = useRef<HTMLElement | null>(null);
    // The fields registered by control id. Held in state so the one Map lasts the form's life.
    const [fields] = useState(() => new Map<string, FormFieldRegistration>());
    // Controls found invalid with no field of their own, by the key their error was stored under.
    const looseTargetsRef = useRef(new Map<string, Element>());
    // Set when a submit has been refused: from then on each field is checked again as it is edited.
    const refusedRef = useRef(false);
    const warnedNamesRef = useRef(new Set<string>());

    const [localErrors, setLocalErrors] = useState<FormErrors>({});
    const [pending, setPending] = useState(false);
    const [focusRequest, setFocusRequest] = useState<{ id: number; key: string } | null>(null);
    const pendingRef = useRef(false);
    const mountedRef = useRef(false);
    const restoreFocusRef = useRef<HTMLElement | null>(null);

    const { message, announce } = useAnnouncement();
    const labels = mergeDefined(makeDefaultLabels(formatNumber), labelOverrides);
    const resolvedGap = useResolvedResponsiveValue<SpaceValue>(gap, 4);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    const registerField = useCallback(
      (registration: FormFieldRegistration) => {
        fields.set(registration.controlId, registration);
        return () => {
          if (fields.get(registration.controlId) === registration) fields.delete(registration.controlId);
        };
      },
      [fields],
    );

    const getField = useCallback(
      (key: string) => {
        for (const field of fields.values()) if (field.key === key) return field;
        return undefined;
      },
      [fields],
    );

    // The element an error is about: its field's control, else a control found invalid with that name or id.
    const resolveTarget = useCallback(
      (key: string): Element | null => {
        const form = formRef.current;
        if (!form) return null;
        const field = getField(key);
        if (field) return form.ownerDocument.getElementById(field.controlId);
        const loose = looseTargetsRef.current.get(key);
        if (loose?.isConnected) return loose;
        const named = form.elements.namedItem(key);
        if (named instanceof Element) return named;
        if (named) return (named as RadioNodeList)[0] instanceof Element ? ((named as RadioNodeList)[0] as Element) : null;
        return form.ownerDocument.getElementById(key);
      },
      [getField],
    );

    // Errors in the order their controls appear on the page, so the summary and the first focus follow it.
    const orderErrors = useCallback(
      (errors: FormErrors): FormErrors => {
        const entries = Object.entries(errors).map(([key, error], index) => ({
          key,
          error,
          index,
          element: resolveTarget(key),
        }));
        entries.sort((a, b) => {
          if (a.element && b.element && a.element !== b.element) {
            const position = a.element.compareDocumentPosition(b.element);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
          } else if (a.element !== b.element) {
            return a.element ? -1 : 1;
          }
          return a.index - b.index;
        });
        return Object.fromEntries(entries.map(({ key, error }) => [key, error]));
      },
      [resolveTarget],
    );

    // Everything wrong with the form right now: the browser's own rules first, then each field's rule, then the
    // form's. The first message for a key wins, so a `required` field says so before a pattern rule says more.
    const collectErrors = useCallback(
      (form: HTMLFormElement): FormErrors => {
        const found: FormErrors = {};
        const loose = looseTargetsRef.current;
        loose.clear();
        const values = readValues(new FormData(form));
        const byControlId = new Map<string, FormFieldRegistration>();
        for (const field of fields.values()) byControlId.set(field.controlId, field);

        Array.from(form.elements).forEach((element, index) => {
          if (!isConstraintControl(element) || !element.willValidate || element.validity.valid) return;
          const key = byControlId.get(element.id)?.key || element.name || element.id || `field-${index}`;
          if (key in found) return;
          found[key] = element.validationMessage || labels.invalidValue;
          if (!byControlId.has(element.id)) loose.set(key, element);
        });

        for (const field of fields.values()) {
          if (!field.validate || !field.name || field.key in found) continue;
          const result = field.validate(values[field.name], values);
          if (result) found[field.key] = result;
        }

        const formLevel = validate?.(values);
        if (formLevel) {
          for (const [key, result] of Object.entries(formLevel)) {
            if (result && !(key in found)) found[key] = result;
          }
        }
        return found;
      },
      [fields, validate, labels.invalidValue],
    );

    const focusField = useCallback(
      (key: string) => {
        const element = resolveTarget(key);
        if (element) focusWithin(element);
      },
      [resolveTarget],
    );

    // Focus moves after the render that shows the errors, so a summary asked for is there to receive it.
    useEffect(() => {
      if (!focusRequest || focusTarget === false) return;
      if (focusTarget === "summary" && summaryRef.current) {
        summaryRef.current.focus();
        return;
      }
      focusField(focusRequest.key);
    }, [focusRequest, focusTarget, focusField]);

    // When a submit that held the form busy finishes, focus the person was on (a disabled control drops it to the
    // page) goes back, but only if nothing else has it by then.
    useEffect(() => {
      if (pending) return;
      const element = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (!element || !element.isConnected) return;
      const active = element.ownerDocument.activeElement;
      if (active === null || active === element.ownerDocument.body) element.focus({ preventScroll: true });
    }, [pending]);

    const errors = useMemo(() => {
      const merged: FormErrors = { ...localErrors };
      for (const [key, error] of Object.entries(externalErrors ?? {})) {
        if (error) merged[key] = error;
      }
      return merged;
    }, [localErrors, externalErrors]);

    const parentGroup = useFieldGroup();
    const effectiveDisabled = disabled || pending;
    const groupSettings = useMemo(
      () => ({
        disabled: effectiveDisabled || Boolean(parentGroup?.disabled),
        size: size ?? parentGroup?.size,
      }),
      [effectiveDisabled, size, parentGroup],
    );

    const summaryTitle = labels.summaryTitle;
    const contextValue = useMemo<FormContextValue>(
      () => ({
        errors,
        registerField,
        getField,
        focusField,
        summaryTitle,
        pending,
        disabled: effectiveDisabled,
        summaryRef,
      }),
      [errors, registerField, getField, focusField, summaryTitle, pending, effectiveDisabled],
    );

    // The key a control's error is stored under: its field's, found from the control or the container it is in.
    const keyOf = (form: HTMLFormElement, target: EventTarget | null): string | null => {
      let element = target instanceof Element ? target : null;
      while (element && element !== form) {
        const registered = fields.get(element.id);
        if (registered) return registered.key;
        const name = (element as { name?: unknown }).name;
        if (typeof name === "string" && name) return name;
        element = element.parentElement;
      }
      return null;
    };

    const checkField = (form: HTMLFormElement, key: string) => {
      const found = collectErrors(form);
      setLocalErrors((previous) => {
        const next = { ...previous };
        if (key in found) next[key] = found[key];
        else delete next[key];
        return orderErrors(next);
      });
    };

    const handleChange = (event: ChangeEvent<HTMLFormElement>) => {
      onChange?.(event);
      const form = event.currentTarget;
      if (!belongsTo(form, event.target)) return;
      const key = keyOf(form, event.target);
      if (!key) return;
      if (externalErrors && externalErrors[key]) {
        const rest = { ...externalErrors };
        delete rest[key];
        onErrorsChange?.(rest);
      }
      if (refusedRef.current || validateOn === "change") checkField(form, key);
    };

    const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
      onBlur?.(event);
      const form = event.currentTarget;
      if (!belongsTo(form, event.target)) return;
      if (!refusedRef.current && validateOn === "submit") return;
      const key = keyOf(form, event.target);
      if (key) checkField(form, key);
    };

    const handleReset = (event: FormEvent<HTMLFormElement>) => {
      onReset?.(event);
      if (!belongsTo(event.currentTarget, event.target)) return;
      refusedRef.current = false;
      setLocalErrors({});
      if (externalErrors && hasKeys(externalErrors)) onErrorsChange?.({});
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      if (!belongsTo(form, event.target)) return;
      if (pendingRef.current || disabled) {
        event.preventDefault();
        return;
      }

      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const skipValidation = Boolean(submitter?.hasAttribute("formnovalidate"));

      if (process.env.NODE_ENV !== "production") {
        for (const field of fields.values()) {
          if (!field.name || warnedNamesRef.current.has(field.name)) continue;
          if (form.elements.namedItem(field.name) === null) {
            warnedNamesRef.current.add(field.name);
            console.warn(
              `Form: the field named "${field.name}" has no control submitted under that name. Spread the \`fieldProps\` the FormField hands back (\`{...field}\`) onto the control, so its value is submitted and its error can find it.`,
            );
          }
        }
      }

      if (!skipValidation) {
        const found = collectErrors(form);
        if (hasKeys(found)) {
          event.preventDefault();
          refusedRef.current = true;
          const ordered = orderErrors(found);
          setLocalErrors(ordered);
          const keys = Object.keys(ordered);
          announce(labels.errorCount(keys.length));
          setFocusRequest((previous) => ({ id: (previous?.id ?? 0) + 1, key: keys[0] as string }));
          onInvalidSubmit?.(ordered);
          return;
        }
      }

      refusedRef.current = false;
      setLocalErrors({});
      // Without an `onSubmit` the browser (or a form `action`) takes it from here.
      if (!onSubmit) return;
      event.preventDefault();

      const formData = new FormData(form);
      const result = onSubmit(readValues(formData), formData, event);
      if (!isPromiseLike(result)) return;

      pendingRef.current = true;
      setPending(true);
      const active = form.ownerDocument.activeElement;
      restoreFocusRef.current = active instanceof HTMLElement && form.contains(active) ? active : null;
      Promise.resolve(result)
        .then(undefined, (error: unknown) => {
          if (!onSubmitError) throw error;
          onSubmitError(error);
        })
        .finally(() => {
          pendingRef.current = false;
          if (mountedRef.current) setPending(false);
        });
    };

    return (
      // `{...props}` first, so the computed `noValidate`, handlers, `aria-busy` and `className` can't be replaced by
      // a same-named prop a caller passes (05-component-api-conventions.md §3).
      <form
        {...props}
        ref={mergeRefs(ref, formRef)}
        noValidate={noValidate}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onBlur={handleBlur}
        onReset={handleReset}
        aria-busy={pending || undefined}
        data-pending={pending ? "" : undefined}
        className={cx(styles.root, className)}
        style={{ "--form-gap": `var(--dbm-space-${resolvedGap})`, ...style } as CSSProperties}
      >
        <FormProvider value={contextValue}>
          <FieldGroupProvider value={groupSettings}>{children}</FieldGroupProvider>
        </FormProvider>
        <VisuallyHidden role="status">{message}</VisuallyHidden>
      </form>
    );
  },
);
FormRoot.displayName = "Form";

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
const FormSummary = forwardRef<HTMLDivElement, FormSummaryProps>(
  ({ title, className, ...props }, ref) => {
    const form = useForm();
    const hasWarnedRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (!form && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        console.warn("Form.Summary: rendered outside a <Form>, so there are no errors to list. Put it inside the form.");
      }
    }
    if (!form) return null;
    const entries = Object.entries(form.errors).filter(([, error]) => Boolean(error));
    if (entries.length === 0) return null;

    const setSummary = (node: HTMLDivElement | null) => {
      form.summaryRef.current = node;
    };

    return (
      <div {...props} ref={mergeRefs(ref, setSummary)} tabIndex={-1} className={cx(styles.summary, className)}>
        <Alert tone="danger" role="none">
          <Alert.Title>{title ?? form.summaryTitle(entries.length)}</Alert.Title>
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

/**
 * A row for the form's buttons: they wrap when they don't fit and take a row each on a phone. Pair it with
 * `Form.Submit`.
 *
 * @example
 * ```tsx
 * <Form.Actions align="end">
 *   <Button variant="ghost" type="reset">Reset</Button>
 *   <Form.Submit>Save</Form.Submit>
 * </Form.Actions>
 * ```
 */
const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
  ({ align = "start", className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cx(
        styles.actions,
        align === "end" && styles.alignEnd,
        align === "between" && styles.alignBetween,
        className,
      )}
    />
  ),
);
FormActions.displayName = "Form.Actions";

/**
 * The form's submit button: a `Button` with `type="submit"` that shows its loading state while the form's
 * `onSubmit` is running, and is disabled while the form is. Takes every other `Button` prop.
 *
 * @example
 * ```tsx
 * <Form.Submit loadingText="Saving…">Save</Form.Submit>
 * ```
 */
const FormSubmit = forwardRef<HTMLButtonElement, FormSubmitProps>(
  ({ isLoading, disabled, ...props }, ref) => {
    const form = useForm();
    return (
      <Button
        {...props}
        ref={ref}
        type="submit"
        isLoading={isLoading ?? form?.pending ?? false}
        disabled={disabled || form?.disabled}
      />
    );
  },
);
FormSubmit.displayName = "Form.Submit";

type FormComponent = typeof FormRoot & {
  Summary: typeof FormSummary;
  Actions: typeof FormActions;
  Submit: typeof FormSubmit;
};

export const Form: FormComponent = Object.assign(FormRoot, {
  Summary: FormSummary,
  Actions: FormActions,
  Submit: FormSubmit,
});
