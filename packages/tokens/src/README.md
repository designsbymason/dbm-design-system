Token JSON files are not yet in place. Per `guidelines/03-token-system-spec.md`, this directory will hold:

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

The Style Dictionary build pipeline that consumes these is set up in Phase 2, once the token files themselves are provided.
