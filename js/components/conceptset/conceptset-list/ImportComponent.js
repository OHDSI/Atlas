define([
	'../consts',
], function(
	consts,
){

	const ImportComponent = (C = class{}) => class extends C {
		constructor(params){
			super(params);
			this.importing = params.importing;
			this.selectedTabKey = params.selectedTabKey;
		}

		async importConceptSet() {
			this.importing(true);
			try {
				await this.runImport();
			} finally {
				this.importing(false);
				this.selectedTabKey(consts.ConceptSetTabKeys.EXPRESSION);
			}
		}
	};

	return ImportComponent;
});