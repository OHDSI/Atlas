define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	
	function getNegativeControls(sourceKey, conceptSetId) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'evidence/' + sourceKey + '/negativecontrols/' + (conceptSetId || '-1'),
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return infoPromise;
	}
    
    function generateNegativeControls(sourceKey, conceptSetId, conceptSetName, conceptDomainId, targetDomainId, conceptIds, csToInclude, csToExclude) {
        var negativeControlsJob = $.ajax({
            url: config.webAPIRoot +'evidence/' + sourceKey + '/negativecontrols',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                jobName: "NEGATIVE_CONTROLS_" + conceptSetId,
                conceptSetId: conceptSetId,
                conceptSetName: conceptSetName,
                conceptDomainId: conceptDomainId,
                outcomeOfInterest: targetDomainId,
                conceptsOfInterest: conceptIds,
                csToInclude: csToInclude,
                csToExclude: csToExclude,
                //translatedSchema: "translated", 
            }),
            error: function (error) {
                console.log("Error: " + error);
            }
        });   
            
        return negativeControlsJob;
    }
    
    var api = {
		getNegativeControls: getNegativeControls,
        generateNegativeControls: generateNegativeControls
	}

	return api;
});