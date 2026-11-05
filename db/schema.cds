namespace vanstock.profile;

using {
  cuid,
  managed
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

type UploadStatus : String(10) enum {
  Success;
  Partial;
  Failed;
}

/** Van stock profile header: one per engineer / van */
entity Profiles : cuid, managed {
  @mandatory
  engineerId        : EngineerId;
  businessUnit      : ProfitCentre;
  dateCreated       : Date;
  @assert.range
  status            : ProfileStatus default 'Active';
  totalValueHive    : Amount default 0;
  totalValueNonHive : Amount default 0;
  totalValue        : Amount default 0;
  items             : Composition of many ProfileItems
                        on items.profile = $self;
  changes           : Association to many ChangeLog
                        on changes.engineerId = engineerId;
  archives          : Association to many ProfileArchive
                        on archives.engineerId = engineerId;
}

annotate Profiles with @assert.unique: {engineerId: [engineerId]};

/** Van stock profile inventory line */
entity ProfileItems : cuid {
  profile      : Association to Profiles;
  profitCentre : ProfitCentre;
  @mandatory
  partNumber   : PartNumber;
  quantity     : Quantity default 0;
  uom          : String(3) default 'EA';
  value        : Amount default 0;
  map          : Amount default 0;
}

/** Profit centres whose parts count as Hive products */
entity HiveProfitCentres {
  key profitCentre : ProfitCentre;
      description  : String(60);
}

/** Fixed value list for the upload scenario */
entity Scenarios {
  key code : Scenario;
      name : String(40);
}

/** One uploaded file and its processing result */
entity Uploads : cuid, managed {
  uploadNo   : Integer;
  @mandatory  @assert.range
  scenario   : Scenario default 'Upload';
  content    : LargeBinary @Core.MediaType: mediaType @Core.ContentDisposition.Filename: fileName;
  mediaType  : String(100) @Core.IsMediaType;
  fileName   : String(255);
  status     : UploadStatus;
  rowsTotal  : Integer default 0;
  rowsPosted : Integer default 0;
  rowsFailed : Integer default 0;
  messages   : Association to many UploadMessages
                 on messages.upload = $self;
  changes    : Association to many ChangeLog
                 on changes.upload = $self;
}

/** Row-level result messages of an upload (error log) */
entity UploadMessages : cuid {
  upload     : Association to Uploads;
  rowNo      : Integer;
  engineerId : EngineerId;
  partNumber : PartNumber;
  severity   : String(10);
  text       : String(500);
}

/** Change log: every quantity / value change posted to a profile */
entity ChangeLog : cuid, managed {
  upload         : Association to Uploads;
  scenario       : Scenario;
  engineerId     : EngineerId;
  partNumber     : PartNumber;
  profitCentre   : ProfitCentre;
  quantityOld    : Quantity;
  quantityChange : Quantity;
  quantityNew    : Quantity;
  valueOld       : Amount;
  valueChange    : Amount;
  valueNew       : Amount;
}

/** Archive: time-stamped snapshot of a profile (leaver / closed) */
entity ProfileArchive : cuid {
  archivedAt : Timestamp;
  engineerId : EngineerId;
  status     : ProfileStatus;
  totalValue : Amount;
  upload     : Association to Uploads;
  snapshot   : LargeString;
}
