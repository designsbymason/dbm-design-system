# DBM Design System

> **Status: early development.** This is a standalone, dependency-light React component library, currently being built from the ground up. Not yet published to npm — nothing here is ready for use in a project yet.

An agentic, standalone React component library built for both AI coding agents and human developers to compose web and enterprise applications quickly, consistently, and accessibly. Token-driven, multi-brand, multi-theme (light/dark), and built with a strong TypeScript + JSDoc contract so AI agents can work against a structured, predictable API.

## Packages

This is a monorepo. Once published, packages will live under the `@dbm-design-system` npm scope:

- `@dbm-design-system/tokens` — design tokens (primitive + semantic layers)
- `@dbm-design-system/primitives` — headless behavior layer
- `@dbm-design-system/icons` — Phosphor Icons wrapper
- `@dbm-design-system/components` — the component library itself
- `@dbm-design-system/manifest` — agent-readable component manifest generator

None of these are published yet.

## Documentation

- `CLAUDE.md` — project orientation for AI coding agents working in this repo
- `guidelines/` — architecture decisions, token spec, component inventory, API conventions, and engineering standards

## License

MIT — see [`LICENSE`](./LICENSE).

## Contributing

This is a solo-maintained project. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) — external pull requests are not accepted, though the code is free to use and fork under the MIT license.
