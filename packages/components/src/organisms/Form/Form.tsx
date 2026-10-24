import {
  cx,
  mergeDefined,
  mergeRefs,
  useAnnouncement,
  useResolvedResponsiveValue,
  type SpaceValue,
} from "@dbm-system/utils";
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
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { FieldGroupProvider, useFieldGroup } from "../../internal/fieldGroupContext";
import {
  FormProvider,
  type FormContextValue,
  type FormController,
  type FormErrors,
  type FormFieldRegistration,
} from "../../internal/formContext";
import styles from "./Form.module.css";
import { FormActions } from "./FormActions";
import { runFormChecks, settleChecks, type Checks } from "./formChecks";
import { FormError } from "./FormError";
import {
  belongsTo,
  focusWithin,
  hasKeys,
  hasMessage,
  isPromiseLike,
  makeDefaultLabels,
  readValues,
} from "./formHelpers";
import { FormSubmit } from "./FormSubmit";
import { FormSummary } from "./FormSummary";
import type { FormProps } from "./Form.types";

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
      requiredLegend = false,
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
    // The control ids of the fields marked required, so the required-fields legend shows only while one exists.
    const requiredIdsRef = useRef(new Set<string>());
    const [hasRequired, setHasRequired] = useState(false);
    const hasRequiredRef = useRef(false);
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
        const requiredIds = requiredIdsRef.current;
        // Sets the state only when the answer to "is any field required" changes. A field that registers again
        // with a new `validate` (every parent render) leaves it as it was, so it costs the form no render.
        const syncHasRequired = () => {
          const next = requiredIds.size > 0;
          if (hasRequiredRef.current === next) return;
          hasRequiredRef.current = next;
          setHasRequired(next);
        };
        if (registration.required) {
          requiredIds.add(registration.controlId);
          syncHasRequired();
        }
        return () => {
          if (fields.get(registration.controlId) === registration) fields.delete(registration.controlId);
          if (registration.required) {
            requiredIds.delete(registration.controlId);
            // After the field's next registration, if it is coming, so a re-register doesn't flicker the answer.
            queueMicrotask(() => {
              if (mountedRef.current) syncHasRequired();
            });
          }
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

    const runChecks = (form: HTMLFormElement, only?: string): Checks =>
      runFormChecks({ form, fields, validate, labels, only, looseTargets: looseTargetsRef.current });

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
          const found = await settleChecks(runChecks(form));
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
          // The submit event this causes is heard by `handleSubmit`, which clears the flag. If the browser's own
          // validation (`noValidate={false}`) refuses the re-send, no event comes, so clear it here: left set, it
          // would let the person's next real submit through unchecked.
          bypassRef.current = true;
          try {
            form.requestSubmit(submitter && submitter.closest("form") === form ? (submitter as HTMLElement) : undefined);
          } finally {
            bypassRef.current = false;
          }
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
      settleChecks(checks).then((all) => {
        busyRef.current = false;
        if (!mountedRef.current) return;
        setValidating(false);
        if (hasKeys(all)) applyRefused(all);
        else proceed(true);
      });
    };

    const showLegend = hasRequired && hasMessage(requiredLegend) && requiredLegend !== false;

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
        {showLegend && (
          <p className={styles.requiredLegend}>
            {requiredLegend === true ? (
              <>
                <span className={styles.requiredMark} aria-hidden="true">
                  *
                </span>{" "}
                {labels.requiredLegend}
              </>
            ) : (
              requiredLegend
            )}
          </p>
        )}
        <FormProvider value={contextValue}>
          <FieldGroupProvider value={groupSettings}>{children}</FieldGroupProvider>
        </FormProvider>
        <VisuallyHidden role="status">{message}</VisuallyHidden>
      </form>
    );
  },
);
FormRoot.displayName = "Form";

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

export { useFormController, useFormState } from "./formHooks";
