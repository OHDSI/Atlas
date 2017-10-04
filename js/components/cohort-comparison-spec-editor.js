define(['jquery', 'knockout', 'text!./cohort-comparison-spec-editor.html',
				'webapi/CohortDefinitionAPI', 'appConfig', 'typeahead', 'bloodhound',
				'cohortcomparison/ComparativeCohortAnalysis', 'cohortbuilder/options',
				'cohortbuilder/CohortDefinition', 'vocabularyprovider', 'webapi/ComparativeCohortAnalysisAPI',
				'conceptsetbuilder/InputTypes/ConceptSet', 'cohortcomparison/OutcomeDefinition', 'ko.typeahead', ],
	function ($, ko, view, cohortDefinitionAPI, config, typeahead, bloodhound,
		ComparativeCohortAnalysis, options, CohortDefinition, vocabularyAPI, comparativeCohortAnalysisAPI,
		ConceptSet, OutcomeDefinition) {
		function cohortComparisonSpecificationEditor(params) {
			var self = this;
			self.cohortComparison = params.cohortComparison;
			self.options = options;

			self.outcomeCohortLoading = ko.observable(false);
			self.outcomeLoadingMsg = ko.pureComputed(function () {
				if (self.outcomeCohortLoading()) {
					return "<i class=\"fa fa-circle-o-notch fa-spin\"></i> Loading";
				} else {
					return "<i class=\"fa fa-keyboard-o\"></i>";
				}
			})
			self.outcomeListEmpty = ko.pureComputed(function () {
				return (self.cohortComparison().outcomeList().length == 1 && self.cohortComparison().outcomeList()[0].outcomeId() == 0);
			});

			self.cohortDefinitionQueryURL = `${config.webAPIRoot}cohortdefinition/search?searchTerm=%QUERY`;
			self.outcomeAutocompleteValue = ko.observable();
			self.outcomeAutocompleteValue.subscribe(function (d) {
				if (d != null && d.id != null) {
					// Check to see if the outcome is already present.
					var match = ko.utils.arrayFirst(self.cohortComparison().outcomeList(), function (item) {
						return d.id === item.outcomeId();
					});
					if (!match) {
						self.outcomeCohortLoading(true);
						// Get the outcome cohort definition information from the server.
						cohortDefinitionAPI.getCohortDefinition(d.id).then(function (cohortDefinition) {
							od = new OutcomeDefinition();
							od.outcomeId(d.id);
							od.outcomeCaption(d.name);
							cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
							od.outcomeCohortDefinition(new CohortDefinition(cohortDefinition));
							self.cohortComparison().addOutcome(od);
							self.outcomeCohortLoading(false);
						});
					} else {
						console.log('It is already in the list!')
					}
				}
			});
			self.removeOutcomeCohort = function (id) {
				console.log('Remove ' + id);
				self.cohortComparison().outcomeList.remove(function (item) {
					return item.outcomeId() == id;
				});
			}


			self.cohortSelected = function (id) {
				$('#modalCohortDefinition').modal('hide');
				cohortDefinitionAPI.getCohortDefinition(id).then(function (cohortDefinition) {
					self.targetId(cohortDefinition.id);
					self.targetCaption(cohortDefinition.name);
					cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
					self.targetCohortDefinition(new CohortDefinition(cohortDefinition));
				});
			}

			self.conceptsetSelected = function (d) {
				$('#modalConceptSet').modal('hide');
				vocabularyAPI.getConceptSetExpression(d.id).then(function (csExpression) {
					self.targetId(d.id);
					self.targetCaption(d.name);
					var conceptSetData = new ConceptSet({
						id: d.id,
						name: d.name,
						expression: csExpression
					});
					self.targetExpression.removeAll();
					self.targetExpression.push(conceptSetData);

					vocabularyAPI.getConceptSetExpressionSQL(csExpression).then(
						function (data) {
							self.targetConceptSetSQL(data);
						});
				});
			}

			self.chooseTarget = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().targetComparator().targetId;
				self.targetCaption = self.cohortComparison().targetComparator().targetCaption;
				self.targetCohortDefinition = self.cohortComparison().targetComparator().targetCohortDefinition;
			}

			self.chooseComparator = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().targetComparator().comparatorId;
				self.targetCaption = self.cohortComparison().targetComparator().comparatorCaption;
				self.targetCohortDefinition = self.cohortComparison().targetComparator().comparatorCohortDefinition;
			}

			self.chooseOutcome = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().outcome().outcomeId;
				self.targetCaption = self.cohortComparison().outcome().outcomeCaption;
				self.targetCohortDefinition = self.cohortComparison().outcome().outcomeCohortDefinition;
			}

			self.clearTarget = function () {
				self.cohortComparison().targetComparator().targetId(0);
				self.cohortComparison().targetComparator().targetCaption(null);
				self.cohortComparison().targetComparator().targetCohortDefinition(null);
			}

			self.clearComparator = function () {
				self.cohortComparison().targetComparator().comparatorId(0);
				self.cohortComparison().targetComparator().comparatorCaption(null);
				self.cohortComparison().targetComparator().comparatorCohortDefinition(null);
			}

			self.clearOutcome = function () {
				self.cohortComparison().outcome().outcomeId(0);
				self.cohortComparison().outcome().outcomeCaption(null);
				self.cohortComparison().outcome().outcomeCohortDefinition(null);
			}

			self.clearPsExclusion = function () {
				self.cohortComparison().targetComparator().psExclusionId(0);
				self.cohortComparison().targetComparator().psExclusionCaption(null);
				self.cohortComparison().targetComparator().psExclusionConceptSet.removeAll();
				self.cohortComparison().targetComparator().psExclusionConceptSetSQL(null);
			}

			self.clearPsInclusion = function () {
				self.cohortComparison().targetComparator().psInclusionId(0);
				self.cohortComparison().targetComparator().psInclusionCaption(null);
				self.cohortComparison().targetComparator().psInclusionConceptSet.removeAll();
				self.cohortComparison().targetComparator().psInclusionConceptSetSQL(null);
			}

			self.clearOmExclusion = function () {
				self.cohortComparison().analysis().omExclusionId(0);
				self.cohortComparison().analysis().omExclusionCaption(null);
				self.cohortComparison().analysis().omExclusionConceptSet.removeAll();
				self.cohortComparison().analysis().omExclusionConceptSetSQL(null);
			}

			self.clearOmInclusion = function () {
				self.cohortComparison().analysis().omInclusionId(0);
				self.cohortComparison().analysis().omInclusionCaption(null);
				self.cohortComparison().analysis().omInclusionConceptSet.removeAll();
				self.cohortComparison().analysis().omInclusionConceptSetSQL(null);
			}

			self.clearNegativeControl = function () {
				self.cohortComparison().analysis().negativeControlId(0);
				self.cohortComparison().analysis().negativeControlCaption(null);
				self.cohortComparison().analysis().negativeControlConceptSet.removeAll();
				self.cohortComparison().analysis().negativeControlConceptSetSQL(null);
			}

			self.choosePsExclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().targetComparator().psExclusionId;
				self.targetCaption = self.cohortComparison().targetComparator().psExclusionCaption;
				self.targetExpression = self.cohortComparison().targetComparator().psExclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().targetComparator().psExclusionConceptSetSQL;
			}

			self.choosePsInclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().targetComparator().psInclusionId;
				self.targetCaption = self.cohortComparison().targetComparator().psInclusionCaption;
				self.targetExpression = self.cohortComparison().targetComparator().psInclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().targetComparator().psInclusionConceptSetSQL;
			}

			self.chooseOmExclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().analysis().omExclusionId;
				self.targetCaption = self.cohortComparison().analysis().omExclusionCaption;
				self.targetExpression = self.cohortComparison().analysis().omExclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().analysis().omExclusionConceptSetSQL;
			}

			self.chooseOmInclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().analysis().omInclusionId;
				self.targetCaption = self.cohortComparison().analysis().omInclusionCaption;
				self.targetExpression = self.cohortComparison().analysis().omInclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().analysis().omInclusionConceptSetSQL;
			}

			self.chooseNegativeControl = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().analysis().negativeControlId;
				self.targetCaption = self.cohortComparison().analysis().negativeControlCaption;
				self.targetExpression = self.cohortComparison().analysis().negativeControlConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().analysis().negativeControlConceptSetSQL;
			}

			self.chooseConceptSet = function (conceptSetType, observable) {
				self.targetObservable = observable;
				$('#modalConceptSet').modal('show');
			}
		}

		var component = {
			viewModel: cohortComparisonSpecificationEditor,
			template: view
		};

		ko.components.register('cohort-comparison-spec-editor', component);
		return component;
	}
);
