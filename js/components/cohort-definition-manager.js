define(['knockout', 'text!./cohort-definition-manager.html',
				'appConfig',
				'cohortbuilder/CohortDefinition',
				'webapi/CohortDefinitionAPI',
				'ohdsi.util',
        'cohortbuilder/CohortExpression',
				'cohortbuilder/InclusionRule',
				'cohortbuilder/components/FeasibilityReportViewer',
				'knockout.dataTables.binding',
				'faceted-datatable',
				'databindings'
], function (ko, view, config, CohortDefinition, cohortDefinitionAPI, ohdsiUtil, CohortExpression, InclusionRule) {

	function translateSql(sql, dialect) {
		translatePromise = $.ajax({
			url: config.webAPIRoot + 'sqlrender/translate',
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				SQL: sql,
				targetdialect: dialect
			}),
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return translatePromise;
	}

	function pruneJSON(key, value) {
		if (value === 0 || value) {
			return value;
		} else {
			return
		}
	}

	function cohortDefinitionManager(params) {
		var self = this;
		var pollTimeout = null;
		self.config = config;
		self.model = params.model;

		self.generatedSql = {};
		self.generatedSql.mssql = ko.observable('');
		self.generatedSql.oracle = ko.observable('');
		self.generatedSql.postgresql = ko.observable('');
		self.generatedSql.redshift = ko.observable('');
		self.generatedSql.msaps = ko.observable('');

		self.tabMode = self.model.currentCohortDefinitionMode;
		self.exportTabMode = ko.observable('printfriendly');
		self.exportSqlMode = ko.observable('mssql');
		self.conceptSetTabMode = self.model.currentConceptSetMode;
		self.dirtyFlag = self.model.currentCohortDefinitionDirtyFlag;
		self.isLoadingSql = ko.observable(false);
		self.isRunning = ko.observable(false);
		self.isSaveable = ko.pureComputed(function () {
			return self.dirtyFlag() && self.dirtyFlag().isDirty() && self.isRunning();
		});


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

		self.selectedFragment = ko.observable();
    self.selectedReport = ko.observable();	
		
		// model behaviors
		self.onConceptSetTabRespositoryConceptSetSelected = function (conceptSet) {
			self.model.loadConceptSet(conceptSet.id, 'cohortdefinition', 'cohort', 'details');
		}

		self.pollForInfo = function () {
			self.isRunning(true);

			if (pollTimeout)
				clearTimeout(pollTimeout);

			cohortDefinitionAPI.getInfo(pageModel.currentCohortDefinition().id()).then(function (infoList) {
				var hasPending = false;
				infoList.forEach(function (info) {
					var source = self.model.cohortDefinitionSourceInfo().filter(function (s) {
						return s.sourceId == info.id.sourceId
					})[0];

					if (source) {
						source.status(info.status);
						source.isValid(info.isValid);
						var date = new Date(info.startTime);
						source.startTime(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
						source.executionDuration('...');
						source.distinctPeople('...');

						if (info.status != "COMPLETE") {
							hasPending = true;
						} else {
							source.executionDuration((info.executionDuration / 1000) + 's');
							self.model.getCohortCount(source, source.distinctPeople);
						}
					}
				});

				if (hasPending) {
					pollTimeout = setTimeout(function () {
						self.pollForInfo();
					}, 5000);
				} else {
					self.isRunning(false);
				}
			});
		}

		self.delete = function () {
			clearTimeout(pollTimeout);

			// reset view after save
			cohortDefinitionAPI.deleteCohortDefinition(self.model.currentCohortDefinition().id()).then(function (result) {
				self.model.currentCohortDefinition(null);
				console.log("Deleted...");
				document.location = "#/cohortdefinitions"
			});
		}

		self.save = function () {
			clearTimeout(pollTimeout);

			// If we are saving a new cohort definition (id ==0) then clear
			// the id field before saving
			if (self.model.currentCohortDefinition().id() == 0) {
				self.model.currentCohortDefinition().id(undefined);
			}

			console.log(self.model.currentCohortDefinition().expression().InclusionRules());

			var definition = ko.toJS(self.model.currentCohortDefinition());

			// for saving, we flatten the expresson JS into a JSON string
			definition.expression = ko.toJSON(definition.expression, pruneJSON);

			// reset view after save
			cohortDefinitionAPI.saveCohortDefinition(definition).then(function (result) {
				console.log("Saved...");
				result.expression = JSON.parse(result.expression);
				var definition = new CohortDefinition(result);

				var redirectWhenComplete = definition.id() != self.model.currentCohortDefinition().id();
				self.model.currentCohortDefinition(definition);
				if (redirectWhenComplete) {
					document.location = "#/cohortdefinition/" + definition.id();
				}
			});
		}

		self.close = function () {
			if (self.model.currentCohortDefinitionDirtyFlag().isDirty() && !confirm("Your cohort changes are not saved. Would you like to continue?")) {
				return;
			} else {
				document.location = "#/cohortdefinitions"
				self.model.currentConceptSet(null);
				self.model.currentConceptSetDirtyFlag.reset();
				self.model.currentCohortDefinition(null);
				self.model.currentCohortDefinitionDirtyFlag().reset();
				self.model.reportCohortDefinitionId(null);
				self.model.reportReportName(null);
				self.model.reportSourceKey(null);
			}
		}

		self.copy = function () {
			clearTimeout(pollTimeout);

			// reset view after save
			cohortDefinitionAPI.copyCohortDefinition(self.model.currentCohortDefinition().id()).then(function (result) {
				console.log("Copied...");
				document.location = "#/cohortdefinition/" + result.id;
			});
		}

		self.showSql = function () {
			self.isLoadingSql(true);

			self.generatedSql.mssql('');
			self.generatedSql.oracle('');
			self.generatedSql.postgresql('');
			self.generatedSql.redshift('');
			self.generatedSql.msaps('');

			var expression = ko.toJS(self.model.currentCohortDefinition().expression, pruneJSON);
			var templateSqlPromise = cohortDefinitionAPI.getSql(expression);

			templateSqlPromise.then(function (result) {

				var mssqlTranslatePromise = translateSql(result.templateSql, 'sql server');
				mssqlTranslatePromise.then(function (result) {
					self.generatedSql.mssql(result.targetSQL);
				});

				var msapsTranslatePromise = translateSql(result.templateSql, 'pdw');
				msapsTranslatePromise.then(function (result) {
					self.generatedSql.msaps(result.targetSQL);
				});

				var oracleTranslatePromise = translateSql(result.templateSql, 'oracle');
				oracleTranslatePromise.then(function (result) {
					self.generatedSql.oracle(result.targetSQL);
				});

				var postgresTranslatePromise = translateSql(result.templateSql, 'postgresql');
				postgresTranslatePromise.then(function (result) {
					self.generatedSql.postgresql(result.targetSQL);
				});

				var redshiftTranslatePromise = translateSql(result.templateSql, 'redshift');
				redshiftTranslatePromise.then(function (result) {
					self.generatedSql.redshift(result.targetSQL);
				});

				$.when(mssqlTranslatePromise, msapsTranslatePromise, oracleTranslatePromise, postgresTranslatePromise, redshiftTranslatePromise).then(function () {
					self.isLoadingSql(false);
				});
			});
		}

		self.generateCohort = function (data, event) {
			var route = config.services[0].url + 'cohortdefinition/' + self.model.currentCohortDefinition().id() + '/generate/' + data.sourceKey;
			$.ajax(route, {
				success: function (data) {
					self.pollForInfo();
				}
			});
		}

		self.generateAnalyses = function (data, event) {
			$(event.target).prop("disabled", true);

			var requestedAnalysisTypes = [];
			$('input[type="checkbox"][name="' + data.sourceKey + '"]:checked').each(function () {
				requestedAnalysisTypes.push($(this).val());
			});

			var analysisIdentifiers = [];

			var analysesTypes = pageModel.cohortAnalyses();
			for (var i = 0; i < analysesTypes.length; i++) {
				if (requestedAnalysisTypes.indexOf(analysesTypes[i].name) >= 0) {
					analysisIdentifiers.push.apply(analysisIdentifiers, analysesTypes[i].analyses);
					/*
					for (var j = 0; j < analysesTypes[i].analyses.length; j++) {
						analysisIdentifiers.push(analysesTypes[i].analyses[j].analysisId);
					}
                    */
				}
			}

			if (analysisIdentifiers.length > 0) {
				$(event.target).prop('value', 'Starting job...');
				var cohortDefinitionId = pageModel.currentCohortDefinition().id();
				var cohortJob = {};

				cohortJob.jobName = 'HERACLES' + '_COHORT_' + cohortDefinitionId + '_' + data.sourceKey;
				cohortJob.sourceKey = data.sourceKey;
				cohortJob.smallCellCount = 5;
				cohortJob.cohortDefinitionIds = [];
				cohortJob.cohortDefinitionIds.push(cohortDefinitionId);
				cohortJob.analysisIds = analysisIdentifiers;
				cohortJob.runHeraclesHeel = false;
				cohortJob.cohortPeriodOnly = false;

				// set concepts
				cohortJob.conditionConceptIds = [];
				cohortJob.drugConceptIds = [];
				cohortJob.procedureConceptIds = [];
				cohortJob.observationConceptIds = [];
				cohortJob.measurementConceptIds = [];

				$.ajax({
					url: config.services[0].url + 'cohortanalysis',
					data: JSON.stringify(cohortJob),
					method: 'POST',
					contentType: 'application/json',
					success: function (info) {
						// to do - handle returned reference to job
					}
				});
			} else {
				$(event.target).prop("disabled", false);
			}
		}

		self.hasCDM = function (source) {
			for (var d = 0; d < source.daimons.length; d++) {
				if (source.daimons[d].daimonType == 'CDM') {
					return true;
				}
			}
			return false;
		}

		self.hasResults = function (source) {
			for (var d = 0; d < source.daimons.length; d++) {
				if (source.daimons[d].daimonType == 'Results') {
					return true;
				}
			}
			return false;
		}

		self.closeConceptSet = function () {
			self.model.clearConceptSet()
		}

		self.deleteConceptSet = function () {
			self.model.currentCohortDefinition().expression().ConceptSets.remove(
				function (item) {
					return item.id == self.model.currentConceptSet().id;
				}
			);
			self.closeConceptSet();
		}

		self.viewReport = function (sourceKey, reportName) {
			// TODO: Should we prevent running an analysis on an unsaved cohort definition?
			if (self.model.currentCohortDefinition().id() > 0) {
				self.model.reportCohortDefinitionId(self.model.currentCohortDefinition().id());
				self.model.reportReportName(reportName);
				self.model.reportSourceKey(sourceKey);
				self.model.reportTriggerRun(true);
			}
		}

		self.reload = function () {
			if (self.modifiedJSON.length > 0) {
				var updatedExpression = JSON.parse(self.modifiedJSON);
				self.model.currentCohortDefinition().expression(new CohortExpression(updatedExpression));
			}
		}
        
		self.exportConceptSetsCSV = function () {
				window.open(config.services[0].url + 'cohortdefinition/' + self.model.currentCohortDefinition().id() + '/export/conceptset');
		}

		self.selectFeasiblityReport = function (item) {
			console.log("feasiblity report selected.");	
			cohortDefinitionAPI.getReport(self.model.currentCohortDefinition().id(), item.sourceKey).then(function(report) {
				console.log("report loaded");
				report.sourceKey = item.sourceKey;
				self.selectedReport(report);
			});
		}
		
		// dispose subscriptions
		self.dispose = function () {
			//self.currentCohortDefinitionSubscription.dispose();
		}

	}

	var component = {
		viewModel: cohortDefinitionManager,
		template: view
	};

	ko.components.register('cohort-definition-manager', component);
	return component;
});