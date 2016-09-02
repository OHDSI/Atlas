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
				'databindings', 
				'css!styles/cartoon.css','cohortdefinitionviewer/expressionCartoonBinding'
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

	function conceptSetSorter(a,b)
	{
		var textA = a.name().toUpperCase();
		var textB = b.name().toUpperCase();
		return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
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
		self.isSaveable = ko.pureComputed(function () {
			return self.dirtyFlag() && self.dirtyFlag().isDirty();
		});
		self.tabPath = ko.computed(function() {
			var path = self.tabMode();
			if (path === 'export') {
				path += '/' + self.exportTabMode();
			}
			console.log('tabPath:', path);
			return path;
		});
		self.delayedCartoonUpdate = ko.observable(null);

		self.canGenerate = ko.pureComputed(function () {
			var isDirty = self.dirtyFlag() && self.dirtyFlag().isDirty();
			var isNew = self.model.currentCohortDefinition() && (self.model.currentCohortDefinition().id() == 0);
			var canGenerate = !(isDirty || isNew);
			return (canGenerate);
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
		self.selectedReportCaption = ko.observable();
		self.loadingInclusionReport = ko.observable(false);
		self.sortedConceptSets = self.model.currentCohortDefinition().expression().ConceptSets.extend({sorted: conceptSetSorter});

		// model behaviors
		self.onConceptSetTabRespositoryConceptSetSelected = function (conceptSet) {
			self.model.loadConceptSet(conceptSet.id, 'cohortdefinition', 'cohort', 'details');
		}

		self.pollForInfo = function () {
			if (pollTimeout)
				clearTimeout(pollTimeout);

			var id = pageModel.currentCohortDefinition().id();
			cohortDefinitionAPI.getInfo(id).then(function (infoList) {
				var hasPending = false;
				
				infoList.forEach(function (info) {
					// obtain source reference
					var source = self.model.cohortDefinitionSourceInfo().filter(function (cdsi) {
						var sourceId = self.config.services[0].sources.filter(source=>source.sourceKey==cdsi.sourceKey)[0].sourceId;
						return sourceId == info.id.sourceId;
					})[0];

					if (source) {
						// only bother updating those sources that we know are running
						if (self.isSourceRunning(source)) {
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
					}
				});
				
				if (hasPending) {
					pollTimeout = setTimeout(function () {
						self.pollForInfo();
					}, 5000);
				}
			});
		}

		self.delete = function () {
			if (!confirm("Delete cohort definition? Warning: deletion can not be undone!"))
				return;
			
			clearTimeout(pollTimeout);

			// reset view after save
			cohortDefinitionAPI.deleteCohortDefinition(self.model.currentCohortDefinition().id()).then(function (result) {
				self.model.currentCohortDefinition(null);
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

			var definition = ko.toJS(self.model.currentCohortDefinition());

			// for saving, we flatten the expresson JS into a JSON string
			definition.expression = ko.toJSON(definition.expression, pruneJSON);

			// reset view after save
			cohortDefinitionAPI.saveCohortDefinition(definition).then(function (result) {
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
				document.location = "#/cohortdefinition/" + result.id;
			});
		}

		self.isRunning = ko.pureComputed(function() {
				return self.model.cohortDefinitionSourceInfo().filter(function (info) {
					return !(info.status() == "COMPLETE" || info.status() == "n/a") ;
				}).length > 0;
		});
		
		self.isSourceRunning = function (source) {
			if (source) {
				switch (source.status()) {
				case 'COMPLETE':
					return false;
					break;
				case 'n/a':
					return false;
					break;
				default:
					return true;
				}
			} else {
				return false;
			}
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

		self.getSourceInfo = function (sourceKey) {
			return self.model.cohortDefinitionSourceInfo().filter(function (d) {
				return d.sourceKey == sourceKey
			})[0];
		}

		self.generateCohort = function (source, event) {
			var route = config.services[0].url + 'cohortdefinition/' + self.model.currentCohortDefinition().id() + '/generate/' + source.sourceKey;
			self.getSourceInfo(source.sourceKey).status('PENDING');			
			$.ajax(route, {
				success: function (data) {
					setTimeout(function () {
						self.pollForInfo();
					}, 3000);
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

		self.selectInclusionReport = function (item) {
			self.loadingInclusionReport(true);
			self.selectedReportCaption(item.name);

			cohortDefinitionAPI.getReport(self.model.currentCohortDefinition().id(), item.sourceKey).then(function (report) {
				report.sourceKey = item.sourceKey;
				self.selectedReport(report);
				self.loadingInclusionReport(false);
			});
		}

		// dispose subscriptions
		self.dispose = function () {
			//self.currentCohortDefinitionSubscription.dispose();
		}
		self.getCriteriaIndexComponent = function (data) {
			data = ko.utils.unwrapObservable(data);
			if (!data) return;
			if (data.hasOwnProperty("ConditionOccurrence"))
				return "condition-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("ConditionEra"))
				return "condition-era-criteria-viewer";
			else if (data.hasOwnProperty("DrugExposure"))
				return "drug-exposure-criteria-viewer";
			else if (data.hasOwnProperty("DrugEra"))
				return "drug-era-criteria-viewer";
			else if (data.hasOwnProperty("DoseEra"))
				return "dose-era-criteria-viewer";
			else if (data.hasOwnProperty("ProcedureOccurrence"))
				return "procedure-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("Observation"))
				return "observation-criteria-viewer";			
			else if (data.hasOwnProperty("VisitOccurrence"))
				return "visit-occurrence-criteria-viewer";			
			else if (data.hasOwnProperty("DeviceExposure"))
				return "device-exposure-criteria-viewer";			
			else if (data.hasOwnProperty("Measurement"))
				return "measurement-criteria-viewer";
			else if (data.hasOwnProperty("Specimen"))
				return "specimen-criteria-viewer";
			else if (data.hasOwnProperty("ObservationPeriod"))
				return "observation-period-criteria-viewer";			
			else if (data.hasOwnProperty("Death"))
				return "death-criteria-viewer";			
			else
				return "unknownCriteriaType";
		};
		self.selectedCriteria = ko.observable();
	}

	var component = {
		viewModel: cohortDefinitionManager,
		template: view
	};

	ko.components.register('cohort-definition-manager', component);
	return component;
});
