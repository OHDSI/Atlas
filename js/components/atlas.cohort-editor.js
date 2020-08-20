define([
	'knockout',
	'text!./atlas.cohort-editor.html',
	'appConfig',
	'atlas-state',
	'components/cohortbuilder/CohortDefinition',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'assets/ohdsi.util',
	'components/cohortbuilder/components',
	'conceptsetbuilder/components',
	'assets/knockout-jqueryui/tabs',
	'cohortdefinitionviewer',
	'circe',
	'databindings',
], function (
	ko,
	view,
	config,
	sharedState,
	CohortDefinition,
	ConceptSet
) {

	function cohortEditor(params) {
		var self = this;
		self.criteriaContext = sharedState.criteriaContext;
		self.canEdit = params.canEditCurrentCohortDefinition;
		self.loadConceptSet = params.loadConceptSet;
		self.currentCohortDefinition = sharedState.CohortDefinition.current;
		self.currentCohortDefinitionMode = sharedState.CohortDefinition.mode;
		self.tabMode = ko.observable('expression');
		self.tabWidget = ko.observable();
		self.cohortExpressionEditor = ko.observable();
		self.showModal = ko.observable(false);

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
						var newConceptSet = new ConceptSet();
						var cohortConceptSets = self.currentCohortDefinition().expression().ConceptSets;
						newConceptSet.id = cohortConceptSets().length > 0 ? Math.max.apply(null, cohortConceptSets().map(function (d) {
						 return d.id;
						})) + 1 : 0;
						cohortConceptSets.push(newConceptSet);
						self.loadConceptSet(newConceptSet.id);
						self.currentCohortDefinitionMode("conceptsets");
						self.criteriaContext().conceptSetId(newConceptSet.id);
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
