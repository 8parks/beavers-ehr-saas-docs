# beavers-ehr-saas-docs

> Architectural decision records and security design documentation for an AWS-native multi-tenant EHR SaaS platform.

## Documentation Site

📖 **[View Docs →](https://your-org.github.io/beavers-ehr-saas-docs/)**

Korean is the primary language. English version is in progress.

## Local Development

```bash
npm install
npm run docs:dev
```

Then open `http://localhost:5173`.

## Repository Structure

```
beavers-ehr-saas-docs/
├── docs/
│   ├── index.md              # Landing page (language selector)
│   ├── .vitepress/
│   │   └── config.ts         # VitePress config (i18n, nav, sidebar)
│   ├── ko/                   # Korean documentation (primary)
│   │   ├── 01-system-context.md
│   │   ├── 02-reference-architecture.md
│   │   ├── 03-adr/           # Architectural Decision Records (ADR-001~010)
│   │   ├── 04-threat-modeling.md
│   │   ├── 05-compliance-mapping.md
│   │   ├── 06-scenario-design/
│   │   ├── 07-security-control-catalog.md
│   │   ├── 08-verification-checklist.md
│   │   ├── 09-diagrams.md
│   │   ├── 10-limitations.md
│   │   └── 11-references.md
│   └── en/                   # English documentation (in progress)
└── .github/workflows/
    └── deploy.yml            # GitHub Pages deployment
```

