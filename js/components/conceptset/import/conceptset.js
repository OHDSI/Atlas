define([
	'knockout',
	'text!./conceptset.html',
	'components/Component',
	'./ImportComponent',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'../const',
	'../utils',
], function(
	ko,
	view,
	Component,
	ImportComponent,
	AutoBind,
	Clipboard,
	commonUtils,
	constants,
	conceptSetUtils,
){

	class ConceptSetImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.canEdit = params.canEdit;
			this.buttonTooltipText = conceptSetUtils.getPermissionsText(this.canEdit(), 'edit');
			this.importTypes = constants.importTypes;
			this.importConceptSetExpression = params.importConceptSetExpression;
			this.importConceptSetJson = ko.observable();
			this.doImport = this.doImport.bind(this);
			this.errorMessage = ko.observable("");
			this.setTimeoutId = null;
		}

		async runImport(options) {
			try {
				let expression = null;
				try {				
					expression = JSON.parse(this.importConceptSetJson());
				}
				catch (err) {
					throw(new Error("Error parsing JSON.  Please ensure it is well-formed."));
				}
				await this.importConceptSetExpression(expression, options);
				this.importConceptSetJson('');
			}
			catch (err) {
				this.setError(err.message);
				throw(err);
			}
		}

		setError(errorMessage) {
			clearTimeout(this.setTimeoutId)
			this.errorMessage(errorMessage);
			this.setTimeoutId = setTimeout(() => this.errorMessage(""), 3000);
		}
	}

	return commonUtils.build('conceptset-list-import-conceptset', ConceptSetImport, view);
});