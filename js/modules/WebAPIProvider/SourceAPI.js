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
			},
			success: function (o) {
				// this is the initial communication to WebAPI and if it succeeds
				// the initialization is complete and the application is ready.
				sharedState.appInitializationStatus('complete');
			}
		});
		return promise;
	}

	var api = {
		getSources: getSources
	};

	return api;
});
