using {vanstock.profile as db} from '../db/schema';

service AdminService @(
  path    : '/odata/v4/admin',
  requires: 'authenticated-user'
) {
  @odata.draft.enabled
  entity Uploads           as projection on db.Uploads;

  @readonly
  entity UploadMessages    as projection on db.UploadMessages;

  @readonly
  entity Profiles          as projection on db.Profiles;

  @readonly
  entity ProfileItems      as projection on db.ProfileItems;

  @readonly
  entity ChangeLog         as projection on db.ChangeLog;

  @readonly
  entity ProfileArchive    as projection on db.ProfileArchive;

  @readonly
  entity HiveProfitCentres as projection on db.HiveProfitCentres;

  @readonly
  entity Scenarios         as projection on db.Scenarios;
}

annotate AdminService.Uploads with {
  uploadNo   @readonly;
  status     @readonly;
  rowsTotal  @readonly;
  rowsPosted @readonly;
  rowsFailed @readonly;
  mediaType  @readonly;
};
