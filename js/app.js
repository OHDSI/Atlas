define(['jquery', 'knockout', 'ohdsi.util', 'appConfig', 'webapi/AuthAPI', 'atlas-state', 'facets', 'css!styles/tabs.css', 'css!styles/buttons.css'],
	function ($, ko, ohdsiUtil, config, authApi, sharedState) {
		var appModel = function () {
			$.support.cors = true;
			var self = this;
			self.authApi = authApi;
			self.componentParams = {};
			self.initPromises = [];
			self.applicationStatus = ko.observable('initializing');
			self.pendingSearch = ko.observable(false);
			self.pageTitle = ko.pureComputed(function () {
				var pageTitle = "ATLAS";
				switch (self.currentView()) {
					case 'loading':
						pageTitle = pageTitle + ": Loading";
						break;
					case 'home':
						pageTitle = pageTitle + ": Home";
						break;
					case 'search':
						pageTitle = pageTitle + ": Search";
						break;
					case 'conceptsets':
					case 'conceptset':
						pageTitle = pageTitle + ": Concept Sets";
						break;
					case 'concept':
						pageTitle = pageTitle + ": Concept";
						break;
					case 'cohortdefinitions':
					case 'cohortdefinition':
						pageTitle = pageTitle + ": Cohorts";
						break;
					case 'irbrowser':
					case 'iranalysis':
						pageTitle = pageTitle + ": Incidence Rate";
						break;
					case 'estimations':
					case 'estimation':
						pageTitle = pageTitle + ": Estimation";
						break;
					case 'profiles':
						pageTitle = pageTitle + ": Profiles";
						break;
					case 'plp-browser':
					case 'plp-manager':
						pageTitle = pageTitle + ": PLP";
						break;
				}

				if (self.hasUnsavedChanges()) {
					pageTitle = "*" + pageTitle + " (unsaved)";
				}

				return pageTitle;
			});
			self.sharedState = sharedState;

			self.initializationComplete = ko.pureComputed(function () {
				return sharedState.appInitializationStatus() != 'initializing';
			});

			self.initComplete = function () {
				if (self.sharedState.appInitializationStatus() == 'initializing') {
					var routerOptions = {
						notfound: function () {
							self.currentView('search');
						},
						on: function () {
							self.currentView('loading');
						}
					};
					var routes = {
						'/': function () {
							document.location = "#/home";
						},
						'/concept/:conceptId:': function (conceptId) {
							require(['concept-manager'], function () {
								self.currentConceptId(conceptId);
								self.componentParams = {
									model: self
								};
								self.currentView('concept-manager');
							});
						},
						'/cohortdefinitions': function () {
							require(['cohort-definitions', 'cohort-definition-manager', 'cohort-definition-browser'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('cohort-definitions');
							});
						},
						'/cohortdefinition/:cohortDefinitionId:': function (cohortDefinitionId) {
							require(['cohortbuilder/CohortDefinition', 'components/atlas.cohort-editor', 'cohort-definitions', 'cohort-definition-manager', 'cohort-definition-browser', 'conceptset-editor', 'report-manager', 'explore-cohort'], function (CohortDefinition) {
								self.componentParams = {
									model: self
								};
								self.currentView('cohort-definition-manager');
								self.currentCohortDefinitionMode('definition');
								self.loadCohortDefinition(cohortDefinitionId, null, 'cohort-definition-manager', 'details');
							});
						},
						'/cohortdefinition/:cohortDefinitionId/conceptset/:conceptSetId/:mode:': function (cohortDefinitionId, conceptSetId, mode) {
							require(['report-manager', 'cohortbuilder/CohortDefinition', 'components/atlas.cohort-editor', 'cohort-definitions', 'cohort-definition-manager', 'cohort-definition-browser', 'conceptset-editor', 'explore-cohort'], function (CohortDefinition) {
								self.componentParams = {
									model: self
								};
								self.currentView('cohort-definition-manager');
								self.currentCohortDefinitionMode('conceptsets');
								self.loadCohortDefinition(cohortDefinitionId, conceptSetId, 'cohort-definition-manager', 'details');
							});
						},
						'/datasources': function () {
							require(['data-sources'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('data-sources');
							});
						},
						'/datasources/:sourceKey/:reportName': function (sourceKey, reportName) {
							require(['data-sources'], function () {
								self.componentParams = {
									model: self,
									reportName: reportName,
									sourceKey: sourceKey
								};
								self.currentView('data-sources');
							});
						},
						'/configure': function () {
							require(['configuration'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('ohdsi-configuration');
							});
						},
						'/roles': function () {
							require(['roles'], function () {
								self.currentView('roles');
							});
						},
						'/role/:id': function (id) {
							require(['role-details'], function () {
								self.componentParams = {
									model: self
								};
								self.currentRoleId(id);
								self.currentView('role-details');
							});
						},
						'/home': function () {
							require(['home'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('home');
							});
						},
						'/welcome/:token': function (token) {
							require(['welcome'], function () {
								authApi.token(token);
								document.location = "#/welcome";
							});
						},
						'/jobs': function () {
							require(['job-manager'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('job-manager');
							});
						},
						'/reports': function () {
							require(['report-manager', 'cohort-definition-manager', 'cohort-definition-browser'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('report-manager');
							});
						},
						'/import': function () {
							require(['importer'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('importer');
							});
						},
						'/profiles/?((\w|.)*)': function (path) {
							require(['profile-manager', 'cohort-definition-browser'], function () {
								path = path.split("/");
								self.componentParams = {
									model: self,
									sourceKey: (path[0] || null),
									personId: (path[1] || null),
									cohortDefinitionId: (path[2] || null)
								};
								self.currentView('profile-manager');
							});
						},
						'/conceptset/:conceptSetId/:mode': function (conceptSetId, mode) {
							require(['conceptset-manager', 'cohort-definition-browser'], function () {
								self.componentParams = {
									model: self
								};
								self.loadConceptSet(conceptSetId, 'conceptset-manager', 'repository', mode);
								self.resolveConceptSetExpression();
							});
						},
						'/conceptsets': function () {
							require(['conceptset-browser'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('conceptset-browser');
							});
						},
						'/search/:query:': function (query) {
							require(['search'], function (search) {
								self.componentParams = {
									model: self,
									query: unescape(query)
								};
								self.currentView('search');
							});
						},
						'/search': function () {
							require(['search'], function (search) {
								self.componentParams = {
									model: self
								};
								self.currentView('search');
							});
						},
						'/estimation': function () {
							require(['cohort-comparison-browser'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('cohort-comparison-browser');
							});
						},
						'/estimation/:cohortComparisonId:': function (cohortComparisonId) {
							require(['cohort-comparison-manager', 'cohort-definition-browser', 'components/atlas.cohort-editor', 'cohort-comparison-print-friendly', 'cohort-comparison-r-code', 'cohort-comparison-multi-r-code'], function () {
								self.currentCohortComparisonId(+cohortComparisonId);
								self.componentParams = {
									currentCohortComparisonId: self.currentCohortComparisonId,
									currentCohortComparison: self.currentCohortComparison,
									dirtyFlag: self.currentCohortComparisonDirtyFlag
								};
								self.currentView('cohort-comparison-manager');
							});
						},
						'/iranalysis': function () {
							require(['ir-browser'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('ir-browser');
							});
						},
						'/iranalysis/new': function (analysisId) {
							require(['ir-manager'], function () {
								self.selectedIRAnalysisId(null);
								self.componentParams = {
									model: self
								};
								self.currentView('ir-manager');
							});
						},
						'/iranalysis/:analysisId': function (analysisId) {
							require(['ir-manager'], function () {
								self.selectedIRAnalysisId(+analysisId);
								self.componentParams = {
									model: self
								};
								self.currentView('ir-manager');
							});
						},
						'/plp': function () {
							require(['plp-browser', 'plp-manager', 'plp-inspector'], function () {
								self.componentParams = {
									model: self
								};
								self.currentView('plp-browser');
							});
						},
						'/plp/:modelId:': function (modelId) {
							require(['plp-manager', 'plp-inspector', 'plp-roc', 'plp-calibration', 'plp-spec-editor', 'plp-r-code', 'plp-print-friendly', 'cohort-definition-browser', 'components/atlas.cohort-editor'], function () {
								self.currentPatientLevelPredictionId(+modelId);
								self.componentParams = {
									currentPatientLevelPredictionId: self.currentPatientLevelPredictionId,
									currentPatientLevelPrediction: self.currentPatientLevelPrediction,
									dirtyFlag: self.currentPatientLevelPredictionDirtyFlag,
								};
								self.currentView('plp-manager');
							});
						},
					};

					self.router = new Router(routes)
						.configure(routerOptions);
					self.router.init('/');
					self.applicationStatus('running');
					self.sharedState.appInitializationStatus("complete");
				} else {
					self.componentParams = {
						model: self
					};

					self.applicationStatus('initialization error');
					document.location = '#/configure';
				}
				setTimeout(function () {
					$('#splash')
						.hide();
				}, 0);
				setTimeout(function () {
					$('#wrapperLeftMenu')
						.show();
					$('#wrapperMainWindow')
						.show();
				}, 5);
			};

			self.relatedConceptsOptions = {
				Facets: [{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
			}, {
					'caption': 'Standard Concept',
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
			}, {
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
			}, {
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
			}, {
					'caption': 'Domain',
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
			}, {
					'caption': 'Relationship',
					'binding': function (o) {
						return $.map(o.RELATIONSHIPS, function (val) {
							return val.RELATIONSHIP_NAME
						});
					},
					isArray: true,
			}, {
					'caption': 'Has Records',
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT.toString()
							.replace(',', '')) > 0;
					}
			}, {
					'caption': 'Has Descendant Records',
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT.toString()
							.replace(',', '')) > 0;
					}
			}, {
					'caption': 'Distance',
					'binding': function (o) {
						return Math.max.apply(Math, o.RELATIONSHIPS.map(function (d) {
							return d.RELATIONSHIP_DISTANCE;
						}))
					},
			}]
			};

			self.relatedConceptsColumns = [{
				title: '<i class="fa fa-shopping-cart"></i>',
				render: function (s, p, d) {
					var css = '';
					var icon = 'fa-shopping-cart';
					if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
						css = ' selected';
					}
					return '<i class="fa ' + icon + ' ' + css + '"></i>';
				},
				orderable: false,
				searchable: false
		}, {
				title: 'Id',
				data: 'CONCEPT_ID'
		}, {
				title: 'Code',
				data: 'CONCEPT_CODE'
		}, {
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				}
		}, {
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
		}, {
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
		}, {
				title: 'RC',
				data: 'RECORD_COUNT',
				className: 'numeric'
		}, {
				title: 'DRC',
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
		}, {
				title: 'Domain',
				data: 'DOMAIN_ID'
		}, {
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
		}];
			self.relatedSourcecodesColumns = [{
				title: '',
				render: function (s, p, d) {
					var css = '';
					var icon = 'fa-shopping-cart';
					var tag = 'i'
					if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
						css = ' selected';
					}
					if (!self.canEditCurrentConceptSet()) {
						css += ' readonly';
						tag = 'span';
					}
					return '<' + tag + ' class="fa ' + icon + ' ' + css + '"></' + tag + '>';
				},
				orderable: false,
				searchable: false
		}, {
				title: 'Id',
				data: 'CONCEPT_ID'
		}, {
				title: 'Code',
				data: 'CONCEPT_CODE'
		}, {
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				}
		}, {
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
		}, {
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
		}, {
				title: 'Domain',
				data: 'DOMAIN_ID'
		}, {
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
		}];
			self.relatedSourcecodesOptions = {
				Facets: [{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
			}, {
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
			}, {
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
			}, {
					'caption': 'Domain',
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
			}]
			};
			self.metatrix = {
				'ATC.ATC 4th': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 5]
				}]
				},
				'ICD9CM.5-dig billing code': {
					childRelationships: [{
						name: 'Subsumes',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Is a',
						range: [0, 1]
				}]
				},
				'ICD9CM.4-dig nonbill code': {
					childRelationships: [{
						name: 'Subsumes',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Is a',
						range: [0, 1]
				}, {
						name: 'Non-standard to Standard map (OMOP)',
						range: [0, 1]
				}]
				},
				'ICD9CM.3-dig nonbill code': {
					childRelationships: [{
						name: 'Subsumes',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Non-standard to Standard map (OMOP)',
						range: [0, 999]
				}]
				},
				'RxNorm.Ingredient': {
					childRelationships: [{
						name: 'Ingredient of (RxNorm)',
						range: [0, 999]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						vocabulary: ['ATC', 'ETC'],
						range: [0, 1]
				}]
				},
				'RxNorm.Brand Name': {
					childRelationships: [{
						name: 'Ingredient of (RxNorm)',
						range: [0, 999]
				}],
					parentRelationships: [{
						name: 'Tradename of (RxNorm)',
						range: [0, 999]
				}]
				},
				'RxNorm.Branded Drug': {
					childRelationships: [{
						name: 'Consists of (RxNorm)',
						range: [0, 999]
				}],
					parentRelationships: [{
						name: 'Has ingredient (RxNorm)',
						range: [0, 999]
				}, {
						name: 'RxNorm to ATC (RxNorm)',
						range: [0, 999]
				}, {
						name: 'RxNorm to ETC (FDB)',
						range: [0, 999]
				}]
				},
				'RxNorm.Clinical Drug Comp': {
					childRelationships: [],
					parentRelationships: [{
						name: 'Has precise ingredient (RxNorm)',
						range: [0, 999]
				}, {
						name: 'Has ingredient (RxNorm)',
						range: [0, 999]
				}]
				},
				'CPT4.CPT4': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'CPT4.CPT4 Hierarchy': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'ETC.ETC': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'MedDRA.LLT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'MedDRA.PT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'MedDRA.HLT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'MedDRA.SOC': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'MedDRA.HLGT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'SNOMED.Clinical Finding': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				},
				'SNOMED.Procedure': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
				}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
				}]
				}
			};
			self.hasRelationship = function (concept, relationships) {
				for (var r = 0; r < concept.RELATIONSHIPS.length; r++) {
					for (var i = 0; i < relationships.length; i++) {
						if (concept.RELATIONSHIPS[r].RELATIONSHIP_NAME == relationships[i].name) {
							if (concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE >= relationships[i].range[0] && concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE <= relationships[i].range[1]) {
								if (relationships[i].vocabulary) {
									for (var v = 0; v < relationships[i].vocabulary.length; v++) {
										if (relationships[i].vocabulary[v] == concept.VOCABULARY_ID) {
											return true;
										}
									}
								} else {
									return true;
								}
							}
						}
					}
				}
				return false;
			}
			self.meetsRequirements = function (concept, requirements) {
				var passCount = 0;
				for (var r = 0; r < requirements.length; r++) {
					for (var f = 0; f < this.fe.Facets.length; f++) {
						if (this.fe.Facets[f].caption == requirements[r].c) {
							for (var m = 0; m < this.fe.Facets[f].Members.length; m++) {
								if (this.fe.Facets[f].Members[m].Name == requirements[r].n) {
									passCount++;
								}
							}
						}
					}
				}
				if (filters.length == requirements.length) {
					return true;
				} else {
					return false;
				}
			}
			self.contextSensitiveLinkColor = function (row, data) {
				var switchContext;
				if (data.STANDARD_CONCEPT == undefined) {
					switchContext = data.concept.STANDARD_CONCEPT;
				} else {
					switchContext = data.STANDARD_CONCEPT;
				}
				switch (switchContext) {
					case 'N':
						$('a', row)
							.css('color', '#a71a19');
						break;
					case 'C':
						$('a', row)
							.css('color', '#a335ee');
						break;
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
			self.renderConceptSetItemSelector = function (s, p, d) {
				var css = '';
				var tag = 'i';
				if (sharedState.selectedConceptsIndex[d.concept.CONCEPT_ID] == 1) {
					css = ' selected';
				}
				if (!self.canEditCurrentConceptSet()) {
					css += ' readonly';
					tag = 'span'; // to avoid call to 'click' event handler which is bound to <i> tag
				}
				return '<' + tag + ' class="fa fa-shopping-cart' + css + '"></' + tag + '>';
			}
			self.renderLink = function (s, p, d) {
				var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
				return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
			}
			self.renderBoundLink = function (s, p, d) {
				return '<a href=\"#/concept/' + d.concept.CONCEPT_ID + '\">' + d.concept.CONCEPT_NAME + '</a>';
			}
			// for the current selected concepts:
			// update the export panel
			// resolve the included concepts and update the include concept set identifier list
			self.resolveConceptSetExpression = function () {
				self.resolvingConceptSetExpression(true);
				var conceptSetExpression = '{"items" :' + ko.toJSON(sharedState.selectedConcepts()) + '}';
				var highlightedJson = self.syntaxHighlight(conceptSetExpression);
				self.currentConceptSetExpressionJson(highlightedJson);
				var conceptIdentifierList = [];
				for (var i = 0; i < sharedState.selectedConcepts()
					.length; i++) {
					conceptIdentifierList.push(sharedState.selectedConcepts()[i].concept.CONCEPT_ID);
				}
				self.currentConceptIdentifierList(conceptIdentifierList.join(','));
				var resolvingPromise = $.ajax({
					url: sharedState.vocabularyUrl() + 'resolveConceptSetExpression',
					data: conceptSetExpression,
					method: 'POST',
					contentType: 'application/json',
					success: function (info) {
						var identifiers = info;
						self.conceptSetInclusionIdentifiers(info);
						self.currentIncludedConceptIdentifierList(info.join(','));
						self.conceptSetInclusionCount(info.length);
						self.resolvingConceptSetExpression(false);
					},
					error: function (err) {
						self.resolvingConceptSetExpression(false);
						document.location = '#/configure';
					}
				});
				return resolvingPromise;
			};
			self.resolveConceptSetExpressionSimple = function (expression, success) {
				var resolvingPromise = $.ajax({
					url: sharedState.vocabularyUrl() + 'resolveConceptSetExpression',
					data: expression,
					method: 'POST',
					contentType: 'application/json',
					success: success || function (info) {
						var identifiers = info;
						self.conceptSetInclusionIdentifiers(info);
						self.currentIncludedConceptIdentifierList(info.join(','));
						self.conceptSetInclusionCount(info.length);
						self.resolvingConceptSetExpression(false);
					},
					error: function (err) {
						self.resolvingConceptSetExpression(false);
						document.location = '#/configure';
					}
				});
				return resolvingPromise;
			};
			self.renderCheckbox = function (field) {
				if (self.canEditCurrentConceptSet()) {
					return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); pageModel.resolveConceptSetExpression(); } ,css: { selected: ' + field + '} " class="fa fa-check"></span>';
				} else {
					return '<span data-bind="css: { selected: ' + field + '} " class="fa fa-check readonly"></span>';
				}
			}

			self.enableRecordCounts = ko.observable(true);
			self.loadingIncluded = ko.observable(false);
			self.loadingSourcecodes = ko.observable(false);
			self.loadingEvidence = ko.observable(false);
			self.loadingReport = ko.observable(false);
			self.loadingReportDrilldown = ko.observable(false);
			self.activeReportDrilldown = ko.observable(false);
			self.criteriaContext = ko.observable();
			self.cohortAnalyses = ko.observableArray();
			self.currentReport = ko.observable();
			// TODO: This object array was lifted from Heracles to capture the
			// various analysis "packages" to use when viewing. This information should be relocated
			// to the database and be made available through the WebAPI.
			self.visualizationPacks = ko.observableArray([{
				name: "Care Site",
				reportKey: null,
				analyses: [1200, 1201]
	}, {
				name: "Cohort Specific",
				reportKey: 'Cohort Specific',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
	}, {
				name: "Condition",
				reportKey: 'Condition',
				analyses: [116, 117, 400, 401, 402, 404, 405, 406, 1]
	}, {
				name: "Condition Eras",
				reportKey: 'Condition Eras',
				analyses: [1001, 1000, 1007, 1006, 1004, 1002, 116, 117, 1]
	}, {
				name: "Conditions by Index",
				reportKey: 'Conditions by Index',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
	}, {
				name: "Data Density",
				reportKey: null,
				analyses: [117, 220, 420, 502, 620, 720, 820, 920, 1020, 111, 403, 603, 703, 803, 903, 1003]
	}, {
				name: "Death",
				reportKey: 'Death',
				analyses: [501, 506, 505, 504, 502, 116, 117]
	}, {
				name: "Default",
				reportKey: null,
				analyses: [1, 2, 101, 108, 110]
	}, {
				name: "Drug Eras",
				reportKey: 'Drug Eras',
				analyses: [900, 901, 907, 906, 904, 902, 116, 117, 1]
	}, {
				name: "Drug Exposure",
				reportKey: 'Drug Exposure',
				analyses: [700, 701, 706, 715, 705, 704, 116, 702, 117, 717, 716, 1]
	}, {
				name: "Drugs by Index",
				reportKey: 'Drugs by Index',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
	}, {
				name: "Heracles Heel",
				reportKey: 'Heracles Heel',
				analyses: [7, 8, 9, 114, 115, 207, 208, 209, 210, 302, 409, 410, 411, 412, 413, 509, 510, 609, 610, 612, 613, 709, 710, 711, 712, 713, 809, 810, 812, 813, 814, 908, 909, 910, 1008, 1009, 1010, 1415, 1500, 1501, 1600, 1601, 1701, 103, 105, 206, 406, 506, 606, 706, 715, 716, 717, 806, 906, 907, 1006, 1007, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511, 1602, 1603, 1604, 1605, 1606, 1607, 1608, 511, 512, 513, 514, 515, 2, 4, 5, 200, 301, 400, 500, 505, 600, 700, 800, 900, 1000, 1609, 1610, 405, 605, 705, 805, 202, 3, 101, 420, 620, 720, 820, 920, 1020, 402, 602, 702, 802, 902, 1002, 1310, 1309, 1312, 1313, 1314]
	}, {
				name: "Location",
				reportKey: null,
				analyses: [1100, 1101]
	}, {
				name: "Measurement",
				reportKey: null,
				analyses: [1300, 1301, 1303, 1306, 1305, 1315, 1304, 1316, 1302, 1307, 1317, 1318, 1320, 117, 116, 1]
	}, {
				name: "Observation",
				reportKey: null,
				analyses: [800, 801, 806, 805, 815, 804, 802, 807, 816, 817, 818, 117, 116, 102, 112, 1]
	}, {
				name: "Observation Periods",
				reportKey: 'Observation Periods',
				analyses: [101, 104, 106, 107, 108, 109, 110, 113, 1]
	}, {
				name: "Person",
				reportKey: 'Person',
				analyses: [0, 1, 2, 3, 4, 5]
	}, {
				name: "Procedure",
				reportKey: 'Procedure',
				analyses: [606, 604, 116, 602, 117, 605, 600, 601, 1]
	}, {
				name: "Procedures by Index",
				reportKey: 'Procedures by Index',
				analyses: [1700, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1820, 1821, 1830, 1831, 1840, 1841, 1850, 1851, 1860, 1861, 1870, 1871, 116, 117, 1]
	}, {
				name: "Visit",
				reportKey: null,
				analyses: [202, 203, 206, 204, 116, 117, 211, 200, 201, 1]
	}, {
				name: "Data Completeness",
				reportKey: "Data Completeness",
				analyses: [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2021, 2022, 2023, 2024, 2025, 2026, 2027]
	}, {
				name: "Entropy",
				reportKey: "Entropy",
				analyses: [2031, 2032]
	}]);
			/*
        self.reports = ko.observableArray([
			'Person',
			'Cohort Specific',
			'Condition Eras',
			'Conditions by Index',
			'Drugs by Index',
			'Procedures by Index',
			'Observation Periods',
			'Condition',
			'Drug Eras',
			'Drug Exposure',
			'Procedure',
			'Death'
		]);
        */
			// The reports available are defined as part of the visualizationPacks() definition above
			self.reports = ko.observableArray(self.visualizationPacks()
				.map(function (item) {
					return item.reportKey
				})
				.filter(function (n) {
					return n != undefined
				})
				.sort());
			self.getSourceInfo = function (source) {
				var info = self.currentCohortDefinitionInfo();
				for (var i = 0; i < info.length; i++) {
					if (info[i].id.sourceId == source.sourceId) {
						return info[i];
					}
				}
			}
			self.getCohortCount = function (source, observable) {
				var sourceKey = source.sourceKey;
				var cohortDefinitionId = self.currentCohortDefinition() && self.currentCohortDefinition()
					.id();
				if (cohortDefinitionId != undefined) {
					$.ajax(config.api.url + 'cohortresults/' + sourceKey + '/' + cohortDefinitionId + '/distinctPersonCount', {
						observable: observable,
						success: function (result) {
							this.observable(result);
						}
					});
				}
			}
			self.routeToConceptSet = function () {
				if (self.currentConceptSet() == undefined) {
					document.location = "#/conceptset/0/details";
				} else {
					document.location = "#/conceptset/" + self.currentConceptSet()
						.id + "/details";
				}
			}
			self.getCompletedAnalyses = function (source) {
				var cohortDefinitionId = self.currentCohortDefinition()
					.id();
				$.ajax(config.api.url + 'cohortresults/' + source.sourceKey + '/' + cohortDefinitionId + '/analyses', {
					success: function (analyses) {
						sourceAnalysesStatus = {};
						// initialize cohort analyses status
						for (var i = 0; i < self.cohortAnalyses()
							.length; i++) {
							// If the analysis id's in the array returned from the ws call (analyses)
							// contains all of the elements in cohortAnalyses()[i] array, then we
							// know that the analysis has been completed
							var allAnalysesCompleted = analyses.filter(function (elem) {
									return self.cohortAnalyses()[i].analyses.indexOf(elem) > -1;
								})
								.length == self.cohortAnalyses()[i].analyses.length;
							if (self.cohortAnalyses()[8].reportKey == 'Heracles Heel') {
								if (analyses.filter(function (elem) {
										return self.cohortAnalyses()[i].analyses.indexOf(elem) > -1;
									})
									.length > 0) {
									sourceAnalysesStatus[self.cohortAnalyses()[i].name] = true;
								}
							} else {
								sourceAnalysesStatus[self.cohortAnalyses()[i].name] = allAnalysesCompleted ? 1 : 0;
							}
						}
						sourceAnalysesStatus.ready = true;
						self.sourceAnalysesStatus[source.sourceKey](sourceAnalysesStatus);
					}
				});
			}
			self.setConceptSet = function (conceptset, expressionItems) {
				for (var i = 0; i < expressionItems.length; i++) {
					var conceptSetItem = expressionItems[i];
					conceptSetItem.isExcluded = ko.observable(conceptSetItem.isExcluded);
					conceptSetItem.includeDescendants = ko.observable(conceptSetItem.includeDescendants);
					conceptSetItem.includeMapped = ko.observable(conceptSetItem.includeMapped);
					sharedState.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID] = 1;
					sharedState.selectedConcepts.push(conceptSetItem);
				}

				self.currentConceptSet({
					name: ko.observable(conceptset.name),
					id: conceptset.id
				});
			}
			self.loadCohortDefinition = function (cohortDefinitionId, conceptSetId, viewToShow, mode) {
				// don't load if it is already loaded or a new concept set
				if (self.currentCohortDefinition() && self.currentCohortDefinition()
					.id() == cohortDefinitionId) {
					if (self.currentConceptSet() && self.currentConceptSet()
						.id == conceptSetId && self.currentConceptSetSource() == 'cohort') {
						self.currentView(viewToShow);
						return;
					} else if (conceptSetId != null) {
						self.loadConceptSet(conceptSetId, viewToShow, 'cohort', mode);
						return;
					} else {
						self.currentView(viewToShow);
						return;
					}
				}
				if (self.currentCohortDefinition() && self.currentCohortDefinitionDirtyFlag() && self.currentCohortDefinitionDirtyFlag()
					.isDirty() && !confirm("Cohort changes are not saved. Would you like to continue?")) {
					window.location.href = "#/cohortdefinitions";
					return;
				}; // if we are loading a cohort definition, unload any active concept set that was loaded from
				// a respository. If it is dirty, prompt the user to save and exit.
				if (self.currentConceptSet()) {
					if (self.currentConceptSetSource() == 'repository') {
						if (self.currentConceptSetDirtyFlag && self.currentConceptSetDirtyFlag.isDirty() && !confirm("Concept set changes are not saved. Would you like to continue?")) {
							window.location.href = "#/cohortdefinitions";
							return;
						};
					}
					// If we continue, then clear the loaded concept set
					self.clearConceptSet();
				}
				self.currentView('loading');
				var definitionPromise, infoPromise;
				requirejs(['cohortbuilder/CohortDefinition'], function (CohortDefinition) {
					if (cohortDefinitionId == '0') {
						var def = new CohortDefinition({
							id: '0',
							name: 'New Cohort Definition'
						});
						self.currentCohortDefinition(def);
						definitionPromise = $.Deferred();
						definitionPromise.resolve();
						self.currentCohortDefinitionInfo([]);
						infoPromise = $.Deferred();
						infoPromise.resolve();
					} else {
						definitionPromise = $.ajax({
							url: config.api.url + 'cohortdefinition/' + cohortDefinitionId,
							method: 'GET',
							headers: {
								Authorization: authApi.getAuthorizationHeader()
							},
							contentType: 'application/json',
							success: function (cohortDefinition) {
								cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
								self.currentCohortDefinition(new CohortDefinition(cohortDefinition));
							}
						});
						infoPromise = $.ajax({
							url: config.api.url + 'cohortdefinition/' + cohortDefinitionId + '/info',
							method: 'GET',
							headers: {
								Authorization: authApi.getAuthorizationHeader()
							},
							contentType: 'application/json',
							success: function (generationInfo) {
								self.currentCohortDefinitionInfo(generationInfo);
							}
						});
					}
					$.when(infoPromise, definitionPromise)
						.done(function (ip, dp) {
							// Now that we have loaded up the cohort definition, we'll need to
							// resolve all of the concepts embedded in the concept set collection
							// to ensure they have all of the proper properties for editing in the cohort
							// editior
							var conceptPromise;
							if (self.currentCohortDefinition()
								.expression()
								.ConceptSets()) {
								var identifiers = $.makeArray($(self.currentCohortDefinition()
										.expression()
										.ConceptSets())
									.map(function (cs) {
										var allConceptIDs = $.makeArray($(this.expression.items())
											.map(function (item) {
												return this.concept.CONCEPT_ID;
											}));
										return allConceptIDs;
									}));
								conceptPromise = $.ajax({
									url: sharedState.vocabularyUrl() + 'lookup/identifiers',
									method: 'POST',
									headers: {
										Authorization: authApi.getAuthorizationHeader()
									},
									contentType: 'application/json',
									data: JSON.stringify(identifiers),
									error: authApi.handleAccessDenied,
									success: function (data) {
										// Update each concept set
										for (var i = 0; i < self.currentCohortDefinition()
											.expression()
											.ConceptSets()
											.length; i++) {
											// Update each of the concept set items
											var currentConceptSet = self.currentCohortDefinition()
												.expression()
												.ConceptSets()[i];
											for (var j = 0; j < currentConceptSet.expression.items()
												.length; j++) {
												var selectedConcept = $(data)
													.filter(function (item) {
														return this.CONCEPT_ID == currentConceptSet.expression.items()[j].concept.CONCEPT_ID
													});
												if (selectedConcept.length == 1)
													currentConceptSet.expression.items()[j].concept = selectedConcept[0];
												else
													console.error("Concept not found: " + currentConceptSet.expression.items()[j].concept.CONCEPT_ID + "," + currentConceptSet.expression.items()[j].concept.CONCEPT_NAME);
											}
											currentConceptSet.expression.items.valueHasMutated();
										}
										self.currentCohortDefinitionDirtyFlag()
											.reset();
									}
								});
							} else {
								conceptPromise = $.Deferred();
								conceptPromise.resolve();
							}
							$.when(conceptPromise)
								.done(function (cp) {
									// now that we have required information lets compile them into data objects for our view
									var cdmSources = config.api.sources.filter(self.hasCDM);
									var results = [];
									for (var s = 0; s < cdmSources.length; s++) {
										var source = cdmSources[s];
										self.sourceAnalysesStatus[source.sourceKey] = ko.observable({
											ready: false,
											checking: false
										});
										var sourceInfo = self.getSourceInfo(source);
										var cdsi = {};
										cdsi.name = cdmSources[s].sourceName;
										cdsi.sourceKey = cdmSources[s].sourceKey;
										if (sourceInfo != null) {
											cdsi.isValid = ko.observable(sourceInfo.isValid);
											cdsi.sourceId = sourceInfo.id.sourceId;
											cdsi.status = ko.observable(sourceInfo.status);
											var date = new Date(sourceInfo.startTime);
											cdsi.startTime = ko.observable(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
											cdsi.executionDuration = ko.observable((sourceInfo.executionDuration / 1000) + 's');
											// For backwards compatability, query personCount from cdm if not populated in sourceInfo
											if (sourceInfo.personCount == null)
											{
												cdsi.personCount = ko.observable('...');
												self.getCohortCount(source, cdsi.personCount);
											} else {
												cdsi.personCount = ko.observable(sourceInfo.personCount);
											}
											cdsi.recordCount = ko.observable(sourceInfo.recordCount);
											cdsi.includeFeatures = ko.observable(sourceInfo.includeFeatures);
											cdsi.failMessage = ko.observable(sourceInfo.failMessage);
										} else {
											cdsi.isValid = ko.observable(false);
											cdsi.status = ko.observable('n/a');
											cdsi.startTime = ko.observable('n/a');
											cdsi.executionDuration = ko.observable('n/a');
											cdsi.personCount = ko.observable('n/a');
											cdsi.recordCount = ko.observable('n/a');
											cdsi.includeFeatures = ko.observable(false);
											cdsi.failMessage = ko.observable(null);
										}
										results.push(cdsi);
									}
									self.cohortDefinitionSourceInfo(results);
									// load universe of analyses
									self.cohortAnalyses(self.visualizationPacks()
										.filter(function (n) {
											return n.reportKey != undefined
										}));
									var index = {};
									for (var a = 0; a < self.visualizationPacks()
										.length; a++) {
										self.analysisLookup[a] = self.visualizationPacks()[a].name;
									}
									// obtain completed result status for each source
									for (var s = 0; s < cdmSources.length; s++) {
										var source = cdmSources[s];
										var info = self.getSourceInfo(source);
										if (info) {
											var sourceAnalysesStatus = {};
											sourceAnalysesStatus.checking = true;
											self.sourceAnalysesStatus[source.sourceKey](sourceAnalysesStatus);
											self.getCompletedAnalyses(source);
										}
									}
									// This is the original approach but it does not reflect some of the interdependencies between analyses
									// so commenting it out for now. We should revisit this as hardcoding the object above is not sustainable
									/*
									var analysesPromise = $.ajax({
									    url: config.api.url + 'cohortanalysis/',
									    method: 'GET',
									    contentType: 'application/json',
									    success: function (analyses) {
									        var index = {};
									        var nestedAnalyses = [];

									        for (var a = 0; a < analyses.length; a++) {
									            var analysis = analyses[a];

									            if (index[analysis.analysisType] == undefined) {
									                var analysisType = {
									                    name: analysis.analysisType,
									                    analyses: []
									                };
									                nestedAnalyses.push(analysisType);
									                index[analysis.analysisType] = nestedAnalyses.indexOf(analysisType);
									            }
									            self.analysisLookup[analysis.analysisId] = analysis.analysisType;
									            nestedAnalyses[index[analysis.analysisType]].analyses.push(analysis);
									        }

									        self.cohortAnalyses(nestedAnalyses);

									        // obtain completed result status for each source
									        for (var s = 0; s < cdmSources.length; s++) {
									            var source = cdmSources[s];
									            var info = self.getSourceInfo(source);
									            if (info) {
									                var sourceAnalysesStatus = {};
									                sourceAnalysesStatus.checking = true;
									                self.sourceAnalysesStatus[source.sourceKey](sourceAnalysesStatus);
									                self.getCompletedAnalyses(source);
									            }
									        }
									    }
									});
									*/
									if (conceptSetId != null) {
										self.loadConceptSet(conceptSetId, viewToShow, 'cohort', mode);
									} else {
										self.currentView(viewToShow);
									}
								});
						})
						.fail(function (xhr) {
							if (xhr.status == 403 || xhr.status == 401) {
								self.currentView(viewToShow);
							}
						});
				});
			}
			self.loadConceptSet = function (conceptSetId, viewToShow, loadingSource, mode) {
				// If we're attempting to load the concept set that is already loaded, exit
				if (self.currentConceptSetSource() == loadingSource && self.currentConceptSet() && self.currentConceptSet()
					.id == conceptSetId) {
					self.currentView(viewToShow);
					self.currentConceptSetMode(mode);
					return;
				}
				// If we're attempting to load a repository concept set, unload any cohort defintions
				// that may be active
				if (self.currentCohortDefinition() && loadingSource == "repository") {
					if (self.currentCohortDefinitionDirtyFlag() && self.currentCohortDefinitionDirtyFlag()
						.isDirty() && !confirm("Cohort changes are not saved. Would you like to continue?")) {
						window.location.href = "#/conceptsets";
						return;
					} else {
						self.clearConceptSet();
						self.cohortDefinitionSourceInfo(null);
						self.currentCohortDefinition(null);
					}
				} else if (self.currentConceptSetSource() == "repository" && self.currentConceptSet() && loadingSource == "repository" && self.currentConceptSetDirtyFlag.isDirty() && !confirm("Concept set changes are not saved. Would you like to continue?")) {
					// If we're attempting to load a new repository concept set and
					// we have a repository concept set loaded with unsaved changes
					// then prompt the user to save their work before moving forward
					window.location.href = "#/conceptsets";
					return;
				} else {
					// Clear any existing concept set
					self.clearConceptSet();
				}
				// Set the current conceptset source property to indicate if a concept set
				// was loaded from the repository or the cohort definition
				self.currentConceptSetSource(loadingSource);
				if (loadingSource == "repository") {
					self.loadRepositoryConceptSet(conceptSetId, viewToShow, mode);
				} else if (loadingSource == "cohort") {
					self.loadCohortConceptSet(conceptSetId, viewToShow, mode);
				}
			};
			self.loadRepositoryConceptSet = function (conceptSetId, viewToShow, mode) {
				$('body')
					.removeClass('modal-open');
				self.componentParams = {
					model: self
				};
				if (conceptSetId == 0 && !self.currentConceptSet()) {
					// Create a new concept set
					self.currentConceptSet({
						name: ko.observable('New Concept Set'),
						id: 0
					});
				}
				// don't load if it is already loaded or a new concept set
				if (self.currentConceptSet() && self.currentConceptSet()
					.id == conceptSetId) {
					self.currentConceptSetMode(mode);
					self.currentView(viewToShow);
					return;
				}
				self.currentView('loading');
				$.ajax({
					url: config.api.url + 'conceptset/' + conceptSetId,
					method: 'GET',
					contentType: 'application/json',
					success: function (conceptset) {
						$.ajax({
							url: config.api.url + 'conceptset/' + conceptSetId + '/expression',
							method: 'GET',
							contentType: 'application/json',
							success: function (expression) {
								self.setConceptSet(conceptset, expression.items);
								self.currentView(viewToShow);
								var resolvingPromise = self.resolveConceptSetExpression();
								$.when(resolvingPromise)
									.done(function () {
										self.currentConceptSetMode(mode);
										$('#conceptSetLoadDialog')
											.modal('hide');
									});
							}
						});
					}
				});
			}

			self.loadCohortConceptSet = function (conceptSetId, viewToShow, mode) {
				// Load up the selected concept set from the cohort definition
				var conceptSet = self.currentCohortDefinition()
					.expression()
					.ConceptSets()
					.filter(function (item) {
						return item.id == conceptSetId
					})[0];
				// If the cohort concept set is lacking the STANDARD_CONCEPT property, we must
				// resolve it with the vocabulary web service to ensure we have all of the appropriate
				// properties
				var conceptPromise;
				if (conceptSet.expression.items() && conceptSet.expression.items()
					.length > 0 && !conceptSet.expression.items()[0].concept.STANDARD_CONCEPT) {
					var identifiers = $.makeArray($(conceptSet.expression.items())
						.map(function () {
							return this.concept.CONCEPT_ID;
						}));
					conceptPromise = $.ajax({
						url: sharedState.vocabularyUrl() + 'lookup/identifiers',
						method: 'POST',
						contentType: 'application/json',
						data: JSON.stringify(identifiers),
						success: function (data) {
							for (var i = 0; i < data.length; i++) {
								conceptSet.expression.items()[i].concept = data[i];
							}
							conceptSet.expression.items.valueHasMutated();
						}
					});
				} else {
					conceptPromise = $.Deferred();
					conceptPromise.resolve();
				}
				$.when(conceptPromise)
					.done(function (cp) {
						// Reconstruct the expression items
						for (var i = 0; i < conceptSet.expression.items()
							.length; i++) {
							sharedState.selectedConceptsIndex[conceptSet.expression.items()[i].concept.CONCEPT_ID] = 1;
						}
						sharedState.selectedConcepts(conceptSet.expression.items());
						self.currentConceptSet({
							name: conceptSet.name,
							id: conceptSet.id
						});
						self.currentView(viewToShow);
						var resolvingPromise = self.resolveConceptSetExpression();
						$.when(resolvingPromise)
							.done(function () {
								self.currentConceptSetMode(mode);
								$('#conceptSetLoadDialog')
									.modal('hide');
							});
					});
			}

			self.reportCohortDefinitionId = ko.observable();
			self.reportReportName = ko.observable();
			self.reportSourceKey = ko.observable();
			self.reportValid = ko.computed(function () {
				return (self.reportReportName() != undefined && self.reportSourceKey() != undefined && self.reportCohortDefinitionId() != undefined && !self.loadingReport() && !self.loadingReportDrilldown());
			}, this);
			self.reportTriggerRun = ko.observable(false);
			self.jobs = ko.observableArray();
			self.sourceAnalysesStatus = {};
			self.analysisLookup = {};
			self.cohortDefinitionSourceInfo = ko.observableArray();
			self.recentSearch = ko.observableArray(null);
			self.recentConcept = ko.observableArray(null);
			self.currentView = ko.observable('loading');
			self.conceptSetInclusionIdentifiers = ko.observableArray();
			self.currentConceptSetExpressionJson = ko.observable();
			self.currentConceptIdentifierList = ko.observable();
			self.currentPatientLevelPredictionId = ko.observable();
			self.currentPatientLevelPrediction = ko.observable();
			self.currentPatientLevelPredictionDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(self.currentPatientLevelPrediction()));
			self.plpCss = ko.pureComputed(function () {
				if (self.currentPatientLevelPrediction())
					return self.currentPatientLevelPredictionDirtyFlag().isDirty() ? "unsaved" : "open";
			});
			self.plpURL = ko.pureComputed(function () {
				var url = "#/plp";
				if (self.currentPatientLevelPrediction())
					url = url + "/" + (self.currentPatientLevelPrediction().analysisId || 0);
				return url;
			});

			self.currentConceptSet = ko.observable();
			self.currentConceptSetDirtyFlag = new ohdsiUtil.dirtyFlag({
				header: self.currentConceptSet,
				details: sharedState.selectedConcepts
			});
			self.conceptSetCss = ko.pureComputed(function () {
				if (self.currentConceptSet())
					return self.currentConceptSetDirtyFlag.isDirty() ? "unsaved" : "open";
			});
			self.conceptSetURL = ko.pureComputed(function () {
				var url = "#/";
				if (self.currentConceptSet())
					url = url + "conceptset/" + (self.currentConceptSet()
						.id || '0') + '/details';
				else
					url = url + "conceptsets";
				return url;
			});

			self.canEditCurrentConceptSet = ko.pureComputed(function () {
				if (self.currentConceptSetSource() == 'cohort') {
					return self.canEditCurrentCohortDefinition();
				} else if (self.currentConceptSetSource() == 'repository') {
					if (!authApi.isAuthenticated()) {
						return false;
					}

					if (self.currentConceptSet() && (self.currentConceptSet()
							.id != 0)) {
						return authApi.isPermittedUpdateConceptset(self.currentConceptSet()
							.id) || !config.userAuthenticationEnabled;
					} else {
						return authApi.isPermittedCreateConceptset() || !config.userAuthenticationEnabled;
					}
				} else {
					return false;
				}
			});
			self.currentConceptSetSource = ko.observable('repository');
			self.currentConceptSetNegativeControls = ko.observable();
			self.currentIncludedConceptIdentifierList = ko.observable();
			self.searchResultsConcepts = ko.observableArray();
			self.relatedConcepts = ko.observableArray();
			self.relatedSourcecodes = ko.observableArray();
			self.importedConcepts = ko.observableArray();
			self.includedConcepts = ko.observableArray();
			self.denseSiblings = ko.observableArray();
			self.includedSourcecodes = ko.observableArray();
			self.cohortDefinitions = ko.observableArray();

			self.currentCohortDefinition = ko.observable();
			self.cohortDefCss = ko.pureComputed(function () {
				if (self.currentCohortDefinition())
					return self.currentCohortDefinitionDirtyFlag()
						.isDirty() ? "unsaved" : "open";
			});
			self.cohortDefURL = ko.pureComputed(function () {
				var url = "#/";
				if (self.currentCohortDefinition())
					url = url + "cohortdefinition/" + (self.currentCohortDefinition()
						.id() || '0');
				else
					url = url + "cohortdefinitions"
				return url;
			});

			self.canEditCurrentCohortDefinition = ko.pureComputed(function () {
				if (!authApi.isAuthenticated()) {
					return false;
				}

				if (self.currentCohortDefinition() && (self.currentCohortDefinition()
						.id() != 0)) {
					return authApi.isPermittedUpdateCohort(self.currentCohortDefinition()
						.id()) || !config.userAuthenticationEnabled;
				} else {
					return authApi.isPermittedCreateCohort() || !config.userAuthenticationEnabled;
				}
			});
			self.currentCohortComparisonId = ko.observable();
			self.currentCohortComparison = ko.observable();
			self.currentCohortComparisonDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(self.currentCohortComparison()));
			self.ccaCss = ko.pureComputed(function () {
				if (self.currentCohortComparison())
					return self.currentCohortComparisonDirtyFlag()
						.isDirty() ? "unsaved" : "open";
			});
			self.ccaURL = ko.pureComputed(function () {
				var url = "#/estimation";
				if (self.currentCohortComparison())
					url = url + "/" + (self.currentCohortComparison()
						.analysisId || 0);
				return url;
			});


			self.currentCohortDefinitionInfo = ko.observable();
			self.currentCohortDefinitionDirtyFlag = ko.observable(self.currentCohortDefinition() && new ohdsiUtil.dirtyFlag(self.currentCohortDefinition()));
			self.feasibilityId = ko.observable();

			self.selectedIRAnalysisId = ko.observable();
			self.currentIRAnalysis = ko.observable();
			self.currentIRAnalysisDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(self.currentIRAnalysis()));

			self.resolvingConceptSetExpression = ko.observable();
			self.resolvingSourcecodes = ko.observable();
			self.evidence = ko.observableArray();
			self.initializationErrors = 0;

			self.currentConcept = ko.observable();
			self.currentConceptId = ko.observable();
			self.currentConceptMode = ko.observable('details');
			self.currentIRAnalysisId = ko.observable();

			self.irStatusCss = ko.pureComputed(function () {
				if (self.currentIRAnalysis())
					return self.currentIRAnalysisDirtyFlag()
						.isDirty() ? "unsaved" : "open";
			});
			self.irAnalysisURL = ko.pureComputed(function () {
				var url = "#/iranalysis";
				if (self.currentIRAnalysis())
					url = url + "/" + (self.currentIRAnalysis()
						.id() || 'new');
				return url;
			});

			self.irStatusCss = ko.pureComputed(function () {
				if (self.currentIRAnalysis())
					return self.currentIRAnalysisDirtyFlag()
						.isDirty() ? "unsaved" : "open";
			});
			self.renderCurrentConceptSelector = function () {
				var css = '';
				if (sharedState.selectedConceptsIndex[self.currentConcept()
						.CONCEPT_ID] == 1) {
					css = ' selected';
				}
				return '<i class="fa fa-shopping-cart' + css + '"></i>';
			};
			self.renderConceptSelector = function (s, p, d) {
				var css = '';
				var icon = 'fa-shopping-cart';
				if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
					css = ' selected';
				}
				return '<i class="fa ' + icon + ' ' + css + '"></i>';
			}
			self.currentConceptSetMode = ko.observable('details');
			self.currentCohortDefinitionMode = ko.observable('definition');
			self.currentImportMode = ko.observable('identifiers');
			self.feRelated = ko.observable();
			self.metarchy = {};

			self.clearConceptSet = function () {
				self.currentConceptSet(null);
				sharedState.clearSelectedConcepts();
				self.resolveConceptSetExpression();
				self.currentConceptSetDirtyFlag.reset();
			}
			self.renderHierarchyLink = function (d) {
				var valid = d.INVALID_REASON_CAPTION == 'Invalid' || d.STANDARD_CONCEPT != 'S' ? 'invalid' : '';
				return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
			};

			self.createConceptSetItem = function (concept) {
				var conceptSetItem = {};
				conceptSetItem.concept = concept;
				conceptSetItem.isExcluded = ko.observable(false);
				conceptSetItem.includeDescendants = ko.observable(false);
				conceptSetItem.includeMapped = ko.observable(false);
				return conceptSetItem;
			};
			self.conceptSetInclusionCount = ko.observable(0);
			self.sourcecodeInclusionCount = ko.observable(0);
			self.syntaxHighlight = function (json) {
				if (typeof json != 'string') {
					json = JSON.stringify(json, undefined, 2);
				}
				json = json.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
				return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
					var cls = 'number';
					if (/^"/.test(match)) {
						if (/:$/.test(match)) {
							cls = 'key';
						} else {
							cls = 'string';
						}
					} else if (/true|false/.test(match)) {
						cls = 'boolean';
					} else if (/null/.test(match)) {
						cls = 'null';
					}
					return '<span class="' + cls + '">' + match + '</span>';
				});
			};
			self.currentConceptSetSubscription = self.currentConceptSet.subscribe(function (newValue) {
				if (newValue != null) {
					self.currentConceptSetDirtyFlag = new ohdsiUtil.dirtyFlag({
						header: self.currentConceptSet,
						details: sharedState.selectedConcepts
					});
				}
			});
			self.currentCohortDefinitionSubscription = self.currentCohortDefinition.subscribe(function (newValue) {
				if (newValue != null) {
					self.currentCohortDefinitionDirtyFlag(new ohdsiUtil.dirtyFlag(self.currentCohortDefinition()));
				}
			});
			self.hasUnsavedChanges = ko.pureComputed(function () {
				return ((pageModel.currentCohortDefinitionDirtyFlag() && pageModel.currentCohortDefinitionDirtyFlag()
						.isDirty()) ||
					(pageModel.currentConceptSetDirtyFlag && pageModel.currentConceptSetDirtyFlag.isDirty()) ||
					pageModel.currentIRAnalysisDirtyFlag()
					.isDirty() ||
					pageModel.currentCohortComparisonDirtyFlag()
					.isDirty());
			});

			self.currentRoleId = ko.observable();
			self.roles = ko.observableArray();
			self.updateRoles = function () {
				var promise = $.Deferred();
				if (self.roles() && self.roles()
					.length > 0) {
					promise.resolve();
				} else {
					$.ajax({
						url: config.api.url + 'role',
						method: 'GET',
						headers: {
							Authorization: authApi.getAuthorizationHeader()
						},
						contentType: 'application/json',
						error: authApi.handleAccessDenied,
						success: function (data) {
							self.roles(data);
							promise.resolve();
						}
					});
				}
				return promise;
			}
			self.users = ko.observableArray();
			self.permissions = ko.observableArray();
		}
		return appModel;
	});
