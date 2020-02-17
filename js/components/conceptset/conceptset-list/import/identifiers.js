define([
	'knockout',
	'text!./identifiers.html',
	'components/Component',
	'../ImportComponent',
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
			this.importing = params.importing;
			this.identifiers = ko.observable();
		}

		async runImport() {
			const {data} = await vocabularyApi.getConceptsById(this.identifiers().match(/[0-9]+/g));
			this.appendConcepts(data);
			this.identifiers('');
		}
	}

	return commonUtils.build('conceptset-list-import-identifiers', IndetifiersImport, view);
});