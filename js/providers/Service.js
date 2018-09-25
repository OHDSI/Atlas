define([
	'services/httpService',
], (
	httpService,
) => {

	return class Service {
		constructor() {
			this.httpService = httpService;
		}		
	}

});