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
  useImperativeHandle,
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
  type FormController,
  type FormErrors,
  type FormFieldRegistration,
  type FormState,
  type FormValues,
} from "../../internal/formContext";
import { Alert } from "../../molecules/Alert";
import styles from "./Form.module.css";
import type {
  FormActionsProps,
  FormErrorProps,
  FormLabels,
  FormProps,
  FormSubmitProps,
  FormSummaryProps,
} from "./Form.types";

const makeDefaultLabels = (formatNumber: (value: number) => string): FormLabels => {
  const shown = (value: string) =>
    value !== "" && !Number.isNaN(Number(value)) ? formatNumber(Number(value)) : value;
  return {
    summaryTitle: (count) =>
      count === 1 ? "There is 1 problem with this form" : `There are ${formatNumber(count)} problems with this form`,
    errorCount: (count) => (count === 1 ? "1 error." : `${formatNumber(count)} errors.`),
    invalidValue: "This value is not valid.",
    valueMissing: "Fill out this field.",
    typeMismatch: (type) =>
      type === "email" ? "Enter an email address." : type === "url" ? "Enter a web address." : "Use the right format for this field.",
    patternMismatch: "Use the format that was asked for.",
    tooShort: (minimum) =>
      minimum === 1 ? "Use at least 1 character." : `Use at least ${formatNumber(minimum)} characters.`,
    tooLong: (maximum) =>
      maximum === 1 ? "Use 1 character or fewer." : `Use ${formatNumber(maximum)} characters or fewer.`,
    rangeUnderflow: (minimum) => `Choose ${shown(minimum)} or more.`,
    rangeOverflow: (maximum) => `Choose ${shown(maximum)} or less.`,
    stepMismatch: "Choose one of the values that is allowed.",
    badInput: "Enter a value this field can read.",
    submitFailed: "Something went wrong, so nothing was sent. Try again.",
    validationFailed: "This couldn't be checked. Try again.",
  };
};

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

function hasMessage(message: ReactNode) {
  return message !== null && message !== undefined && message !== false && message !== "";
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

// The message for a control the browser calls invalid, in the page's words for the way it is wrong. A message the
// control wrote itself (a custom validity) is the control's own and is kept as it is.
function messageFor(element: ConstraintControl, labels: FormLabels): string {
  const validity = element.validity;
  const input = element as unknown as HTMLInputElement;
  if (validity.customError && element.validationMessage) return element.validationMessage;
  if (validity.valueMissing) return labels.valueMissing;
  if (validity.typeMismatch) return labels.typeMismatch(input.type || "text");
  if (validity.patternMismatch) return labels.patternMismatch;
  if (validity.tooShort) return labels.tooShort(input.minLength);
  if (validity.tooLong) return labels.tooLong(input.maxLength);
  if (validity.rangeUnderflow) return labels.rangeUnderflow(input.min);
  if (validity.rangeOverflow) return labels.rangeOverflow(input.max);
  if (validity.stepMismatch) return labels.stepMismatch;
  if (validity.badInput) return labels.badInput;
  return element.validationMessage || labels.invalidValue;
}

// What running the rules found: the answers that were ready at once, and a promise for the ones that weren't.
interface Checks {
  found: FormErrors;
  later: PromiseLike<FormErrors> | null;
}

const INERT_CONTROLLER: FormController = {
  form: null,
  submit: () => undefined,
  reset: () => undefined,
  focusField: () => undefined,
  validate: () => Promise.resolve(true),
  setErrors: () => undefined,
  clearErrors: () => undefined,
};

/**
 * A form: the native `<form>` plus the wiring that makes the fields inside it one thing. On submit it checks every
 * control (the browser's own rules, each `FormField`'s `validate`, and the form's), shows the messages in the
 * fields' own error slots, moves focus to the first one that is wrong and says how many there are; when it is
 * valid it hands `onSubmit` what the form holds, and while a returned promise runs the form is busy.
 *
 * It owns no values — each control keeps its own — and runs no rules of its own: it reads the browser's, and calls
 * the ones you write, which may return promises. Give each `FormField` a `name` and spread `{...field}` onto its
 * control, so the control is submitted under that name and its error is found by it. `ref` forwards to the
 * `<form>`; `controllerRef` (or `useFormController()` inside) gives `submit`, `reset`, `validate`, `focusField`
 * and `setErrors`.
 *
 * @example
 * ```tsx
 * <Form aria-label="Sign up" onSubmit={(values) => api.signUp(values)}>
 *   <FormField label="Email" name="email" required>
 *     {(field) => <Input {...field} type="email" />}
 *   </FormField>
 *   <FormField label="Username" name="username" validate={(value) => api.isTaken(String(value)).then((taken) => taken ? "That name is taken" : undefined)}>
 *     {(field) => <Input {...field} />}
 *   </FormField>
 *   <Form.Error />
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
      error: errorProp,
      validateOn = "submit",
      focusTarget = "field",
      disabled = false,
      size,
      gap = 4,
      noValidate = true,
      labels: labelOverrides,
      formatNumber = String,
      controllerRef,
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
    // Which check of a field is the latest, so an answer that arrives late for an earlier one is dropped.
    const tokensRef = useRef(new Map<string, number>());
    const errorSlotsRef = useRef(0);
    const setSummaryElement = useCallback((element: HTMLElement | null) => {
      summaryRef.current = element;
    }, []);
    // Set from the moment a submit is waiting on a rule or an `onSubmit`, so a second one is ignored.
    const busyRef = useRef(false);
    const bypassRef = useRef(false);
    const mountedRef = useRef(false);
    const restoreFocusRef = useRef<HTMLElement | null>(null);

    const [localErrors, setLocalErrors] = useState<FormErrors>({});
    const [pending, setPending] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validatingKeys, setValidatingKeys] = useState<ReadonlySet<string>>(() => new Set());
    const [submitFailed, setSubmitFailed] = useState(false);
    const [focusRequest, setFocusRequest] = useState<{ id: number; key: string } | null>(null);

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

    const registerErrorSlot = useCallback(() => {
      errorSlotsRef.current += 1;
      return () => {
        errorSlotsRef.current -= 1;
      };
    }, []);

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

    const focusField = useCallback(
      (key: string) => {
        const element = resolveTarget(key);
        if (element) focusWithin(element);
      },
      [resolveTarget],
    );

    const warnRuleFailed = (error: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Form: a validation rule threw or rejected, so its field is shown as not checked.", error);
      }
    };

    // Everything wrong with the form right now: the browser's own rules first, then each field's rule, then the
    // form's. The first message for a key wins, so a `required` field says so before a pattern rule says more.
    // `only` limits it to one field, for a check as that field is edited.
    const runChecks = (form: HTMLFormElement, only?: string): Checks => {
      const found: FormErrors = {};
      const tasks: Array<PromiseLike<FormErrors>> = [];
      const loose = looseTargetsRef.current;
      if (only === undefined) loose.clear();
      const values = readValues(new FormData(form));
      const byControlId = new Map<string, FormFieldRegistration>();
      for (const field of fields.values()) byControlId.set(field.controlId, field);

      Array.from(form.elements).forEach((element, index) => {
        if (!isConstraintControl(element) || !element.willValidate || element.validity.valid) return;
        const key = byControlId.get(element.id)?.key || element.name || element.id || `field-${index}`;
        if (only !== undefined && key !== only) return;
        if (key in found) return;
        found[key] = messageFor(element, labels);
        if (!byControlId.has(element.id)) loose.set(key, element);
      });

      for (const field of fields.values()) {
        if (!field.validate || !field.name || field.key in found) continue;
        if (only !== undefined && field.key !== only) continue;
        const key = field.key;
        const result = field.validate(values[field.name], values);
        if (isPromiseLike(result)) {
          tasks.push(
            Promise.resolve(result).then(
              (answer): FormErrors => (hasMessage(answer) ? { [key]: answer } : {}),
              (error: unknown): FormErrors => {
                warnRuleFailed(error);
                return { [key]: labels.validationFailed };
              },
            ),
          );
        } else if (hasMessage(result)) {
          found[key] = result;
        }
      }

      const keep = (answers: FormErrors | null | undefined | void): FormErrors => {
        const kept: FormErrors = {};
        if (!answers) return kept;
        for (const [key, answer] of Object.entries(answers)) {
          if (hasMessage(answer) && (only === undefined || key === only)) kept[key] = answer;
        }
        return kept;
      };
      const formLevel = validate?.(values);
      if (isPromiseLike(formLevel)) {
        tasks.push(
          Promise.resolve(formLevel).then(
            (answers) => keep(answers),
            (error: unknown): FormErrors => {
              warnRuleFailed(error);
              return only === undefined || only === "form" ? { form: labels.validationFailed } : {};
            },
          ),
        );
      } else {
        for (const [key, answer] of Object.entries(keep(formLevel))) {
          if (!(key in found)) found[key] = answer;
        }
      }

      const later = tasks.length
        ? Promise.all(tasks).then((lists) => {
            const merged: FormErrors = {};
            for (const list of lists) for (const [key, answer] of Object.entries(list)) if (!(key in merged)) merged[key] = answer;
            return merged;
          })
        : null;
      return { found, later };
    };

    // What the sync answers and the late ones add up to: the sync ones win for a key, as they came first.
    const settle = (checks: Checks): PromiseLike<FormErrors> =>
      checks.later
        ? Promise.resolve(checks.later).then((extra) => ({ ...extra, ...checks.found }))
        : Promise.resolve(checks.found);

    const applyRefused = (errors: FormErrors) => {
      refusedRef.current = true;
      const ordered = orderErrors(errors);
      setLocalErrors(ordered);
      const keys = Object.keys(ordered);
      announce(labels.errorCount(keys.length));
      setFocusRequest((previous) => ({ id: (previous?.id ?? 0) + 1, key: keys[0] as string }));
      onInvalidSubmit?.(ordered);
    };

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

    // The controller is one object for the form's life; each method reads the latest closure from here, which is
    // set after every commit, so none is stale and none changes identity.
    const latestRef = useRef<{
      validate: () => Promise<boolean>;
    } | null>(null);
    useEffect(() => {
      latestRef.current = {
        validate: async () => {
          const form = formRef.current;
          if (!form) return true;
          const found = await settle(runChecks(form));
          if (!mountedRef.current) return !hasKeys(found);
          if (hasKeys(found)) {
            applyRefused(found);
            return false;
          }
          refusedRef.current = false;
          setLocalErrors({});
          return true;
        },
      };
    });

    const controller = useMemo<FormController>(
      () => ({
        get form() {
          return formRef.current;
        },
        submit: () => formRef.current?.requestSubmit(),
        reset: () => formRef.current?.reset(),
        focusField,
        validate: () => latestRef.current?.validate() ?? Promise.resolve(true),
        setErrors: (next) => setLocalErrors((previous) => orderErrors({ ...previous, ...next })),
        clearErrors: () => {
          refusedRef.current = false;
          setLocalErrors({});
        },
      }),
      [focusField, orderErrors],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    const formError: ReactNode = hasMessage(errorProp) ? errorProp : submitFailed ? labels.submitFailed : null;
    const summaryTitle = labels.summaryTitle;
    const contextValue = useMemo<FormContextValue>(
      () => ({
        errors,
        registerField,
        getField,
        focusField,
        summaryTitle,
        pending,
        validating,
        validatingKeys,
        disabled: effectiveDisabled,
        submitFailed,
        formError,
        registerErrorSlot,
        controller,
        setSummaryElement,
      }),
      [
        errors,
        registerField,
        getField,
        focusField,
        summaryTitle,
        pending,
        validating,
        validatingKeys,
        effectiveDisabled,
        submitFailed,
        formError,
        registerErrorSlot,
        controller,
        setSummaryElement,
      ],
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

    const setKeyValidating = (key: string, on: boolean) => {
      setValidatingKeys((previous) => {
        if (previous.has(key) === on) return previous;
        const next = new Set(previous);
        if (on) next.add(key);
        else next.delete(key);
        return next;
      });
    };

    const checkField = (form: HTMLFormElement, key: string) => {
      const checks = runChecks(form, key);
      // Every check of a field is a newer one than any still waiting, so an older answer is dropped on arrival.
      const token = (tokensRef.current.get(key) ?? 0) + 1;
      tokensRef.current.set(key, token);
      setLocalErrors((previous) => {
        const next = { ...previous };
        if (key in checks.found) next[key] = checks.found[key];
        else delete next[key];
        return orderErrors(next);
      });
      if (!checks.later || key in checks.found) {
        setKeyValidating(key, false);
        return;
      }
      setKeyValidating(key, true);
      Promise.resolve(checks.later).then((extra) => {
        if (!mountedRef.current || tokensRef.current.get(key) !== token) return;
        setKeyValidating(key, false);
        if (hasMessage(extra[key])) setLocalErrors((previous) => orderErrors({ ...previous, [key]: extra[key] }));
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
      setSubmitFailed(false);
      if (externalErrors && hasKeys(externalErrors)) onErrorsChange?.({});
    };

    // Calls `onSubmit` with what the form holds; a promise holds the form busy until it settles.
    const runSubmit = (form: HTMLFormElement, event: FormEvent<HTMLFormElement>) => {
      const formData = new FormData(form);
      const result = onSubmit?.(readValues(formData), formData, event);
      if (!isPromiseLike(result)) return;

      busyRef.current = true;
      setPending(true);
      const active = form.ownerDocument.activeElement;
      restoreFocusRef.current = active instanceof HTMLElement && form.contains(active) ? active : null;
      Promise.resolve(result)
        .then(undefined, (error: unknown) => {
          if (mountedRef.current) setSubmitFailed(true);
          onSubmitError?.(error);
          // Shown by a `Form.Error`, or handed to `onSubmitError`; with neither, it is the page's to report.
          if (!onSubmitError && errorSlotsRef.current === 0) throw error;
        })
        .finally(() => {
          busyRef.current = false;
          if (mountedRef.current) setPending(false);
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      if (!belongsTo(form, event.target)) return;
      // A submit this form re-sent itself, once the rules that had to be waited for passed.
      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }
      if (busyRef.current || disabled) {
        event.preventDefault();
        return;
      }

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

      const nativeSubmitter = (event.nativeEvent as SubmitEvent).submitter;
      const submitter = nativeSubmitter instanceof HTMLElement ? nativeSubmitter : null;
      const skipValidation = Boolean(submitter?.hasAttribute("formnovalidate"));
      setSubmitFailed(false);

      // Valid: without an `onSubmit` the browser (or a form `action`) takes it from here.
      const proceed = (resend: boolean) => {
        refusedRef.current = false;
        setLocalErrors({});
        if (onSubmit) {
          if (resend) runSubmit(form, event);
          else {
            event.preventDefault();
            runSubmit(form, event);
          }
        } else if (resend) {
          bypassRef.current = true;
          form.requestSubmit(submitter && submitter.closest("form") === form ? (submitter as HTMLElement) : undefined);
        }
      };

      if (skipValidation) {
        proceed(false);
        return;
      }

      const checks = runChecks(form);
      if (!checks.later) {
        if (hasKeys(checks.found)) {
          event.preventDefault();
          applyRefused(checks.found);
          return;
        }
        proceed(false);
        return;
      }

      // A rule is asking something: hold the submit until every answer is in, then carry on as above.
      event.preventDefault();
      busyRef.current = true;
      setValidating(true);
      settle(checks).then((all) => {
        busyRef.current = false;
        if (!mountedRef.current) return;
        setValidating(false);
        if (hasKeys(all)) applyRefused(all);
        else proceed(true);
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
        aria-busy={pending || validating || undefined}
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
      <div {...props} ref={mergeRefs(ref, form.setSummaryElement)} tabIndex={-1} className={cx(styles.summary, className)}>
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
 * A message about the form as a whole, for a failure no field owns: the request didn't reach the server, a
 * permission was refused. It shows the form's `error` prop, or `labels.submitFailed` after an `onSubmit` promise
 * rejects, as a danger `Alert` that is announced when it appears, and shows nothing while there is no error. Its
 * being in the form is also what keeps a rejection from being left for the page to report.
 *
 * @example
 * ```tsx
 * <Form error={serverMessage} onSubmit={save}>
 *   <Form.Error />
 *   …
 * </Form>
 * ```
 */
const FormError = forwardRef<HTMLDivElement, FormErrorProps>(({ children, className, ...props }, ref) => {
  const form = useForm();
  const registerErrorSlot = form?.registerErrorSlot;
  useEffect(() => registerErrorSlot?.(), [registerErrorSlot]);

  const outsideForm = form === null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && outsideForm) {
      console.warn("Form.Error: rendered outside a <Form>, so there is no form error to show. Put it inside the form.");
    }
  }, [outsideForm]);
  if (!form || !hasMessage(form.formError)) return null;
  return (
    <div {...props} ref={ref} className={className}>
      <Alert tone="danger">
        <Alert.Description>{children ?? form.formError}</Alert.Description>
      </Alert>
    </div>
  );
});
FormError.displayName = "Form.Error";

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
 * `onSubmit` is running or a rule is being waited for, and is disabled while the form is. Takes every other
 * `Button` prop.
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
        isLoading={isLoading ?? Boolean(form?.pending || form?.validating)}
        disabled={disabled || form?.disabled}
      />
    );
  },
);
FormSubmit.displayName = "Form.Submit";

type FormComponent = typeof FormRoot & {
  Summary: typeof FormSummary;
  Error: typeof FormError;
  Actions: typeof FormActions;
  Submit: typeof FormSubmit;
};

export const Form: FormComponent = Object.assign(FormRoot, {
  Summary: FormSummary,
  Error: FormError,
  Actions: FormActions,
  Submit: FormSubmit,
});

/**
 * The form's controls, from a part of your own inside it: `submit()`, `reset()`, `validate()`, `focusField(name)`,
 * `setErrors()` and `clearErrors()`. One object for the form's life. Outside a `Form` it does nothing, with a
 * development warning.
 *
 * @example
 * ```tsx
 * function SaveShortcut() {
 *   const form = useFormController();
 *   useHotkey("mod+s", () => form.submit());
 *   return null;
 * }
 * ```
 */
export function useFormController(): FormController {
  const form = useForm();
  const outsideForm = form === null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && outsideForm) {
      console.warn("useFormController: called outside a <Form>, so it controls nothing. Call it from a component rendered inside the form.");
    }
  }, [outsideForm]);
  return form?.controller ?? INERT_CONTROLLER;
}

const IDLE_STATE: FormState = { pending: false, validating: false, disabled: false, errors: {}, submitFailed: false };

/**
 * What the form is doing and what it has found — `pending`, `validating`, `disabled`, `errors`, `submitFailed` — for
 * a part of your own that shows it (a "Saving…" label, a count in a tab). Outside a `Form` it reports an idle,
 * error-free form.
 *
 * @example
 * ```tsx
 * function ErrorCount() {
 *   const { errors } = useFormState();
 *   return <Badge tone="danger">{Object.keys(errors).length}</Badge>;
 * }
 * ```
 */
export function useFormState(): FormState {
  const form = useForm();
  return useMemo(
    () =>
      form
        ? {
            pending: form.pending,
            validating: form.validating,
            disabled: form.disabled,
            errors: form.errors,
            submitFailed: form.submitFailed,
          }
        : IDLE_STATE,
    [form],
  );
}
