define([
	'knockout',
	'text!./identifiers.html',
	'components/Component',
	'./ImportComponent',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'services/VocabularyProvider',
	'atlas-state',
], function(
	ko,
	view,
	Component,
	ImportComponent,
	AutoBind,
	Clipboard,
	commonUtils,
	vocabularyApi,
	sharedState,
){

	class IndetifiersImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.appendConcepts = params.appendConcepts;
			this.identifiers = ko.observable("");
			this.canAddConcepts = ko.pureComputed(() => this.identifiers().length > 0 && params.canEdit());
			this.doImport = this.doImport.bind(this);
		}

		async runImport(options) {
			const {data} = await vocabularyApi.getConceptsById(this.identifiers().match(/[0-9]+/g));
			this.appendConcepts(data, options);
			this.identifiers('');
		}
	}

	return commonUtils.build('conceptset-list-import-identifiers', IndetifiersImport, view);
});