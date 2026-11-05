namespace vanstock.profile;

using {
  cuid,
  managed,
  sap.common.CodeList
} from '@sap/cds/common';

type EngineerId   : String(20);
type PartNumber   : String(40);
type ProfitCentre : String(10);
type Quantity     : Decimal(13, 3);
type Amount       : Decimal(15, 2);

type ProfileStatus : String(10) enum {
  Active;
  Leaver;
  Closed;
}

type Scenario : String(10) enum {
  Upload;
  Return;
  Leaver;
}

type UploadStatus : String(20) enum {
  Processed;
  ProcessedWithErrors;
  Failed;
}

type LogResult : String(1) enum {
  Success = 'S';
  Error   = 'E';
  Info    = 'I';
}

/** Van stock profile header, one per engineer / van */
entity Profiles : managed {
  key engineerId        : EngineerId;
      dateCreated       : Date;
      businessUnit      : ProfitCentre;
      status            : ProfileStatus default 'Active';
      totalValueHive    : Amount default 0;
      totalValueNonHive : Amount default 0;
      totalValue        : Amount default 0;
      items             : Composition of many ProfileItems
                            on items.profile = $self;
      changeLogs        : Association to many ChangeLogs
                            on changeLogs.engineerId = engineerId;
      archives          : Association to many ProfileArchives
                            on archives.engineerId = engineerId;
}

/** Inventory record of a profile */
entity ProfileItems : cuid, managed {
  profile      : Association to Profiles;
  profitCentre : ProfitCentre;
  partNumber   : PartNumber;
  quantity     : Quantity default 0;
  uom          : String(3) default 'EA';
  value        : Amount default 0;
  map          : Amount default 0;
}

/** Profit centres whose parts count as Hive products in the footer totals */
entity HiveProfitCentres {
  key profitCentre : ProfitCentre;
      description  : String(60);
}

/** One uploaded file (profile upload, return or leaver) */
entity Uploads : cuid, managed {
  uploadNo    : Integer;
  scenario    : Association to Scenarios;
  content     : LargeBinary @Core.MediaType: mediaType  @Core.ContentDisposition.Filename: fileName;
  mediaType   : String(100) @Core.IsMediaType;
  fileName    : String(255);
  status      : UploadStatus;
  totalRows   : Integer default 0;
  successRows : Integer default 0;
  errorRows   : Integer default 0;
  logs        : Association to many ChangeLogs
                  on logs.upload = $self;
}

/** Upload scenarios: profile upload, return, leaver */
entity Scenarios : CodeList {
  key code : Scenario;
}

/** Change log: one entry per processed file line */
entity ChangeLogs : cuid, managed {
  upload         : Association to Uploads;
  lineNo         : Integer;
  scenario       : Scenario;
  engineerId     : EngineerId;
  partNumber     : PartNumber;
  oldQuantity    : Quantity;
  quantityChange : Quantity;
  newQuantity    : Quantity;
  valueChange    : Amount;
  result         : LogResult;
  message        : String(255);
}

/** Archive: time-stamped snapshot of a profile (leaver / closed) */
entity ProfileArchives : cuid, managed {
  engineerId : EngineerId;
  status     : ProfileStatus;
  archivedAt : Timestamp;
  upload     : Association to Uploads;
  snapshot   : LargeString;
}
