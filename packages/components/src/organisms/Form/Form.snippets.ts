// The code shown under each story's "Show code" button on Form's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the result panel under the form, the fake request that takes a moment), which can't be pasted anywhere.
// Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.
//
// A snippet is JSX only, so it can't hold state: where an example needs a `useState`, the line is a comment above
// the JSX that uses it.

const email = `  <FormField label="Email" name="email" required>
    {(field) => <Input {...field} type="email" />}
  </FormField>`;

const username = `  <FormField label="Username" name="username" helperText="3 or more characters">
    {(field) => <Input {...field} />}
  </FormField>`;

const actions = `  <Form.Actions>
    <Form.Submit>Create account</Form.Submit>
  </Form.Actions>`;

const form = (attributes: string, children: string) =>
  `<Form${attributes ? ` ${attributes}` : ""}>\n${children}\n</Form>`;

export const formSnippets = {
  basic: `{/* Give each FormField a name and spread {...field} onto its control: the control is then submitted under that
    name, and its error is found by it. onSubmit is called only when every control is valid. */}
${form(
  'aria-label="Create account" onSubmit={(values) => createAccount(values)}',
  `${email}\n${username}\n${actions}`,
)}`,

  validation: `{/* The browser's own rules (required, type="email", pattern, minLength) are read and shown in the field's
    own error slot. A field's validate is its own rule: it gets the field's value and all the values. The form's
    validate is for a rule that spans fields. */}
<Form
  aria-label="Create account"
  onSubmit={(values) => createAccount(values)}
  validate={(values) =>
    values.password !== values.confirm ? { confirm: "The passwords don't match" } : undefined
  }
>
  <FormField label="Username" name="username" validate={(value) => (String(value).length < 3 ? "Use 3 or more characters" : undefined)}>
    {(field) => <Input {...field} />}
  </FormField>
  <FormField label="Password" name="password" required>
    {(field) => <PasswordInput {...field} />}
  </FormField>
  <FormField label="Confirm password" name="confirm" required>
    {(field) => <PasswordInput {...field} />}
  </FormField>
${actions}
</Form>`,

  summary: `{/* Form.Summary lists every problem as a link to its control, and shows only while there is one.
    focusTarget="summary" sends focus to it, rather than to the first invalid control, when a submit is refused. */}
<Form aria-label="Create account" focusTarget="summary" onSubmit={(values) => createAccount(values)}>
  <Form.Summary />
${email}
${username}
${actions}
</Form>`,

  validateOn: `{/* validateOn: "submit" (default) | "blur" | "change" — when a field is checked as it is edited, before a
    submit has been refused. Once one has, every field is checked as it is edited, so an error clears the moment
    the value is right. */}
<Form aria-label="Create account" validateOn="blur" onSubmit={(values) => createAccount(values)}>
${email}
${actions}
</Form>`,

  async: `{/* An onSubmit that returns a promise holds the form busy: aria-busy, every field disabled, Form.Submit
    loading, and a second submit ignored. A rejection goes to onSubmitError and the form is usable again. */}
<Form
  aria-label="Create account"
  onSubmit={async (values) => {
    await createAccount(values);
  }}
  onSubmitError={(error) => showFailure(error)}
>
${email}
  <Form.Actions>
    <Form.Submit loadingText="Creating…">Create account</Form.Submit>
  </Form.Actions>
</Form>`,

  serverErrors: `{/* const [errors, setErrors] = useState({});
    errors are the server's answer, by field name. When the person edits a field that has one, onErrorsChange is
    called with the errors to use instead, without that field. */}
<Form
  aria-label="Create account"
  errors={errors}
  onErrorsChange={setErrors}
  onSubmit={async (values) => {
    const result = await createAccount(values);
    if (!result.ok) setErrors({ email: "That email address is already registered" });
  }}
>
${email}
${actions}
</Form>`,

  asyncRule: `{/* A rule may return a promise: submit waits for the answer (the form is aria-busy and Form.Submit
    loading, the fields stay editable), and as the field is edited the latest answer wins. */}
<Form aria-label="Create account" onSubmit={(values) => createAccount(values)}>
  <FormField
    label="Username"
    name="username"
    validate={async (value) => ((await isTaken(String(value))) ? "That username is taken" : undefined)}
  >
    {(field) => <Input {...field} />}
  </FormField>
  <Form.Actions>
    <Form.Submit>Create account</Form.Submit>
  </Form.Actions>
</Form>`,

  formError: `{/* Form.Error shows the form's error prop, or labels.submitFailed after an onSubmit promise rejects, and
    nothing while there is no error. Its being in the form is also what handles the rejection. */}
<Form
  aria-label="Create account"
  error={serverMessage}
  onSubmit={async (values) => {
    await createAccount(values);
  }}
>
  <Form.Error />
${email}
  <Form.Actions>
    <Form.Submit loadingText="Creating…">Create account</Form.Submit>
  </Form.Actions>
</Form>`,

  controller: `{/* const formRef = useRef(null);  — a FormController: submit, reset, validate, focusField, setErrors, clearErrors
    A part inside the form gets the same object from useFormController(); useFormState() reads pending, errors… */}
<Button onClick={() => formRef.current?.submit()}>Save from the toolbar</Button>
<Form aria-label="Create account" controllerRef={formRef} onSubmit={(values) => createAccount(values)}>
${email}
</Form>`,

  labels: `{/* labels writes the form's own words: the summary heading and the count it announces, and one message for each
    way the browser can call a value wrong. Numbers go through formatNumber. */}
<Form
  aria-label="Créer un compte"
  onSubmit={(values) => createAccount(values)}
  labels={{
    valueMissing: "Remplissez ce champ.",
    typeMismatch: (type) => (type === "email" ? "Saisissez une adresse e-mail." : "Le format est incorrect."),
    tooShort: (minimum) => \`Utilisez au moins \${minimum} caractères.\`,
    errorCount: (count) => \`\${count} erreurs.\`,
    summaryTitle: (count) => \`\${count} problèmes dans ce formulaire\`,
  }}
>
${email}
${actions}
</Form>`,

  layout: `{/* Form lays its children out as a column (gap is a step on the spacing scale, or a breakpoint map).
    Group related fields with FieldGroup: it hands disabled and size to the fields inside, and the form's
    own disabled and size reach them the same way. */}
<Form aria-label="Delivery" gap={6} size="lg" onSubmit={(values) => saveAddress(values)}>
  <FieldGroup legend="Address" columns={{ base: 1, md: 3 }}>
    <FieldGroup.Item span={{ base: 1, md: 3 }}>
      <FormField label="Street" name="street" required>
        {(field) => <Input {...field} />}
      </FormField>
    </FieldGroup.Item>
    <FieldGroup.Item span={{ base: 1, md: 2 }}>
      <FormField label="City" name="city" required>
        {(field) => <Input {...field} />}
      </FormField>
    </FieldGroup.Item>
    <FieldGroup.Item>
      <FormField label="Postcode" name="postcode" required>
        {(field) => <Input {...field} />}
      </FormField>
    </FieldGroup.Item>
  </FieldGroup>
  <Form.Actions align="end">
    <Button type="reset" variant="ghost">Reset</Button>
    <Form.Submit>Save address</Form.Submit>
  </Form.Actions>
</Form>`,

  disabled: `{/* disabled disables every FormField inside, the submit button, and a submit. A form is also disabled,
    without this, while an onSubmit promise is running. */}
${form('aria-label="Create account" disabled', `${email}\n${actions}`)}`,

} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface FormPlaygroundSnippetArgs {
  validateOn?: string;
  focusTarget?: string | false;
  disabled?: boolean;
  size?: string;
  gap?: number | string;
  noValidate?: boolean;
  summary?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real form — the fields and the submit are what make a form mean anything, so they're always there.
 */
export function formPlaygroundSnippet(args: FormPlaygroundSnippetArgs): string {
  const attributes: string[] = ['aria-label="Create account"'];
  if (args.validateOn && args.validateOn !== "submit") attributes.push(`validateOn="${args.validateOn}"`);
  if (args.focusTarget === false) attributes.push("focusTarget={false}");
  else if (args.focusTarget && args.focusTarget !== "field") attributes.push(`focusTarget="${args.focusTarget}"`);
  if (args.disabled) attributes.push("disabled");
  if (args.size && args.size !== "default") attributes.push(`size="${args.size}"`);
  if (args.gap !== undefined && Number(args.gap) !== 4) attributes.push(`gap={${Number(args.gap)}}`);
  if (args.noValidate === false) attributes.push("noValidate={false}");
  attributes.push("onSubmit={(values) => createAccount(values)}");
  const children = [args.summary ? "  <Form.Summary />" : undefined, email, username, actions].filter(Boolean).join("\n");
  return form(attributes.join(" "), children);
}
