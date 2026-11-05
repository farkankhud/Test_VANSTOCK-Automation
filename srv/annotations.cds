using AdminService from './admin-service';

// ---------------------------------------------------------------- Uploads
annotate AdminService.Uploads with @(
  UI.UpdateHidden    : true,
  UI.DeleteHidden    : true,
  UI.HeaderInfo      : {
    TypeName      : '{i18n>Upload}',
    TypeNamePlural: '{i18n>Uploads}',
    Title         : {Value: uploadNo},
    Description   : {Value: scenario.name}
  },
  UI.SelectionFields : [
    scenario_code,
    status,
    createdBy
  ],
  UI.LineItem        : [
    {Value: uploadNo},
    {Value: scenario_code},
    {Value: fileName},
    {Value: status},
    {Value: totalRows},
    {Value: successRows},
    {Value: errorRows},
    {Value: createdAt},
    {Value: createdBy}
  ],
  UI.FieldGroup #General: {Data: [
    {Value: scenario_code},
    {Value: content}
  ]},
  UI.FieldGroup #Result : {Data: [
    {Value: status},
    {Value: totalRows},
    {Value: successRows},
    {Value: errorRows},
    {Value: fileName},
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
      Label : '{i18n>UploadResult}',
      Target: '@UI.FieldGroup#Result'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Logs',
      Label : '{i18n>ChangeLogs}',
      Target: 'logs/@UI.LineItem'
    }
  ]
) {
  uploadNo    @title: '{i18n>UploadNo}';
  scenario    @title: '{i18n>Scenario}'
              @Common.Text: scenario.name
              @Common.TextArrangement: #TextOnly
              @Common.ValueListWithFixedValues;
  content     @title: '{i18n>File}';
  fileName    @title: '{i18n>FileName}';
  mediaType   @title: '{i18n>MediaType}';
  status      @title: '{i18n>UploadStatus}';
  totalRows   @title: '{i18n>TotalRows}';
  successRows @title: '{i18n>SuccessRows}';
  errorRows   @title: '{i18n>ErrorRows}';
  createdAt   @title: '{i18n>CreatedAt}';
  createdBy   @title: '{i18n>CreatedBy}';
};

annotate AdminService.Scenarios with {
  code @title: '{i18n>Scenario}'  @Common.Text: name  @Common.TextArrangement: #TextOnly;
};

// ---------------------------------------------------------------- Change log
annotate AdminService.ChangeLogs with @(
  UI.HeaderInfo: {
    TypeName      : '{i18n>ChangeLog}',
    TypeNamePlural: '{i18n>ChangeLogs}',
    Title         : {Value: engineerId}
  },
  UI.LineItem  : [
    {Value: lineNo},
    {Value: engineerId},
    {Value: partNumber},
    {Value: oldQuantity},
    {Value: quantityChange},
    {Value: newQuantity},
    {Value: valueChange},
    {
      Value      : result,
      Criticality: resultCriticality
    },
    {Value: message},
    {Value: createdAt}
  ]
) {
  lineNo         @title: '{i18n>LineNo}';
  scenario       @title: '{i18n>Scenario}';
  engineerId     @title: '{i18n>EngineerId}';
  partNumber     @title: '{i18n>PartNumber}';
  oldQuantity    @title: '{i18n>OldQuantity}';
  quantityChange @title: '{i18n>QuantityChange}';
  newQuantity    @title: '{i18n>NewQuantity}';
  valueChange    @title: '{i18n>ValueChange}';
  result         @title: '{i18n>Result}';
  message        @title: '{i18n>Message}';
  createdAt      @title: '{i18n>CreatedAt}';
};

// ---------------------------------------------------------------- Profiles
annotate AdminService.Profiles with @(
  UI.HeaderInfo      : {
    TypeName      : '{i18n>Profile}',
    TypeNamePlural: '{i18n>Profiles}',
    Title         : {Value: engineerId},
    Description   : {Value: businessUnit}
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
    {
      Value      : status,
      Criticality: statusCriticality
    },
    {Value: totalValueHive},
    {Value: totalValueNonHive},
    {Value: totalValue}
  ],
  UI.FieldGroup #General: {Data: [
    {Value: engineerId},
    {Value: dateCreated},
    {Value: businessUnit},
    {
      Value      : status,
      Criticality: statusCriticality
    }
  ]},
  UI.FieldGroup #Footer : {Data: [
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
      ID    : 'Items',
      Label : '{i18n>ProfileItems}',
      Target: 'items/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Footer',
      Label : '{i18n>Footer}',
      Target: '@UI.FieldGroup#Footer'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'ChangeLogs',
      Label : '{i18n>ChangeLogs}',
      Target: 'changeLogs/@UI.LineItem'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Archives',
      Label : '{i18n>ProfileArchives}',
      Target: 'archives/@UI.LineItem'
    }
  ]
) {
  engineerId        @title: '{i18n>EngineerId}';
  dateCreated       @title: '{i18n>DateCreated}';
  businessUnit      @title: '{i18n>BusinessUnit}';
  status            @title: '{i18n>ProfileStatus}';
  totalValueHive    @title: '{i18n>TotalValueHive}';
  totalValueNonHive @title: '{i18n>TotalValueNonHive}';
  totalValue        @title: '{i18n>TotalValue}';
};

annotate AdminService.ProfileItems with @(
  UI.HeaderInfo: {
    TypeName      : '{i18n>ProfileItem}',
    TypeNamePlural: '{i18n>ProfileItems}',
    Title         : {Value: partNumber}
  },
  UI.LineItem  : [
    {Value: profitCentre},
    {Value: partNumber},
    {Value: quantity},
    {Value: uom},
    {Value: value},
    {Value: map}
  ]
) {
  profitCentre @title: '{i18n>ProfitCentre}';
  partNumber   @title: '{i18n>PartNumber}';
  quantity     @title: '{i18n>Quantity}';
  uom          @title: '{i18n>UoM}';
  value        @title: '{i18n>Value}';
  map          @title: '{i18n>MAP}';
};

annotate AdminService.ProfileArchives with @(
  UI.HeaderInfo: {
    TypeName      : '{i18n>ProfileArchive}',
    TypeNamePlural: '{i18n>ProfileArchives}',
    Title         : {Value: engineerId}
  },
  UI.LineItem  : [
    {Value: archivedAt},
    {Value: status},
    {Value: createdBy}
  ]
) {
  engineerId @title: '{i18n>EngineerId}';
  status     @title: '{i18n>ProfileStatus}';
  archivedAt @title: '{i18n>ArchivedAt}';
  snapshot   @title: '{i18n>Snapshot}';
  createdBy  @title: '{i18n>CreatedBy}';
};
