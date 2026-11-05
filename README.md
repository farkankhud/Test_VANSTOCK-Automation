# Test_VANSTOCK-Automation

Workspace for the CAP Dev Agent. `main` holds only the deployment pipeline.

Each app lives on its own `feature/<KEY>-<slug>` or `bugfix/<KEY>-<slug>` branch as a SAP CAP project:
- SAP HANA Cloud (HDI container) in production, SQLite for local runs
- Fiori Elements V4 UI generated with the SAP Fiori app generator
- Standalone approuter with XSUAA

A push to any branch runs `.github/workflows/deploy.yml`, which scaffolds (cds add + Fiori generator) when needed, builds the MTA and deploys it to SAP BTP Cloud Foundry.

Required repository secrets: `CF_API`, `CF_USER`, `CF_PASSWORD`, `CF_ORG`, `CF_SPACE`.
