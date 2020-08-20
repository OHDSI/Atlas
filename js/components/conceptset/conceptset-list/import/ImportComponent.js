define([
	'../../const',
], function(
	consts,
){

	const ImportComponent = (C = class{}) => class extends C {
		constructor(params){
			super(params);
			this.importing = params.importing;
			this.selectedTabKey = params.selectedTabKey;
		}

		async doImport(options) {
			this.importing(true);
			try {
				await this.runImport(options);
			} finally {
				this.importing(false);
				this.selectedTabKey(consts.ConceptSetTabKeys.EXPRESSION);
			}
		}
	};

	return ImportComponent;
});