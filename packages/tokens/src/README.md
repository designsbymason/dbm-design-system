Token JSON files live here (built out in Phase 2; corrected 2026-08-12 — this file previously described them as "not yet in place," which stopped being true back in Phase 2). Structure, per `guidelines/03-token-system-spec.md`:

```
src/
├── primitive/
│   ├── color.json
│   ├── typography.json
│   ├── spacing.json
│   ├── radius.json
│   ├── shadow.json
│   ├── breakpoint.json
│   ├── motion.json
│   └── other.json
└── semantic/
    ├── purple-light.json
    ├── purple-dark.json
    ├── emerald-light.json
    └── emerald-dark.json
```

The Style Dictionary pipeline that builds these into CSS custom properties + typed TS constants lives at `packages/tokens/style-dictionary.config.js`, output in `packages/tokens/build/`. See `guidelines/03-token-system-spec.md` for the full spec, OKLCH color-generation methodology, and the running WCAG contrast-verification log.
