define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sharedState = require('atlas-state');

	var sources;

	function getSources() {
		var promise = $.ajax({
			url: config.webAPIRoot + 'source/sources/',
			error: function (error) {
				sharedState.appInitializationStatus('failed');
			}
		});
		return promise;
	}

	var api = {
		getSources: getSources
	};

	return api;
});