define(
  [
    'knockout',
    'appConfig',
  ],
  function (ko, appConfig) {

    function loadData({ path, filters }) {
      return new Promise(function(resolve, reject) {
        $.ajax({
          url: appConfig.api.url + path,
          method: 'GET',
          data: filters,
          contentType: 'application/json',
          success: (res) => resolve(res),
          error: (jqXHR, textStatus, errorThrown) => reject({ jqXHR, textStatus, errorThrown })
        })
      });
    }

    class CohortResultsService {

      static loadDrugTypesConcepts({ source, cohortId, drugConceptId = null }) {
        const path = `cohortresults/${source}/${cohortId}/healthcareutilization/drugtypes`;
        return loadData({ path, params: { drugConceptId } });
      }

      static loadDrugUtilSummaryReport({ source, cohortId, window, filters }) {
        const path = `cohortresults/${source}/${cohortId}/healthcareutilization/drug/${window}`;
        return loadData({ path, filters });
      }

      static loadDrugUtilDetailedReport({ source, cohortId, window, drugConceptId, filters }) {
        const path = `cohortresults/${source}/${cohortId}/healthcareutilization/drug/${window}/${drugConceptId}`;
        return loadData({ path, filters });
      }

      static loadVisitUtilReport({ source, cohortId, window, visitStat, filters }) {
        const path = `cohortresults/${source}/${cohortId}/healthcareutilization/visit/${window}/${visitStat}`;
        return loadData({ path, filters });
      }

      static loadPersonExposureReport({ source, cohortId, window, filters }) {
        const path = `cohortresults/${source}/${cohortId}/healthcareutilization/exposure/${window}`;
        return loadData({ path, filters });
      }

      static loadPeriods({ source, cohortId, window }) {
        const path = `cohortresults/${source}/${cohortId}/healthcareutilization/periods/${window}`;
        return loadData({ path });
      }

    }

    return CohortResultsService;

  }
);
