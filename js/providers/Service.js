define([
	'services/http',
], (
	httpService,
) => {

	return class Service {
		constructor() {
			this.httpService = httpService;
		}		
	}

});