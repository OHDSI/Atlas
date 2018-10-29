define([
	'knockout',
	'text!./atlas.cohort-editor.html',
	'appConfig',
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
	CohortDefinition,
	ConceptSet
) {

	function cohortEditor(params) {
		var self = this;

		self.model = params.model;
		self.canEdit = params.model.canEditCurrentCohortDefinition;
		self.tabMode = ko.observable('expression');
		self.tabWidget = ko.observable();
		self.cohortExpressionEditor = ko.observable();
		self.showModal = ko.observable(false);
				/*
		self.modifiedJSON = "";
		self.expressionJSON = ko.pureComputed({
			read: function () {
				return ko.toJSON(self.model.currentCohortDefinition().expression(), function (key, value) {
					if (value === 0 || value) {
						return value;
					} else {
						return
					}
				}, 2);
			},
			write: function (value) {
				self.modifiedJSON = value;
			}
		});
				*/
				
		// model behaviors

		self.handleConceptSetImport = function (item, context, event) {
			event.stopPropagation();
			self.model.criteriaContext(item);
			self.showModal(true);
			return false;
		}
		
		self.handleEditConceptSet = function(item, context) {
			if (item.conceptSetId() == null) {
				return;
			}
			
			self.model.loadConceptSet(item.conceptSetId(), 'cohort-definition-manager', 'cohort', 'details');
			self.model.currentCohortDefinitionMode("conceptsets");
		}
		

		self.onAtlasConceptSetSelectAction = function(result, valueAccessor) {
				self.showModal(false);

				if (result.action === 'add') {
						var newConceptSet = new ConceptSet();
						var cohortConceptSets = self.model.currentCohortDefinition().expression().ConceptSets;
						newConceptSet.id = cohortConceptSets().length > 0 ? Math.max.apply(null, cohortConceptSets().map(function (d) {
						 return d.id;
						})) + 1 : 0;
						cohortConceptSets.push(newConceptSet);
						self.model.loadConceptSet(newConceptSet.id, 'cohort-definition-manager', 'cohort', 'details');
						self.model.currentCohortDefinitionMode("conceptsets");
						self.model.criteriaContext().conceptSetId(newConceptSet.id);
				}

				self.model.criteriaContext(null);
		}

				/*
		self.reload = function () {
			var updatedExpression = JSON.parse(self.modifiedJSON);
			self.model.currentCohortDefinition().expression(new CohortExpression(updatedExpression));
		}
				*/
				
		self.onGenerate = function (generateComponent) {
			CohortDefinition.generate(self.model.currentCohortDefinition().id(), generateComponent.source.sourceKey, false)
				.then(function (result) {
					pollForInfo();
				});
		}

		self.getExpressionJSON = function () {
			return ko.toJSON(self.model.currentCohortDefinition().Expression, pruneJSON, 2)
		}
	}

	var component = {
		viewModel: cohortEditor,
		template: view
	};

	ko.components.register('atlas.cohort-editor', component);
	return component;
});
