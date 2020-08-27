define([
	'knockout',
	'text!./conceptset.html',
	'components/Component',
	'./ImportComponent',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'../const',
], function(
	ko,
	view,
	Component,
	ImportComponent,
	AutoBind,
	Clipboard,
	commonUtils,
	constants,
){

	class ConceptSetImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.importTypes = constants.importTypes;
			this.importConceptSetExpression = params.importConceptSetExpression;
			this.importConceptSetJson = ko.observable();
			this.doImport = this.doImport.bind(this);
			this.errorMessage = ko.observable("");
		}

		async runImport(options) {
			try {
				await this.importConceptSetExpression(this.importConceptSetJson(), options);
				this.importConceptSetJson('');
			}
			catch (err) {
				this.errorMessage(err);
				setTimeout(() => this.errorMessage(""), 3000);
			}
		}
	}

	return commonUtils.build('conceptset-list-import-conceptset', ConceptSetImport, view);
});