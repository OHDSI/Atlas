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
        
    var api = {
		getGenerationInfo: getGenerationInfo
	}

	return api;
});