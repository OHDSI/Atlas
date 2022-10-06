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
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: ko.observable(false) },
				(data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.includedSourcecodes(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
					this.includedSourcecodes.valueHasMutated();
				});
			this.relatedSourcecodesColumns.shift();
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');

			this.loadSourceCodes();
			this.previewConcepts.subscribe(() => {
				this.loadSourceCodes();
			});
		}

		async loadSourceCodes() {
			try {
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