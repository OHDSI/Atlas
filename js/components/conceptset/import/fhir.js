define([
	'knockout',
	'text!./fhir.html',
	'components/Component',
	'./ImportComponent',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'services/VocabularyProvider',
	'services/http',
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
	httpService,
	sharedState,
){

	class FhirImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.fhirServer = ko.observable("https://r4.ontoserver.csiro.au/fhir");
			this.valueSet = ko.observable("");
			this.appendConcepts = params.appendConcepts;
			this.canAddConcepts = ko.pureComputed(() =>
					this.fhirServer().length > 0 &&
					this.valueSet().length > 0 &&
					params.canEdit()
			);
			this.doImport = this.doImport.bind(this);
		}

		async runImport(options) {
			const expandUrl = `${this.fhirServer()}/ValueSet/$expand`,
					expandParams = {
						url: this.valueSet()
					}, result = await httpService.doGet(expandUrl, expandParams),
					codes = result.data.expansion.contains.map(c => c.code),
					{data} = await vocabularyApi.getConceptsByCode(codes);
			this.appendConcepts(data, options);
		}
	}

	return commonUtils.build('conceptset-list-import-fhir', FhirImport, view);
});
