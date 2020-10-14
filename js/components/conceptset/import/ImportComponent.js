define([
	'knockout',
	'../const',
], function(
	ko,
	consts,
){

	const ImportComponent = (C = class{}) => class extends C {
		constructor(params){
			super(params);
			this.importing = params.importing || ko.observable(false);
			this.selectedTabKey = params.selectedTabKey || ((mode) => null);
		}

		async doImport(options) {
			this.importing(true);
			try {
				await this.runImport(options);
				this.selectedTabKey(consts.ViewMode.EXPRESSION);
			} finally {
				this.importing(false);
			}
		}
	};

	return ImportComponent;
});