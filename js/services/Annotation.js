define(function (require, exports) {

    const httpService = require('services/http');
    const config = require('appConfig');
    const authApi = require('services/AuthAPI');

    const deleteQuestionSet = function (questionSetId) {

        return httpService.doGet(`${config.webAPIRoot}annotations/deleteSet/${questionSetId}`);
    };

    const getAnnotationSets = function (cohort) {
        const data = {
            cohortId: cohort || 0,
        };

        const response = httpService.doGet(`${config.webAPIRoot}annotations/sets`, data).then(({data}) => data);
        response.catch((er) => {
            console.error('Can\'t find annotation sets');
        });

        return response;
    };

    const getStudySets = function (cohort) {
        const cohortId = cohort || 0;

        const response = httpService.doGet(`${config.webAPIRoot}annotations/getsets?cohortId=${cohortId}`).then(({data}) => data);
        response.catch((er) => {
            console.error('Can\'t find study sets');
        });

        return response;
    };

    const getSuperTable = function (qSetId, sampleId) {
        const response = httpService.doGet(`${config.webAPIRoot}annotations/results/completeResults?questionSetId=${qSetId}&cohortSampleId=${sampleId}`).then(({data}) => data);
        response.catch((er) => {
            console.error('Can\'t find super table');
        });

        return response;
    };

    const getStudyResults = function (annotationId) {
        const response = httpService.doGet(`${config.webAPIRoot}annotations/results/${annotationId}`).then(({data}) => data);
        response.catch((er) => {
            console.error('Can\'t find study results');
        });

        return response;
    };

    const getAnnotationByCohortIdbySubjectIdBySetId = function (set, cohort, subject, sourceKey) {
        const data = {
            cohortId: cohort || 0,
            subjectId: subject || 0,
            setId: set || 0
        };


        const response = httpService.doGet(`${config.webAPIRoot}annotations`, data).then(({data}) => data[0]);
        response.catch((er) => {
            console.error('Can\'t find annotations');
        });


        return response;
    };

    const getAnnotationBySampleIdbySubjectIdBySetId = function (set, sample, subject, sourceKey) {
        const data = {
            sampleId: sample || 0,
            subjectId: subject || 0,
            setId: set || 0
        };

        const response = httpService.doGet(`${config.webAPIRoot}annotations?setId=${data.setId}&cohortSampleId=${data.sampleId}&subjectId=${data.subjectId}`)
            .then(({data}) => data[0]);
        response.catch((er) => {
            console.error('Can\'t find annotations');
        });


        return response;
    };

    const getSamplesBySetId = function (setId) {
        return httpService.doGet(`${config.webAPIRoot}annotations?setId=${setId}`)
            .then((resp) => {
                const samples = new Set();
                resp.data.forEach((x, i) => {
                    samples.add(x.cohortSampleId);
                });
                return Array.from(samples);
            })
            .catch(er => {
                console.error("unable to load samples");
            });
    };

    const getSetsBySampleId = function (sampleId) {
        return httpService.doGet(`${config.webAPIRoot}annotations?cohortSampleId=${sampleId}`)
            .then((resp) => {
                const sets = new Set();
                resp.data.forEach((x, i) => {
                    sets.add(x.questionSetId);
                });
                return Array.from(sets);
            })
            .catch(er => {
                console.error("unable to load sets");
            });
    };

    const getAnnotationsBySampleIdSetId = function (sampleId, setId) {
        return httpService.doGet(`${config.webAPIRoot}annotations?cohortSampleId=${sampleId}&setId=${setId}`)
            .then((res) => {
                return res.data;
            })
            .catch(er => {
                console.error("unable to load sets");
            });
    };


    const getAnnotationNavigation = function (sampleName, cohort, subject, source) {
        const data = {
            cohortId: cohort || 0,
            subjectId: subject || 0,
            sourceKey: source || '',
            sampleName: sampleName || ''
        };
        const response = httpService.doGet(`${config.webAPIRoot}cohortsample/${data.cohortId}/${data.sampleName}/${data.sampleName}`, {}).then(({data}) => data);
        response.catch((er) => {
            console.error('Can\'t find annotation navigation');
        });
        return response;
    };

    const createOrUpdateAnnotation = function (data) {
        return httpService.doPost(`${config.webAPIRoot}annotations`, data).then(({annotation}) => data);
    };

    const linkAnnotationToSamples = function (data) {
        const response = httpService.doPost(`${config.webAPIRoot}annotations/sample`, data).then(({link}) => data);
        response.catch((er) => {
            console.error('Unable to link annotation to sample');
        });

        return response;
    };


    return {
        deleteQuestionSet,
        getAnnotationSets,
        getSetsBySampleId,
        getSamplesBySetId,
        getAnnotationsBySampleIdSetId,
        getStudySets,
        getSuperTable,
        getStudyResults,
        getAnnotationByCohortIdbySubjectIdBySetId,
        getAnnotationBySampleIdbySubjectIdBySetId,
        getAnnotationNavigation,
        createOrUpdateAnnotation,
        linkAnnotationToSamples
    };
});