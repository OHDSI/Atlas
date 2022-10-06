define([
	'knockout',
	'text!./atlas.cohort-editor.html',
	'appConfig',
	'atlas-state',
	'utils/CommonUtils',
	'components/cohortbuilder/CohortDefinition',
	'components/conceptset/InputTypes/ConceptSet',
	'components/conceptset/utils',
	'components/cohortbuilder/components',
	'assets/knockout-jqueryui/tabs',
	'cohortdefinitionviewer',
	'circe',
	'databindings',
], function (
	ko,
	view,
	config,
	sharedState,
	commonUtils,
	CohortDefinition,
	ConceptSet,
	conceptSetUtils,
) {

	function cohortEditor(params) {
		var self = this;
		self.criteriaContext = ko.observable(null);
		self.canEdit = params.canEditCurrentCohortDefinition;
		self.loadConceptSet = params.loadConceptSet;
		self.currentCohortDefinition = sharedState.CohortDefinition.current;
		self.currentCohortDefinitionMode = sharedState.CohortDefinition.mode;
		self.tabMode = ko.observable('expression');
		self.tabWidget = ko.observable();
		self.cohortExpressionEditor = ko.observable();
		self.showModal = ko.observable(false);
		self.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
		// model behaviors

		self.handleConceptSetImport = function (item, context, event) {
			self.criteriaContext(item);
			self.showModal(true);
			return false;
		}

		self.handleEditConceptSet = function(item, context) {
			if (item.conceptSetId() == null) {
				return;
			}

			self.loadConceptSet(item.conceptSetId());
			self.currentCohortDefinitionMode("conceptsets");
		}


		self.onAtlasConceptSetSelectAction = function(result) {
			self.showModal(false);

			if (result.action === 'add') {
				var cohortConceptSets = self.currentCohortDefinition().expression().ConceptSets;
				const newId = conceptSetUtils.newConceptSetHandler(cohortConceptSets, self.criteriaContext());
				self.loadConceptSet(newId)
			}

			self.criteriaContext(null);
		}			

		self.onGenerate = function (generateComponent) {
			CohortDefinition.generate(self.currentCohortDefinition().id(), generateComponent.source.sourceKey, false)
				.then(function (result) {
					pollForInfo();
				});
		}

		self.getExpressionJSON = function () {
			return ko.toJSON(self.currentCohortDefinition().Expression, pruneJSON, 2)
		}
	}

	var component = {
		viewModel: cohortEditor,
		template: view
	};

	ko.components.register('atlas.cohort-editor', component);
	return component;
});
