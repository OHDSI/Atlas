define(
  [
    'knockout',
    'appConfig',
  ],
  function (ko, appConfig) {

    function loadData({ url, params }) {
      return new Promise(function(resolve, reject) {
        $.ajax({
          url: url,
          method: 'GET',
          data: params,
          contentType: 'application/json',
          success: (res) => resolve(res),
          error: (jqXHR, textStatus, errorThrown) => reject({ jqXHR, textStatus, errorThrown })
        })
      });
    }

    class CohortResultsService {

      static loadDrugTypesConcepts({ source, cohortId, drugConceptId = null }) {
        const url = `${appConfig.api.url}cohortresults/${source}/${cohortId}/healthcareutilization/drugtypes` + (drugConceptId ? `?drugConceptId=${drugConceptId}`: '');
        return loadData({ url });
      }

    }

    return CohortResultsService;

  }
);
