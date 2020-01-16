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

  function deleteSample({ cohortDefinitionId, sourceKey, sampleId }) {
    // return fetch(
    //   `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}/${sampleId}`,
    //   { method: 'DELETE' }
    // ).catch(error => {
    //   console.log(error)
    // })

    var deletePromise = $.ajax({
      url: `${config.webAPIRoot}cohortsample/${cohortDefinitionId}/${sourceKey}/${sampleId}`,
      method: 'DELETE',
    })
    console.log(deletePromise)
    return deletePromise
  }

  return {
    createSample,
    getSampleList,
    getSample,
    deleteSample,
  }
})
