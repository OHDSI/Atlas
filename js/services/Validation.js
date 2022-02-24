define(function (require, exports) {

    const httpService = require('services/http');
    const config = require('appConfig');
    const authApi = require('services/AuthAPI');
    const $ = require('jquery');
  
    function createValidationSet(sk, ss, name, id, getSamples) {
        var url = `${config.webAPIRoot}cohortSample/${sk}/${id}?size=${ss}&name=${name}`;
        
        var promise = $.ajax({
            url: url,
            method: 'POST',
            context: this,
            contentType: 'application/json',
            success: function (data) {
                console.log('here')
                getSamples()
                return null;
            }, 
            error: function (error) {
                console.log("Error: " + error);
            }
        });
        
        return promise;
    }
    function submitQuestionSet(data) {
        var url = `${config.webAPIRoot}annotations/sets`;
        return $.ajax({
            url: url,
            data: data, 
            method: 'POST',
            context: this,
            contentType: 'application/json',
            success: function (data) {
                return null;
            }, 
            error: function (error) {
                console.log("Error: " + error);
            }
        });
    }

    const getSamples = function(sk, id) {
        const response = httpService.doGet(`${config.webAPIRoot}cohortSample/${sk}/${id}`).then(({ data }) => data);
        response.catch((er) => {
          console.error('Unable to get Validation Sets');
        });
        return response;
      };

    const exportAnnotation = function(sk, cohortId, sampleName) {
        if (sampleName.indexOf(' ') >=0) {
            var sampleName = sampleName.split(" ").join('_');
        }
        const response = httpService.doGet(`${config.webAPIRoot}annotations/csvData?sourceKey=${sk}&cohortID=${cohortId}&sampleName=${sampleName}`).then(({data}) => data);
        response.catch((er) => {
            console.error('Unable to download CSV')
        });
        return response;
    };

    const getQsets = function(id) {
        const response = httpService.doGet( `${config.webAPIRoot}annotations/sets?cohortId=${id}`).then(({ data }) => data);
        response.catch((er) => {
          console.error('Unable to get Question Sets');
        });
        return response;
    };

    API = {
        createValidationSet,
        getSamples,
        exportAnnotation,
        getQsets,
        submitQuestionSet,
    }
    return API;
  });