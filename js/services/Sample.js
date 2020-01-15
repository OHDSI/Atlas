define(['services/http', 'appConfig'], function(httpService, config) {
  function createSample(payload, { cohortDefinitionId, sourceKey }) {
    return httpService
      .doPost(
        `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}`,
        {
          ...payload,
        }
      )
      .catch(error => {
        console.log(error)
      })
  }

  function getSampleList({ cohortDefinitionId, sourceKey }) {
    return httpService.doGet(
      `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}`
    )
  }

  function getSample({ cohortDefinitionId, sourceKey, sampleId }) {
    return fetch(
      `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}/${sampleId}`
    ).then(res => res.json())
  }

  function deleteSample({ cohortDefinitionId, sourceKey, sampleId }) {
    return doDelete(
      `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}/${sampleId}`,
      { method: 'DELETE' }
    ).then(res => res.json())
  }

  return {
    createSample,
    getSampleList,
    getSample,
    deleteSample,
  }
})
