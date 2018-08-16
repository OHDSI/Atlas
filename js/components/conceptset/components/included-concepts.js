define([
		'knockout',
		'text!./included-concepts.html',
		'./const',
		'./utils',
		'providers/Component',
		'utils/CommonUtils',
		'atlas-state',
		'webapi/ConceptSetAPI',
		'services/ConceptSet',
		'css!./included-concepts.css',
		'faceted-datatable',
	],
	function(
		ko,
		view,
		Const,
		utils,
		Component,
		commonUtils,
		sharedState,
		conceptSetApi,
		conceptSetService,
	){

	class IncludedConcepts extends Component {
		constructor(params) {
			super(params);

			this.model = params.model;
			this.ancestors = params.ancestors || ko.observableArray();
			this.ancestorsModalIsShown = params.ancestorsModalIsShown || ko.observable();
			this.includedFilter = {};
			this.includedConcepts = ko.observableArray();
			this.tableClasses = { sProcessing: this.classes('conceptset-processing'), };
			this.loadingClass = this.classes('conceptset-loading');
			this.searchConceptsColumns = Const.searchConceptsColumns;
			this.searchConceptsOptions = Const.searchConceptsOptions;
			this.tableLanguage = Const.tableLanguage(this.loadingClass);
			this.dataTableClasses = this.classes('table');

			this.showAncestorsModal = conceptSetService.getAncestorsModalHandler({
				includedConcepts: this.includedConcepts,
				ancestors: this.ancestors,
				ancestorsModalIsShown: this.ancestorsModalIsShown,
			});

			this.applyIncludedFilter = this.applyIncludedFilter.bind(this);
			this.loadIncludedFacets = this.loadIncludedFacets.bind(this);
			this.loadIncludedConcepts = this.loadIncludedConcepts.bind(this);
			this.includedDrawCallback = this.includedDrawCallback.bind(this);
		}

		loadIncludedFacets() {
			return utils.loadFacets(this.searchConceptsOptions.Facets);
		}

		applyIncludedFilter(data) {
			utils.applyFilter(data, this.includedFilter);
		}

		includedDrawCallback() {
			return conceptSetService.getIncludedConceptSetDrawCallback(this);
		}

		loadIncludedConcepts(data, callback, settings) {
			conceptSetApi.resolveConceptSetExpression(utils.getExpression(data, this.includedFilter, this.searchConceptsOptions.Facets), true).then(concepts => {
				this.includedConcepts(concepts.data);
				this.model.setIncludedConceptsMap(concepts.data);
				callback({...concepts, draw: data.draw});
			});
		}

	}

	commonUtils.build('included-concepts', IncludedConcepts, view);
});