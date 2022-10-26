define([
	'knockout',
	'text!./included-preview.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/Vocabulary',
	'components/conceptset/utils',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	vocabularyService,
	conceptSetUtils,
) {

	class IncludedConceptsPreview extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.previewConcepts = params.previewConcepts;
			this.loading = ko.observable(true);
			this.includedConcepts = ko.observableArray();
			this.commonUtils = commonUtils;
			this.includedConceptsColumns = conceptSetUtils.getIncludedConceptsColumns({ canEditCurrentConceptSet: ko.observable(false) }, commonUtils, () => {});
			this.includedConceptsColumns.shift();
			this.includedConceptsOptions = conceptSetUtils.includedConceptsOptions;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			this.includedDrawCallback = conceptSetUtils.getIncludedConceptSetDrawCallback(this.includedConceptsColumns, {
				current: ko.observable({expression: { items: this.previewConcepts }}),
				selectedConceptsIndex: ko.pureComputed(() => {
					const index = this.previewConcepts()
						.reduce((result, item) => {
							const itemArr = result[item.concept.CONCEPT_ID] || [];
							itemArr.push(item);
							result[item.concept.CONCEPT_ID] = itemArr;
							return result;
						}, {});
					return index || {};
				}),
				includedConceptsMap: ko.pureComputed(
					() => this.includedConcepts().reduce((result, item) => {
							result[item.CONCEPT_ID] = item;
							return result;
						}, {})
				)
			});

			this.subscriptions.push(ko.pureComputed(() => ko.toJSON(this.previewConcepts()))
				.extend({
					rateLimit: {
						timeout: 1000,
						method: "notifyWhenChangesStop"
					}
				})
				.subscribe(this.loadIncluded));
			this.loadIncluded();
		}

		async loadIncluded() {
			try {
				this.loading(true);
				const conceptIds = await vocabularyService.resolveConceptSetExpression({
					items: this.previewConcepts()
				});
				const response = await vocabularyService.getConceptsById(conceptIds);
				await vocabularyService.loadDensity(response.data);
				this.includedConcepts((response.data || []).map(item => ({
					...item,
					ANCESTORS: null,
					isSelected: ko.observable(false)
				})));
			} catch (err) {
				console.error(err);
			} finally {
				this.loading(false);
			}
		}
	}

	return commonUtils.build('conceptset-list-included-preview', IncludedConceptsPreview, view);
});