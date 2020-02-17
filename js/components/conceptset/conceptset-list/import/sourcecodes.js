define([
	'knockout',
	'text!./sourcecodes.html',
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

	class SourceCodesImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.sourcecodes = ko.observable();
			this.appendConcepts = params.appendConcepts;
		}

		async runImport() {
			const {data} = await vocabularyApi.getConceptsByCode(this.sourcecodes().match(/[0-9a-zA-Z\.-]+/g));
			this.appendConcepts(data);
			this.sourcecodes('');
		}
	}

	return commonUtils.build('conceptset-list-import-sourcecodes', SourceCodesImport, view);
});