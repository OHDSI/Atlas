define([
	'knockout',
	'text!./conceptset.html',
	'components/Component',
	'./ImportComponent',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'atlas-state',
], function(
	ko,
	view,
	Component,
	ImportComponent,
	AutoBind,
	Clipboard,
	commonUtils,
	sharedState,
){

	class ConceptSetImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.importConceptSetExpression = params.importConceptSetExpression;
			this.importConceptSetJson = ko.observable();
			this.doImport = this.doImport.bind(this);			
		}

		async runImport() {
			const expression = JSON.parse(this.importConceptSetJson());
			this.importConceptSetExpression(expression);
			this.importConceptSetJson('');
		}
	}

	return commonUtils.build('conceptset-list-import-conceptset', ConceptSetImport, view);
});