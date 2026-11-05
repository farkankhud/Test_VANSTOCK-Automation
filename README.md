# SCRUM-7 – Van Stock Profile Upload

SAP CAP application for the mass upload of Van Stock Profiles (spec R2R.04.02), covering three scenarios:

| Scenario | File layout (CSV, first line = header) | Effect |
|---|---|---|
| Upload | Date Created, Engineer ID, Profit Centre, Part Number, Quantity, Value | Creates the profile if missing, adds new parts or increments existing ones |
| Return | Engineer ID, Part Number, Quantity, Value (optional, default = quantity × MAP) | Decrements the profile; error if the part is not in the profile or the quantity would go negative |
| Leaver | same as Return | Status Leaver → archive → Active → decrement → if no stock remains: Closed + archive again |

Sample files are in `samples/`. Invalid rows are skipped and logged on the upload; valid rows are posted.

## Entity model (`db/schema.cds`, namespace `vanstock.profile`)
- `Profiles` (header: engineer, business unit, date created, status, Hive / Non-Hive / total value) with composition `ProfileItems` (profit centre, part, quantity, UoM, value, MAP = value / quantity)
- `Uploads` (file, scenario, result counts) with `UploadMessages` (row error log)
- `ChangeLog` (every quantity/value change) and `ProfileArchive` (time-stamped JSON snapshot)
- `HiveProfitCentres` (profit centres counted as Hive products) and `Scenarios` (value list)

## UIs (generated with the SAP Fiori generator, Fiori Elements V4)
- `app/vanstockprofile` – upload app (create upload, pick scenario, attach CSV, save)
- `app/vanstockprofiledisplay` – read-only profile display with inventory, change log and archive

## Run locally
```
npm install
cds watch
```
Uses in-memory SQLite with mocked authentication.

## Deploy
A push to the branch runs the GitHub Actions pipeline (`.github/workflows/deploy.yml`): `mbt build` and `cf deploy` to SAP BTP Cloud Foundry with SAP HANA Cloud (HDI container `scrum-7-vanstock-profile-db`), XSUAA and a standalone approuter.
