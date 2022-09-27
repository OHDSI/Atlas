define(['knockout',
	'text!./negative-controls.html',
	'components/Component',
	'appConfig',
	'../options',
	'components/evidence/utils',
	'services/EvidenceAPI',
	'services/CDMResultsAPI',
	'services/ConceptSet',
	'atlas-state',
	'services/JobDetailsService',
	'services/MomentAPI',
	'services/AuthAPI',
	'components/conceptset/InputTypes/ConceptSet',
	'assets/ohdsi.util',
	'databindings',
	'evidence',
	'conceptset-modal',
], function (
	ko,
	view,
	Component,
	config,
	options,
	utils,
	evidenceAPI,
	cdmResultsAPI,
	conceptSetService,
	sharedState,
	jobDetailsService,
	momentApi,
	authApi,
	ConceptSet
) {
	class NegativeControls extends Component {
		constructor(params) {
			super(params);

			var pollTimeout = null;
			this.selectedConcepts = params.selectedConcepts;
			this.conceptSet = params.conceptSet;
			this.conceptIds = params.conceptIds;
			this.defaultResultsUrl = params.defaultResultsUrl;
			this.negativeControls = params.negativeControls;
			this.dirtyFlag = params.dirtyFlag;
			this.saveConceptSet = params.saveConceptSet;
			this.conceptSetValid = ko.observable(false);
			this.conceptSetValidText = ko.observable("");
			this.conceptDomainId = ko.observable(null);
			this.targetDomainId = ko.observable(null);
			this.currentEvidenceService = ko.observable();
			this.currentResultSource = ko.observable();
			this.loadingResults = ko.observable(false);
			this.evidenceSources = ko.observableArray();
			this.loadingEvidenceSources = ko.observable(false);
			this.drugLabelExists = ko.observableArray();
			this.drugLabelDetailsDisplay = ko.observable(false);
			this.loadingDrugLabelExists = ko.observable(false);
			this.selectedReportCaption = ko.observable();
			this.recordCountsRefreshing = ko.observable(false);
			this.showEvidencePairs = ko.observable(false);
			this.showNegControlsSaveNewModal = ko.observable(false);
			this.linkoutDrugConceptIds = [];
			this.linkoutConditionConceptIds = [];
			this.sourceIds = config.cemOptions.evidenceLinkoutSources;
			this.recordCountClass = ko.pureComputed(() => {
				return this.recordCountsRefreshing() ? "fa fa-circle-notch fa-spin fa-lg" : "fa fa-database fa-lg";
			});
			this.newConceptSetName = ko.observable(this.conceptSet()
				.name() + " - Candidate Controls");
			this.csTarget = ko.observable();
			this.csTargetCaption = ko.observable();

			this.rowClick = (s, p, d) => {
				if (utils.hasEvidence(s)) {
					this.linkoutDrugConceptIds = [];
					this.linkoutConditionConceptIds = [];
					if (this.targetDomainId() == "Drug") {
						this.linkoutDrugConceptIds.push(s.conceptId);
						this.linkoutConditionConceptIds = this.conceptIds();
					} else {
						this.linkoutDrugConceptIds = this.conceptIds();
						this.linkoutConditionConceptIds.push(s.conceptId);
					}
					this.showEvidencePairs(true);
				}
			}

			this.negControlColumns = options.negControlTableColumns;

			this.negControlOptions = options.negControlTableOptions;

			this.selectedConceptsSubscription = this.selectedConcepts.subscribe(newValue => {
				if (newValue != null) {
					this.evaluateConceptSet();
				}
			});

			this.isRunning = ko.pureComputed(() => {
				return this.evidenceSources()
					.filter(function (info) {
						return !(info.status() == "COMPLETE" || info.status() == "n/a");
					})
					.length > 0;
			});

			this.getSourceInfo = (sourceKey) => {
				return this.evidenceSources()
					.filter(function (d) {
						return d.sourceKey() == sourceKey
					})[0];
			}

			this.canGenerate = ko.pureComputed(() => {
				var isDirty = this.dirtyFlag() && this.dirtyFlag()
					.isDirty();
				var isNew = this.conceptSet() && (this.conceptSet()
					.id == 0);
				var canGenerate = !(isDirty || isNew);
				return (canGenerate);
			});

			this.pollForInfo = () => {
				if (pollTimeout)
					clearTimeout(pollTimeout);

				var id = this.conceptSet().id;
				conceptSetService.getGenerationInfo(id)
					.then((infoList) => {
						var hasPending = false;

						infoList.forEach(info => {
							// obtain source reference
							var source = this.evidenceSources()
								.filter(function (s) {
									return s.sourceId() == info.sourceId
								})[0];

							if (source) {
								// only bother updating those sources that we know are running
								if (this.isSourceRunning(source)) {
									source.status(info.status);
									source.isValid(info.isValid);
									var date = new Date(info.startTime);
									source.startTime(momentApi.formatDateTime(date));
									source.executionDuration('...');

									if (info.status != "COMPLETE") {
										hasPending = true;
									} else {
										source.executionDuration((info.executionDuration / 1000) + 's');
									}
								}
							}
						});

						if (hasPending) {
							pollTimeout = setTimeout(() => {
								this.pollForInfo();
							}, 5000);
						}
					});
			}

			this.generate = (service, event) => {
				// Check to make sure the concept set is valid before calling the service
				if (!this.conceptSetValid()) {
					alert(ko.unwrap(ko.i18n('components.evidencePairViewer.evidencePairViewerText_6', 'The concept set is not marked as valid to generate results. Please make sure this concept set contains only CONDITIONS or DRUGS.')));
					return;
				}

				// Call the ajax service to generate the results
				var negativeControlsJob = evidenceAPI.generateNegativeControls(service.sourceKey(), this.conceptSet()
					.id, this.conceptSet()
					.name(), this.conceptDomainId(), this.targetDomainId(), this.conceptIds(), service.csToInclude(), service.csToExclude());

				// Mark as pending results
				this.getSourceInfo(service.sourceKey()).status('PENDING');
				this.negativeControls(null);
				this.loadingResults(false);

				// Kick the job off
				$.when(negativeControlsJob)
					.done(info => {
						jobDetailsService.createJob(info);
						pollTimeout = setTimeout(() => {
							this.pollForInfo();
						}, 5000);
					})
					.fail(info => {
						authApi.handleAccessDenied;
						console.error("Job failed: " + JSON.stringify(info));
					});
			}

			this.isGenerating = () => {
				return false;
			}

			this.evaluateConceptSet = () => {
				// Determine if all of the concepts in the current concept set
				// are all of the same type (CONDITION or DRUG) and if so, this
				// concept set is valid and can be evaluated for negative controls
				var conceptSetValid = false;
				var conceptDomainId = null;
				var targetDomainId = null;
				var conceptSetLength = this.selectedConcepts()
					.length;
				var conditionLength = this.selectedConcepts()
					.filter(function (elem) {
						return elem.concept.DOMAIN_ID == "Condition";
					})
					.length;
				var drugLength = this.selectedConcepts()
					.filter(function (elem) {
						return elem.concept.DOMAIN_ID == "Drug";
					})
					.length;

				if (conceptSetLength > 0) {
					if (conditionLength == conceptSetLength) {
						conceptSetValid = true;
						conceptDomainId = "Condition";
						targetDomainId = "Drug";
					} else if (drugLength == conceptSetLength) {
						conceptSetValid = true;
						conceptDomainId = "Drug";
						targetDomainId = "Condition";
					} else {
						this.conceptSetValidText = ko.i18n('cs.manager.exploreEvidence.invalidCsWarning', 'Your saved concepts come from multiple domains or from a domain outside of conditions or drugs. The concept set must contain ONLY conditions OR drugs in order to explore evidence.');
					}
				} else {
					this.conceptSetValidText = ko.i18n('cs.manager.exploreEvidence.noCsWarning', 'You must define a concept set with drugs found in the RxNorm vocabulary at the Ingredient class level OR Conditions from SNOMED. The concept set must contain ONLY conditions OR drugs in order to explore evidence.');
				}
				this.conceptSetValid(conceptSetValid);
				this.conceptDomainId(conceptDomainId);
				this.targetDomainId(targetDomainId);
			}

			this.getEvidenceSourcesFromConfig = () => {
				var evidenceSources = [];

				$.each(sharedState.sources(), function (i, source) {
					if (source.hasEvidence && source.hasCEMResults) {
						var sourceInfo = {};
						sourceInfo.sourceId = ko.observable(source.sourceId);
						sourceInfo.sourceKey = ko.observable(source.sourceKey);
						sourceInfo.sourceName = ko.observable(source.sourceName);
						sourceInfo.startTime = ko.observable("n/a");
						sourceInfo.executionDuration = ko.observable("n/a");
						sourceInfo.status = ko.observable("n/a");
						sourceInfo.isValid = ko.observable(false);
						sourceInfo.csToIncludeCaption = ko.observable(null);
						sourceInfo.csToIncludeLoading = ko.observable(true);
						sourceInfo.csToExcludeCaption = ko.observable(null);
						sourceInfo.csToExcludeLoading = ko.observable(true);

						evidenceSources.push(sourceInfo);
					}
				});

				return evidenceSources;
			}

			this.getEvidenceSources = () => {
				this.loadingEvidenceSources(true);
				conceptSetService.getGenerationInfo(this.conceptSet().id)
					.then((generationInfo) => {
						var evidenceSources = this.getEvidenceSourcesFromConfig();
						evidenceSources.forEach((evidenceSource, i) => {
							var gi = $.grep(generationInfo, function (a) {
								return a.sourceId == evidenceSource.sourceId();
							});
							if (gi.length > 0) {
								var date = new Date(gi[0].startTime);
								var execDuration = (gi[0].executionDuration / 1000) + 's'
								evidenceSources[i].startTime(momentApi.formatDateTime(date));
								evidenceSources[i].executionDuration(execDuration);
								evidenceSources[i].status(gi[0].status);
								evidenceSources[i].isValid(gi[0].isValid);
								var giParams = JSON.parse(gi[0].params);
								evidenceSources[i].csToInclude = ko.observable(giParams.csToInclude != null ? giParams.csToInclude : 0);
								evidenceSources[i].csToExclude = ko.observable(giParams.csToExclude != null ? giParams.csToExclude : 0);

								if (evidenceSources[i].csToInclude()) {
									conceptSetService.getConceptSet(evidenceSources[i].csToInclude()).then((csInfo) => {
										evidenceSources[i].csToIncludeCaption(csInfo.data.name);
										evidenceSources[i].csToIncludeLoading(false);
									});
								} else {
									evidenceSources[i].csToIncludeLoading(false);
								}
								if (evidenceSources[i].csToExclude()) {
									conceptSetService.getConceptSet(evidenceSources[i].csToExclude()).then((csInfo) => {
										evidenceSources[i].csToExcludeCaption(csInfo.data.name);
										evidenceSources[i].csToExcludeLoading(false);
									});
								} else {
									evidenceSources[i].csToExcludeLoading(false);
								}

								if (gi[0].status == "RUNNING") {
									this.pollForInfo();
								}
							} else {
								evidenceSources[i].csToInclude = ko.observable(0);
								evidenceSources[i].csToIncludeCaption = ko.observable(null);
								evidenceSources[i].csToExclude = ko.observable(0);
								evidenceSources[i].csToExcludeCaption = ko.observable(null);
							}
						});
						this.evidenceSources(evidenceSources);
						this.loadingEvidenceSources(false);
					});
			};

			this.resultSources = ko.computed(() => {
				var resultSources = [];
				sharedState.sources().forEach(source => {
					if (source.hasResults) {
						resultSources.push(source);
						if (source.resultsUrl == sharedState.resultsUrl()) {
							this.currentResultSource(source);
						}
					}
				});
				return resultSources;
			});

			this.refreshRecordCounts = (obj, event) => {
				if (event.originalEvent) {
					// User changed event
					this.recordCountsRefreshing(true);
					$("#dtNegCtrlRC")
						.toggleClass("fa-database")
						.toggleClass("fa-circle-notch")
						.toggleClass("fa-spin");
					$("#dtNegCtrlDRC")
						.toggleClass("fa-database")
						.toggleClass("fa-circle-notch")
						.toggleClass("fa-spin");
					$(".ncRecordCount").each(function(index) { $(this).text("...") });
					var negativeControls = this.negativeControls();
					var conceptIdsForNegativeControls = $.map(negativeControls, function (o, n) {
						return o.conceptId;
					});
					cdmResultsAPI.getConceptRecordCount(this.currentResultSource()
							.sourceKey, conceptIdsForNegativeControls, negativeControls)
						.then((rowcounts) => {
							this.negativeControls(negativeControls);
							this.recordCountsRefreshing(false);
						});
				}
			}

			this.loadResults = service => {
				this.loadingResults(true);
				this.currentEvidenceService(service);
				this.selectedReportCaption(service.name);
				evidenceAPI.getNegativeControls(service.sourceKey(), this.conceptSet()
						.id)
					.then(results => {
						console.log("Get negative controls");
						var conceptIdsForNegativeControls = $.map(results, function (o, n) {
							return o.conceptId;
						});
						cdmResultsAPI.getConceptRecordCount(this.currentResultSource()
								.sourceKey, conceptIdsForNegativeControls, results)
							.then(rowcounts => {
								this.negativeControls(results);
								// Get the drug label information
								var conceptIdsForLabels = null;
								if (this.targetDomainId() == "Drug") {
									// Take the list of drugs from the results
									conceptIdsForLabels = conceptIdsForNegativeControls;
								} else {
									// Take the list of drugs from the concept set
									conceptIdsForLabels = this.conceptIds();
								}
								evidenceAPI.getDrugLabelExists(service.sourceKey(), conceptIdsForLabels).then(results => {
									var negativeControls = this.addDrugLabelToResults(results, this.negativeControls(), this.targetDomainId());
									this.negativeControls(negativeControls);
									this.drugLabelExists(results);
									this.loadingResults(false);
								});
							});
					});
			}

			this.addDrugLabelToResults = (drugLabelExists, negativeControls, targetDomainId) => {
				var drugLabelExistsIndex = {};
				for (var i = 0; i < negativeControls.length; i++) {
					negativeControls[i].drugLabelExists = 'N/A';
				}

				if (targetDomainId == "Drug") {
					for (var e = 0; e < drugLabelExists.length; e++) {
						drugLabelExistsIndex[Object.values(drugLabelExists[e])[0]] = Object.values(drugLabelExists[e])[2];
					}

					for (var c = 0; c < negativeControls.length; c++) {
						var concept = negativeControls[c];
						if (drugLabelExistsIndex[concept.conceptId] != undefined) {
							concept.drugLabelExists = drugLabelExistsIndex[concept.conceptId];
						}
					}
				}

				return negativeControls;
			}

			this.getDrugLabelExistsByBoolean = (filter) => {
				return this.drugLabelExists()
					.filter(function (elem) {
						return elem.usaProductLabelExists == filter;
					})
					.sort(function (left, right) {
						return left.conceptName.toLowerCase() == right.conceptName.toLowerCase() ? 0 : (left.conceptName.toLowerCase() < right.conceptName.toLowerCase() ? -1 : 1)
					});
			}

			this.drugLabelExistsIsTrue = ko.pureComputed(() => {
				return this.getDrugLabelExistsByBoolean("1");
			});

			this.drugLabelExistsIsFalse = ko.pureComputed(() => {
				return this.getDrugLabelExistsByBoolean("0");
			});

			this.drugLabelExistsPercentage = ko.pureComputed(() => {
				if (this.drugLabelExists().length > 0) {
					var pct = (this.drugLabelExistsIsTrue().length / this.drugLabelExists().length) * 100;
					return parseFloat(pct).toFixed(0);
				} else {
					return "0"
				}
			});

			this.toggleLabelDetails = () => {
				var newDisplay = !this.drugLabelDetailsDisplay();
				this.drugLabelDetailsDisplay(newDisplay);
			}

			this.toggleLabelDisplay = ko.pureComputed(() => {
				var displayVal = this.drugLabelDetailsDisplay() ? 'hide' : 'show';
				return displayVal;
			})

			this.isSourceRunning = (source) => {
				if (source) {
					switch (source.status()) {
					case 'COMPLETE':
						return false;
						break;
					case 'ERROR':
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

			this.saveNewConceptSet = () => {
				var dtItems = $('#negControlResults table')
					.DataTable()
					.data();
				var selectedConcepts = [];
				_.each(dtItems, (item) => {
					var concept;
					concept = {
						CONCEPT_CLASS_ID: item.conceptClassId,
						CONCEPT_CODE: item.conceptCode,
						CONCEPT_ID: item.conceptId,
						CONCEPT_NAME: item.conceptName,
						DOMAIN_ID: item.domainId,
						INVALID_REASON: null,
						INVALID_REASON_CAPTION: null,
						STANDARD_CONCEPT: null,
						STANDARD_CONCEPT_CAPTION: null,
						VOCABULARY_ID: null,
					}
					var newItem;
					newItem = {
						concept: concept,
						isExcluded: ko.observable(false),
						includeDescendants: ko.observable(false),
						includeMapped: ko.observable(false),
					}
					selectedConcepts.push(newItem);
				});
				const conceptSet = new ConceptSet({
					id: 0,
					name: this.newConceptSetName(),
					expression: {
						items: selectedConcepts
					}
				});
				this.saveConceptSet(conceptSet, "#txtNewConceptSetName");
				this.showNegControlsSaveNewModal(false);
			}

			this.chooseIncludeConceptSet = (source) => {
				$('#ncModalConceptSetSelect').modal('show');
				this.csTarget = source.csToInclude;
				this.csTargetCaption = source.csToIncludeCaption;
			}

			this.clearIncludeConceptSet = (source) => {
				source.csToInclude(0);
				source.csToIncludeCaption(null);
			}

			this.chooseExcludeConceptSet = (source) => {
				$('#ncModalConceptSetSelect').modal('show');
				this.csTarget = source.csToExclude;
				this.csTargetCaption = source.csToExcludeCaption;
			}

			this.clearExcludeConceptSet = (source) => {
				source.csToExclude(0);
				source.csToExcludeCaption(null);
			}

			this.conceptsetSelected = (d) => {
				$('#ncModalConceptSetSelect').modal('hide');
				conceptSetService.getConceptSet(d.id).then((csInfo) => {
					this.csTarget(csInfo.data.id);
					this.csTargetCaption(csInfo.data.name);
				});
			}

			this.disableNewConceptSetButton = () => {
				return true;
			}

			// Evalute the concept set when this component is loaded
			this.evaluateConceptSet();

			// Get the evidence sources
			this.getEvidenceSources();
		}
	}

	var component = {
		viewModel: NegativeControls,
		template: view
	};

	return component;
});
