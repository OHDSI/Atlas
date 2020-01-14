define(['services/http', 'appConfig'], function(httpService, config) {
  function createSample(payload, { cohortDefinitionId, sourceKey }) {
    return fetch(`${config.webAPIRoot}cohortsample/${2}/${sourceKey}`, {
      body: JSON.stringify(payload),
      method: 'POST',
    })
      .then(res => res.json())
      .catch(error => {
        console.log(error)
      })
  }

  function getSampleList({ cohortDefinitionId, sourceKey }) {
    return fetch(
      `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}`
    ).then(res => res.json())
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
