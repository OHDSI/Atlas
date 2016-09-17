define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	
	function getGenerationInfo(conceptSetId) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'conceptset/' + + (conceptSetId || '-1') + '/generationinfo',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return infoPromise;
	}
    
    function deleteConceptSet(conceptSetId) {
		var promise = $.ajax({
			url: config.webAPIRoot + 'conceptset/' + + (conceptSetId || '-1') + '/delete',
			method: 'POST',
			contentType: 'application/json',            
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return promise;
    }
    
    var api = {
		getGenerationInfo: getGenerationInfo,
        deleteConceptSet: deleteConceptSet,
	}

	return api;
});