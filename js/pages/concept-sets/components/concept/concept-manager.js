define([
	'knockout',
	'text!./concept-manager.html',
	'pages/Page',
	'utils/AutoBind',
	'services/Vocabulary',
	'utils/CommonUtils',
	'services/ConceptSet',
	'components/conceptset/ConceptSetStore',
  	'components/conceptset/utils',
	'utils/Renderers',
	'atlas-state',
	'services/http',
	'../../const',
	'services/AuthAPI',
	'../../PermissionService',
	'faceted-datatable',
	'components/heading',
	'components/conceptLegend/concept-legend',
	'components/conceptAddBox/concept-add-box',
	'less!./concept-manager.less',
	'components/tabs',
	'./components/tabs/concept-details',
	'./components/tabs/concept-related',
	'./components/tabs/concept-hierarchy',
	'./components/tabs/concept-count',
	'./components/tabs/concept-drilldown-report',
], function (
	ko,
	view,
	Page,
	AutoBind,
	vocabularyProvider,
	commonUtils,
	conceptSetService,
	ConceptSetStore,
  conceptSetUtils,
	renderers,
	sharedState,
	httpService,
	constants,
	authApi,
	PermissionService,
) {
	class ConceptManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.currentConceptId = ko.observable();
			this.currentConcept = ko.observable();

			this.isLoading = ko.observable(false);
			this.isAuthenticated = authApi.isAuthenticated;
			this.hasInfoAccess = ko.computed(() => PermissionService.isPermittedGetInfo(sharedState.sourceKeyOfVocabUrl(), this.currentConceptId()));

			this.tabParams = ko.observable({
				currentConcept: this.currentConcept,
				currentConceptId: this.currentConceptId,
				hasInfoAccess: this.hasInfoAccess,
				isAuthenticated: this.isAuthenticated,
				addConcepts: this.addConcepts.bind(this),
				addConcept: this.addConcept
			});
		}

		async onPageCreated() {
			this.currentConceptId(this.routerParams.conceptId);
			this.loadConcept(this.currentConceptId());
			super.onPageCreated();
		}

		onRouterParamsChanged({ conceptId }) {
			if (conceptId !== this.currentConceptId() && conceptId !== undefined) {
				this.currentConceptId(conceptId);
				this.loadConcept(this.currentConceptId());
			}
		}

		addConcept(options, conceptSetStore = ConceptSetStore.repository()) {
			// add the current concept
			const items = commonUtils.buildConceptSetItems([this.currentConcept()], options);
			conceptSetUtils.addItemsToConceptSet({items, conceptSetStore});
		}
		
		// produces a closure to wrap options and source around a function
		// that accepts the source selected concepts list
		addConcepts(options, conceptSetStore = ConceptSetStore.repository()) {
			return (conceptsArr, isCurrentConcept = false) => {
				const concepts = commonUtils.getSelectedConcepts(conceptsArr);
				const items = commonUtils.buildConceptSetItems(concepts, options);
				conceptSetUtils.addItemsToConceptSet({items, conceptSetStore});
				commonUtils.clearConceptsSelectionState(conceptsArr);
			}
		}

		enhanceConcept(concept) {
			return {
				...concept,
				isSelected: ko.observable(false),
			};
		}

		async loadConcept(conceptId) {
			this.isLoading(true);
			if (!this.hasInfoAccess()) {
				return;
			}

			const { data } = await httpService.doGet(sharedState.vocabularyUrl() + 'concept/' + conceptId);
			this.currentConcept(this.enhanceConcept(data));
			this.isLoading(false);
		}
	}

	return commonUtils.build('concept-manager', ConceptManager, view);
});
