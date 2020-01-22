define((require, exports) => {
  const pageTitle = 'Profiles'
  const paths = {
    source: sourceKey => `#/profiles/${sourceKey}`,
    person: (sourceKey, personId) => `#/profiles/${sourceKey}/${personId}`,
    onePersonSample: ({ sourceKey, personId, cohortDefinitionId, sampleId }) =>
      `#/profiles/${sourceKey}/${personId}/${cohortDefinitionId}/${sampleId}`,
    twoPersonSample: ({
      sourceKey,
      personId,
      cohortDefinitionId,
      sampleId,
      secondPersonId,
    }) =>
      `#/profiles/${sourceKey}/${personId}/${cohortDefinitionId}/${sampleId}/${secondPersonId}`,
  }

  return {
    pageTitle,
    paths,
  }
})
