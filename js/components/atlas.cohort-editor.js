define(['knockout',
				'text!./atlas.cohort-editor.html',
				'appConfig',
				'cohortbuilder/CohortDefinition',
				'webapi/CohortDefinitionAPI',
				'cohortbuilder/components',
				'conceptsetbuilder/components',
				'knockout-jqueryui/tabs',
				'cohortdefinitionviewer'
], function (ko, view, config, CohortDefinition, chortDefinitionAPI) {
	
	
	function dirtyFlag(root, isInitiallyDirty) {
		var result = function () {},
			_initialState = ko.observable(ko.toJSON(root, pruneJSON)),
			_isInitiallyDirty = ko.observable(isInitiallyDirty);

		result.isDirty = ko.pureComputed(function () {
			return _isInitiallyDirty() || _initialState() !== ko.toJSON(root, pruneJSON);
		}).extend({
			rateLimit: 500
		});;

		result.reset = function () {
			_initialState(ko.toJSON(root));
			_isInitiallyDirty(false);
		};

		return result;
	}	
	
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
	
	function cohortEditor(params) {
		var self = this;
		
		var pollTimeout = null;
		
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
		
		self.model = params.model;
		self.tabWidget = ko.observable();
		self.conceptSetEditor = ko.observable();
		self.cohortExpressionEditor = ko.observable();
		self.isGeneratedOpen = ko.observable(false);
		self.generatedSql = {};
		self.dirtyFlag = ko.observable(self.model.currentCohortDefinition() && new dirtyFlag(self.model.currentCohortDefinition()));
		self.sources = ko.observableArray();
		self.isRunning = ko.pureComputed(function () {
			return self.sources().filter(function (source) {
				return source.info() && source.info().status != "COMPLETE";
			}).length > 0;
		});
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

		// model behaviors
		
		self.model.currentCohortDefinition.subscribe(function (newValue) {
			self.dirtyFlag(new dirtyFlag(newValue));
		});
		

		self.handleConceptSetSelect = function (item) {
			alert(item);
		}

		self.reload = function () {
			var updatedExpression = JSON.parse(self.modifiedJSON);
			self.model.currentCohortDefinition().expression(new CohortExpression(updatedExpression));
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

		self.delete = function () {
			clearTimeout(pollTimeout);

			// reset view after save
			chortDefinitionAPI.deleteCohortDefinition(self.model.currentCohortDefinition().id()).then(function (result) {
				console.log("Deleted...");
				document.location = "#/cohortdefinitions" 
			});
		}

		self.newDefinition = function () {
			var newDefinition = new CohortDefinition({
				"Title": "New Definition",
				"Type": "SIMPLE_DEFINITION"
			});

			self.dirtyFlag(new dirtyFlag(newDefinition, true));
			self.model.currentCohortDefinition(newDefinition);
			setTimeout(function () {
				self.tabWidget().tabs("option", "active", 1); // index 1 is the Concept Set Tab.
			}, 0);
		}

		self.onGenerate = function (generateComponent) {
			var generatePromise = chortDefinitionAPI.generate(self.model.currentCohortDefinition().id(), generateComponent.source.sourceKey);
			generatePromise.then(function (result) {
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