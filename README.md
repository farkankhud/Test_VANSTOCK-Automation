# SCRUM-8 – Van Stock Profile Upload

SAP CAP application for the mass maintenance of Van Stock Profiles (spec R2R.04.02).
Excel (.xlsx) or CSV files are uploaded in a Fiori Elements app and applied to the profiles in SAP HANA Cloud.

## Scenarios

| Scenario | File columns | Effect |
|---|---|---|
| Profile Upload | Date Created, Engineer ID, Profit Centre, Part Number, Quantity, Value (UOM optional, default EA) | Creates the profile if it does not exist, adds new parts, increments existing parts |
| Return | Engineer ID, Part Number, Quantity, Value (optional, default quantity x MAP) | Decrements the parts; unknown parts or negative quantities are logged as errors |
| Leaver | Engineer ID, Part Number, Quantity, Value | Archives the profile as Leaver, decrements the parts, then closes and archives the profile when no stock is left (otherwise it goes back to Active pending Finance write-off) |

Each line is processed on its own: valid lines are posted, invalid lines are written to the change log as errors.
Sample files are in `samples/`.

## Entity model (`db/schema.cds`, namespace `vanstock.profile`)

- `Profiles` – header per engineer: date created, business unit, status (Active / Leaver / Closed), totals (Hive, Non-Hive, Total)
- `ProfileItems` – inventory records: profit centre, part number, quantity, UOM, value, MAP (value / quantity)
- `Uploads` – one uploaded file with scenario and processing result
- `ChangeLogs` – change log, one entry per file line
- `ProfileArchives` – time-stamped JSON snapshots of a profile (leaver / closed)
- `HiveProfitCentres` – profit centres counted as Hive products
- `Scenarios` – code list Upload / Return / Leaver

## Apps

- `app/vanstockupload` – upload app (create an upload, choose the scenario, attach the file, save)
- `app/vanstockprofiles` – read-only display of profiles, inventory, change log and archive

## Run locally

```sh
npm install
cds watch
```

Uses SQLite in memory with the sample data in `db/data`.

## Deployment

A push to the branch runs the GitHub Actions pipeline: `mbt build` and `cf deploy` to SAP BTP Cloud Foundry
with SAP HANA Cloud (HDI container), XSUAA and a standalone approuter.
