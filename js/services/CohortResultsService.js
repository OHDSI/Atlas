define(
  [
    'providers/Service',
    'const',
  ],
  function (
    Service,
    { apiPaths }
) {

    class CohortResultsService extends Service {
      async loadDrugTypesConcepts({ source, cohortId, drugConceptId = null }) {
        const path = `${apiPaths.cohortResults(source, cohortId)}/healthcareutilization/drugtypes`;
        const { data } = await this.httpService.doGet(path, { drugConceptId });
        return data;
      }

      async loadDrugUtilSummaryReport({ source, cohortId, window, filters }) {
        const path = `${apiPaths.cohortResults(source, cohortId)}/healthcareutilization/drug/${window}`;
        const { data } = await this.httpService.doGet(path, filters);
        return data;
      }

      async loadDrugUtilDetailedReport({ source, cohortId, window, drugConceptId, filters }) {
        const path = `${apiPaths.cohortResults(source, cohortId)}/healthcareutilization/drug/${window}/${drugConceptId}`;
        const { data } = await this.httpService.doGet(path, filters);
        return data;
      }

      async loadVisitUtilReport({ source, cohortId, window, visitStat, filters }) {
        const path = `${apiPaths.cohortResults(source, cohortId)}/healthcareutilization/visit/${window}/${visitStat}`;
        const { data } = await this.httpService.doGet(path, filters);
        return data;
      }

      async loadPersonExposureReport({ source, cohortId, window, filters }) {
        const path = `${apiPaths.cohortResults(source, cohortId)}/healthcareutilization/exposure/${window}`;
        const { data } = await this.httpService.doGet(path, filters);
        return data;
      }

      async loadPeriods({ source, cohortId, window }) {
        const path = `${apiPaths.cohortResults(source, cohortId)}/healthcareutilization/periods/${window}`;
        const { data } = await this.httpService.doGet(path);
        return data;
      }

    }

    return new CohortResultsService();

  }
);
