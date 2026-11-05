using vanstock.profile as db from '../db/schema';

@requires: 'authenticated-user'
service AdminService @(path: '/odata/v4/admin') {

  @odata.draft.enabled
  entity Uploads         as projection on db.Uploads;

  @readonly
  entity Profiles        as projection on db.Profiles {
    *,
    case status
      when 'Active' then 3
      when 'Leaver' then 2
      else 0
    end as statusCriticality : Integer
  };

  @readonly
  entity ProfileItems    as projection on db.ProfileItems;

  @readonly
  entity ChangeLogs      as projection on db.ChangeLogs {
    *,
    case result
      when 'S' then 3
      when 'E' then 1
      else 0
    end as resultCriticality : Integer
  };

  @readonly
  entity ProfileArchives as projection on db.ProfileArchives;

  @readonly
  entity Scenarios       as projection on db.Scenarios;

  @readonly
  entity HiveProfitCentres as projection on db.HiveProfitCentres;
}

annotate AdminService.Uploads with {
  scenario    @mandatory;
  uploadNo    @readonly;
  status      @readonly;
  totalRows   @readonly;
  successRows @readonly;
  errorRows   @readonly;
  fileName    @readonly;
  mediaType   @readonly;
};
