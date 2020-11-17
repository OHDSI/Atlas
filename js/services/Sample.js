define(['services/http', 'appConfig'], function(httpService, config) {
  function createSample(payload, { cohortDefinitionId, sourceKey }) {
    return httpService
      .doPost(
        `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}`,
        {
          ...payload,
        }
      ).then(res => res.data);
  }

  function getSampleList({ cohortDefinitionId, sourceKey }) {
    return httpService
      .doGet(
        `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}`
      )
      .then(res => res.data)
  }

  function getSample({ cohortDefinitionId, sourceKey, sampleId }) {
    return httpService
      .doGet(
        `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}/${sampleId}`
      )
      .then(res => res.data)
  }

  function refreshSample({ cohortDefinitionId, sourceKey, sampleId }) {
    return httpService
      .doPost(
        `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}/${sampleId}/refresh`,
        null
      )
      .then(res => res.data)
  }

  function deleteSample({ cohortDefinitionId, sourceKey, sampleId }) {
    return httpService.doDelete(
      `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}/${sampleId}`
    )
  }

  return {
    createSample,
    getSampleList,
    getSample,
    deleteSample,
    refreshSample
  }
})
