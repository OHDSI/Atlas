define([
	'knockout',
	'text!./included-sourcecodes-preview.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'const',
	'services/ConceptSet',
	'services/Vocabulary',
	'components/conceptset/utils',
], function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	globalConstants,
	conceptSetService,
	vocabularyService,
	conceptSetUtils,	 
){

	class IncludedSourcecodesPreview extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.previewConcepts = params.previewConcepts;
			this.loading = ko.observable(true);
			this.includedSourcecodes = ko.observableArray();
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: ko.observable(false) }, () => {})
				.filter(c =>
					c.data === 'CONCEPT_ID' ||
					c.data === 'CONCEPT_CODE' ||
					c.data === 'CONCEPT_NAME' ||
					c.data === 'CONCEPT_CLASS_ID' ||
					c.data === 'DOMAIN_ID' ||
					c.data === 'VOCABULARY_ID'
				);
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');

			this.subscriptions.push(ko.pureComputed(() => ko.toJSON(this.previewConcepts()))
				.extend({
					rateLimit: {
						timeout: 1000,
						method: "notifyWhenChangesStop"
					}
				})
				.subscribe(this.loadSourceCodes));
			this.loadSourceCodes();
		}

		async loadSourceCodes() {
			try {
				this.loading(true);
				const conceptIds = await vocabularyService.resolveConceptSetExpression({
					items: this.previewConcepts()
				});
				const data = await vocabularyService.getMappedConceptsById(conceptIds);
				this.includedSourcecodes(data.map(item => ({
					...item,
					isSelected: ko.observable(false),
				})));
			} catch (err) {
				console.error(err);
			} finally {
				this.loading(false);
			}
		}
	}

	return commonUtils.build('conceptset-list-included-sourcecodes-preview', IncludedSourcecodesPreview, view);
});