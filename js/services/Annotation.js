define(function (require, exports) {

  const httpService = require('services/http');
  const config = require('appConfig');
  const authApi = require('webapi/AuthAPI');

  const getAnnotationSets = function(cohort) {
    const data = {
      cohortId: cohort || 0,
    };

    const response = httpService.doGet(`${config.webAPIRoot}annotations/sets`, data).then(({ data }) => data);
    response.catch((er) => {
      console.error('Can\'t find annotation sets');
    });

    return response;
  }

  const getAnnotationByCohortIdbySubjectIdBySetId = function(set, cohort, subject, sourceKey) {
    const data = {
      cohortId: cohort || 0,
      subjectId: subject || 0,
      setId: set || 0
    };

    const response = httpService.doGet(`${config.webAPIRoot}annotations`, data).then(({ data }) => data[0]);
    response.catch((er) => {
      console.error('Can\'t find annotations');
    });

    return response;
  }

  const getAnnotationNavigation = function(cohort, subject, source, set) {
    const data = {
      cohortId: cohort || 0,
      subjectId: subject || 0,
      sourceKey: source || '',
      setId: set || 0
    };

    const response = httpService.doGet(`${config.webAPIRoot}annotations/navigation`, data).then(({ data }) => data);
    response.catch((er) => {
      console.error('Can\'t find annotation navigation');
    });

    return response;
  }

  const createOrUpdateAnnotation = function(data) {
    return httpService.doPost(`${config.webAPIRoot}annotations`, data).then(({ annotation }) => data);
  }

  return {
    getAnnotationSets,
    getAnnotationByCohortIdbySubjectIdBySetId,
    getAnnotationNavigation,
    createOrUpdateAnnotation
  };
});
