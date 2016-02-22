define(['knockout', 
				'text!./cohort-definition-manager.html', 
				'appConfig',
				'cohortbuilder/CohortDefinition',
				'webapi/CohortDefinitionAPI',
				'ohdsi.util',
				'knockout.dataTables.binding',
				'faceted-datatable'
], function (ko, view, config, CohortDefinition, chortDefinitionAPI, ohdsiUtil) {
	
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
		
		self.model = params.model;
		self.tabMode = self.model.currentCohortDefinitionMode; //ko.observable('definition');
        self.conceptSetTabMode = self.model.currentConceptSetMode; //ko.observable('details');
		self.dirtyFlag = self.model.currentCohortDefinitionDirtyFlag;
		self.sources = ko.observableArray();
		self.isGeneratedOpen = ko.observable(false);
		self.generatedSql = {};
		self.isRunning = ko.pureComputed(function () {
			return self.sources().filter(function (source) {
				return source.info() && source.info().status != "COMPLETE";
			}).length > 0;
		});
		self.isSaveable = ko.pureComputed(function () {
			return self.dirtyFlag() && self.dirtyFlag().isDirty() && self.isRunning();
		});
/*
		self.currentCohortDefinitionSubscription = self.model.currentCohortDefinition.subscribe(function (newValue) {
			self.dirtyFlag(new ohdsiUtil.dirtyFlag(newValue));
		});
*/		
		// model behaviors
		self.onConceptSetTabRespositoryConceptSetSelected = function(conceptSet){
			self.model.loadConceptSet(conceptSet.id, 'cohortdefinition', 'cohort', 'details');
            //self.sendToConceptSetEditor(conceptSet.id);
		}
        
/*
		self.sendToConceptSetEditor = function(id) {
			window.location.href = "#/cohortdefinition/" + self.model.currentCohortDefinition().id() + "/conceptset/" + id + '/details';            
		}

*/
        self.pollForInfo = function() {
			if (pollTimeout)
				clearTimeout(pollTimeout);

			chortDefinitionAPI.getInfo(self.selectedDefinition().id()).then(function (infoList) {
				var hasPending = false;
				infoList.forEach(function (info) {
					var source = self.sources().filter(function (s) {
						return s.source.sourceId == info.id.sourceId
					})[0];
					if (source) {
						source.info(info);
						if (info.status != "COMPLETE")
							hasPending = true;
					}
				});

				if (hasPending) {
					pollTimeout = setTimeout(function () {
						pollForInfo();
					}, 5000);
				}
			});
		}
		
		self.delete = function () {
			clearTimeout(pollTimeout);

			// reset view after save
			chortDefinitionAPI.deleteCohortDefinition(self.model.currentCohortDefinition().id()).then(function (result) {
				console.log("Deleted...");
				document.location = "#/cohortdefinitions" 
			});
		}
		
		self.save = function () {
			clearTimeout(pollTimeout);

			var definition = ko.toJS(self.model.currentCohortDefinition());

			// for saving, we flatten the expresson JS into a JSON string
			definition.expression = ko.toJSON(definition.expression, pruneJSON);

			// reset view after save
			chortDefinitionAPI.saveCohortDefinition(definition).then(function (result) {
				console.log("Saved...");
				result.expression = JSON.parse(result.expression);
				var definition = new CohortDefinition(result);
				if (!definition.id)
					document.location = "#/cohortdefinition/" + result.id;
				else
					self.model.currentCohortDefinition(definition);
			});
		}

		self.copy = function () {
			clearTimeout(pollTimeout);

			// reset view after save
			chortDefinitionAPI.copyCohortDefinition(self.model.currentCohortDefinition().id()).then(function (result) {
				console.log("Copied...");
				document.location = "#/cohortdefinition/" + result.id;
			});
		}
		
		self.showSql = function () {
			self.generatedSql.mssql = null;
			self.generatedSql.oracle = null;
			self.generatedSql.postgres = null;
			self.generatedSql.redshift = null;
			self.generatedSql.msaps = null;


			var expression = ko.toJS(self.model.currentCohortDefinition().expression, pruneJSON);
			var templateSqlPromise = chortDefinitionAPI.getSql(expression);

			templateSqlPromise.then(function (result) {

				var mssqlTranslatePromise = translateSql(result.templateSql, 'sql server');
				mssqlTranslatePromise.then(function (result) {
					self.generatedSql.mssql = result.targetSQL;
				});

				var msapsTranslatePromise = translateSql(result.templateSql, 'pdw');
				msapsTranslatePromise.then(function (result) {
					self.generatedSql.msaps = result.targetSQL;
				});

				var oracleTranslatePromise = translateSql(result.templateSql, 'oracle');
				oracleTranslatePromise.then(function (result) {
					self.generatedSql.oracle = result.targetSQL;
				});

				var postgresTranslatePromise = translateSql(result.templateSql, 'postgresql');
				postgresTranslatePromise.then(function (result) {
					self.generatedSql.postgres = result.targetSQL;
				});

				var redshiftTranslatePromise = translateSql(result.templateSql, 'redshift');
				redshiftTranslatePromise.then(function (result) {
					self.generatedSql.redshift = result.targetSQL;
				});

				$.when(mssqlTranslatePromise, msapsTranslatePromise, oracleTranslatePromise, postgresTranslatePromise, redshiftTranslatePromise).then(function () {
					self.isGeneratedOpen(true);
				});
			});
		}

		self.generateCohort = function(data,event) {
			var route = self.model.services()[0].url + 'cohortdefinition/' + self.model.currentCohortDefinition().id() + '/generate/' + data.key;
			$.ajax(route,{
				success: function(data) {
					console.log(data);
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
					for (var j = 0; j < analysesTypes[i].analyses.length; j++) {
						analysisIdentifiers.push(analysesTypes[i].analyses[j].analysisId);
					}
				}
			}

			if (analysisIdentifiers.length > 0) {
				$(event.target).prop('value', 'Starting job...');
				var cohortDefinitionId = pageModel.currentCohortDefinition().id;
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
					url: self.model.services()[0].url + 'cohortanalysis',
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

		// dispose subscriptions
		self.dispose = function()
		{
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
