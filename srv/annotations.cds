using AdminService from './admin-service';

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------
annotate AdminService.Uploads with @(
  UI.UpdateHidden    : true,
  UI.DeleteHidden    : true,
  UI.HeaderInfo      : {
    TypeName      : '{i18n>Upload}',
    TypeNamePlural: '{i18n>Uploads}',
    Title         : {Value: uploadNo},
    Description   : {Value: scenario}
  },
  UI.SelectionFields : [
    scenario,
    status,
    createdBy
  ],
  UI.LineItem        : [
    {Value: uploadNo},
    {Value: scenario},
    {Value: fileName},
    {Value: status},
    {Value: rowsTotal},
    {Value: rowsPosted},
    {Value: rowsFailed},
    {Value: createdAt},
    {Value: createdBy}
  ],
  UI.FieldGroup #General: {Data: [
    {Value: scenario},
    {Value: content},
    {Value: fileName}
  ]},
  UI.FieldGroup #Result: {Data: [
    {Value: uploadNo},
    {Value: status},
    {Value: rowsTotal},
    {Value: rowsPosted},
    {Value: rowsFailed},
    {Value: createdAt},
    {Value: createdBy}
  ]},
  UI.Facets          : [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'General',
      Label : '{i18n>General}',
      Target: '@UI.FieldGroup#General'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Result',
      Label : '{i18n>Result}',
      Target: '@UI.FieldGroup#Result'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Messages',
      Label : '{i18n>Messages}',
      Target: 'messages/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'ChangeLog',
      Label : '{i18n>ChangeLog}',
      Target: 'changes/@UI.LineItem'
    }
  ]
);

annotate AdminService.Uploads with {
  uploadNo   @title: '{i18n>UploadNo}';
  scenario   @title: '{i18n>Scenario}'  @Common.ValueListWithFixedValues  @Common.ValueList: {
    CollectionPath: 'Scenarios',
    Parameters    : [
      {
        $Type            : 'Common.ValueListParameterInOut',
        LocalDataProperty: scenario,
        ValueListProperty: 'code'
      },
      {
        $Type            : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty: 'name'
      }
    ]
  };
  content    @title: '{i18n>File}';
  fileName   @title: '{i18n>FileName}';
  mediaType  @title: '{i18n>MediaType}';
  status     @title: '{i18n>UploadStatus}';
  rowsTotal  @title: '{i18n>RowsTotal}';
  rowsPosted @title: '{i18n>RowsPosted}';
  rowsFailed @title: '{i18n>RowsFailed}';
};

annotate AdminService.Scenarios with {
  code @title: '{i18n>Scenario}';
  name @title: '{i18n>ScenarioName}';
};

// ---------------------------------------------------------------------------
// Upload messages (error log)
// ---------------------------------------------------------------------------
annotate AdminService.UploadMessages with @(UI.LineItem: [
  {Value: rowNo},
  {Value: severity},
  {Value: engineerId},
  {Value: partNumber},
  {Value: text}
]) {
  rowNo      @title: '{i18n>RowNo}';
  severity   @title: '{i18n>Severity}';
  engineerId @title: '{i18n>EngineerId}';
  partNumber @title: '{i18n>PartNumber}';
  text       @title: '{i18n>Text}';
};

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
annotate AdminService.Profiles with @(
  UI.HeaderInfo      : {
    TypeName      : '{i18n>Profile}',
    TypeNamePlural: '{i18n>Profiles}',
    Title         : {Value: engineerId},
    Description   : {Value: status}
  },
  UI.SelectionFields : [
    engineerId,
    businessUnit,
    status
  ],
  UI.LineItem        : [
    {Value: engineerId},
    {Value: businessUnit},
    {Value: dateCreated},
    {Value: status},
    {Value: totalValueHive},
    {Value: totalValueNonHive},
    {Value: totalValue}
  ],
  UI.FieldGroup #General: {Data: [
    {Value: engineerId},
    {Value: businessUnit},
    {Value: dateCreated},
    {Value: status}
  ]},
  UI.FieldGroup #Totals : {Data: [
    {Value: totalValueHive},
    {Value: totalValueNonHive},
    {Value: totalValue}
  ]},
  UI.Facets          : [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'General',
      Label : '{i18n>General}',
      Target: '@UI.FieldGroup#General'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Totals',
      Label : '{i18n>Totals}',
      Target: '@UI.FieldGroup#Totals'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Items',
      Label : '{i18n>Items}',
      Target: 'items/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'ChangeLog',
      Label : '{i18n>ChangeLog}',
      Target: 'changes/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Archive',
      Label : '{i18n>Archive}',
      Target: 'archives/@UI.LineItem'
    }
  ]
);

annotate AdminService.Profiles with {
  engineerId        @title: '{i18n>EngineerId}';
  businessUnit      @title: '{i18n>BusinessUnit}';
  dateCreated       @title: '{i18n>DateCreated}';
  status            @title: '{i18n>Status}';
  totalValueHive    @title: '{i18n>TotalValueHive}';
  totalValueNonHive @title: '{i18n>TotalValueNonHive}';
  totalValue        @title: '{i18n>TotalValue}';
};

annotate AdminService.ProfileItems with @(UI.LineItem: [
  {Value: profitCentre},
  {Value: partNumber},
  {Value: quantity},
  {Value: uom},
  {Value: value},
  {Value: map}
]) {
  profitCentre @title: '{i18n>ProfitCentre}';
  partNumber   @title: '{i18n>PartNumber}';
  quantity     @title: '{i18n>Quantity}';
  uom          @title: '{i18n>Uom}';
  value        @title: '{i18n>Value}';
  map          @title: '{i18n>Map}';
};

// ---------------------------------------------------------------------------
// Change log and archive
// ---------------------------------------------------------------------------
annotate AdminService.ChangeLog with @(UI.LineItem: [
  {Value: createdAt},
  {Value: scenario},
  {Value: engineerId},
  {Value: partNumber},
  {Value: profitCentre},
  {Value: quantityOld},
  {Value: quantityChange},
  {Value: quantityNew},
  {Value: valueOld},
  {Value: valueChange},
  {Value: valueNew}
]) {
  scenario       @title: '{i18n>Scenario}';
  engineerId     @title: '{i18n>EngineerId}';
  partNumber     @title: '{i18n>PartNumber}';
  profitCentre   @title: '{i18n>ProfitCentre}';
  quantityOld    @title: '{i18n>QuantityOld}';
  quantityChange @title: '{i18n>QuantityChange}';
  quantityNew    @title: '{i18n>QuantityNew}';
  valueOld       @title: '{i18n>ValueOld}';
  valueChange    @title: '{i18n>ValueChange}';
  valueNew       @title: '{i18n>ValueNew}';
};

annotate AdminService.ProfileArchive with @(UI.LineItem: [
  {Value: archivedAt},
  {Value: engineerId},
  {Value: status},
  {Value: totalValue}
]) {
  archivedAt @title: '{i18n>ArchivedAt}';
  engineerId @title: '{i18n>EngineerId}';
  status     @title: '{i18n>Status}';
  totalValue @title: '{i18n>TotalValue}';
  snapshot   @title: '{i18n>Snapshot}';
};

annotate AdminService.HiveProfitCentres with {
  profitCentre @title: '{i18n>HiveProfitCentre}';
  description  @title: '{i18n>Description}';
};
