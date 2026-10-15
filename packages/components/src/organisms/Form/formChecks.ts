import type { FormErrors, FormFieldRegistration } from "../../internal/formContext";
import {
  hasMessage,
  isConstraintControl,
  isPromiseLike,
  messageFor,
  readValues,
} from "./formHelpers";
import type { FormLabels, FormValidator } from "./Form.types";

/** What running the rules found: the answers that were ready at once, and a promise for the ones that weren't. */
export interface Checks {
  found: FormErrors;
  later: PromiseLike<FormErrors> | null;
}

interface RunChecksInput {
  form: HTMLFormElement;
  /** The fields registered with the form, by control id. */
  fields: ReadonlyMap<string, FormFieldRegistration>;
  validate: FormValidator | undefined;
  labels: FormLabels;
  /** Limits the checks to one field's key, for a check as that field is edited. */
  only?: string;
  /** Controls found invalid with no field of their own, by key; written to here. */
  looseTargets: Map<string, Element>;
}

const warnRuleFailed = (error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Form: a validation rule threw or rejected, so its field is shown as not checked.", error);
  }
};

// Everything wrong with the form right now: the browser's own rules first, then each field's rule, then the
// form's. The first message for a key wins, so a `required` field says so before a pattern rule says more.
// `only` limits it to one field, for a check as that field is edited.
export function runFormChecks({ form, fields, validate, labels, only, looseTargets }: RunChecksInput): Checks {
  const found: FormErrors = {};
  const tasks: Array<PromiseLike<FormErrors>> = [];
  const loose = looseTargets;
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
}

// What the sync answers and the late ones add up to: the sync ones win for a key, as they came first.
export const settleChecks = (checks: Checks): PromiseLike<FormErrors> =>
  checks.later
    ? Promise.resolve(checks.later).then((extra) => ({ ...extra, ...checks.found }))
    : Promise.resolve(checks.found);
