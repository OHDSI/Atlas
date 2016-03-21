define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	
	var sources;
	
	var loadPromise = $.ajax({
			url: config.webAPIRoot + 'source/sources/',
			error: function (error) {
				console.log("Error: " + error);
			}
	});
	
	function getSources() {
		return loadPromise;
	}
	
	var api= {
		getSources: getSources
	};
	
	return api;
});