define(['knockout',
	'text!./negative-controls.html',
	'providers/Component',
	'appConfig',
	'webapi/EvidenceAPI',
	'webapi/CDMResultsAPI',
	'webapi/ConceptSetAPI',
	'atlas-state',
	'job/jobDetail',
  	'webapi/MomentAPI',
	'assets/ohdsi.util',
	'databindings',
	'evidence',
], function (
	ko, 
	view,
	Component,
	config, 
	evidenceAPI, 
	cdmResultsAPI, 
	conceptSetAPI, 
	sharedState, 
	jobDetail, 
	momentApi
) {
	class NegativeControls extends Component {
		constructor(params) {
			super(params);
			
			var pollTimeout = null;
			var authApi = params.model.authApi;
			this.model = params.model;
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
			this.linkoutDrugConceptIds = [];
			this.linkoutConditionConceptIds = [];
			this.sourceIds = config.cemOptions.evidenceLinkoutSources;
			this.recordCountClass = ko.pureComputed(() => {
				return this.recordCountsRefreshing() ? "fa fa-circle-o-notch fa-spin fa-lg" : "fa fa-database fa-lg";
			});
			this.newConceptSetName = ko.observable(this.conceptSet()
				.name() + " - Candidate Controls");
			this.csTarget = ko.observable();
			this.csTargetCaption = ko.observable();

			this.hasEvidence = function(row) {
				return (
					row.descendantPmidCount > 0 ||
					row.exactPmidCount > 0 ||
					row.parentPmidCount > 0 ||
					row.ancestorPmidCount > 0 ||
					row.descendantSplicerCount > 0 ||
					row.exactSplicerCount > 0 ||
					row.parentSplicerCount > 0 ||
					row.ancestorSplicerCount > 0
				)
			}


			this.rowClick = (s, p, d) => {
				if (this.hasEvidence(s)) {
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

			this.negControlColumns = [
				{
					title: 'Id',
					data: d => d.conceptId,
					visible: false,
				},
				{
					title: '',
					data: d => {
						if (this.hasEvidence(d)) {
							return '<button type=\"button\" title=\"View Details\" class=\"btn btn-default btn-xs\"><i class=\"fa fa-external-link\" aria-hidden=\"true\"></i>&nbsp;</button>';
						}
					},
					sortable: false,
				},
				{
					title: 'Name',
					data: d => {
						var valid = true; //d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
						return '<a class=' + valid + ' href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
					},
				},
				{
					title: 'Domain',
					data: d => d.domainId,
					visible: false,
				},
				{
					title: 'Suggested Negative Control',
					data: d => {
						return d.negativeControl.toString() == "1" ? 'Y' : 'N';
					},
				},
				{
					title: 'Sort Order',
					data: d => {
						return d.sortOrder.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'Publication Count (Descendant Concept Match)',
					data: d => {
						return d.descendantPmidCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'Publication Count (Exact Concept Match)',
					render: function(s, p, d) {
						return d.exactPmidCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
					orderable: true,
					searchable: true
				},
				{
					title: 'Publication Count (Parent Concept Match)',
					data: d => {
						return d.parentPmidCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'Publication Count (Ancestor Concept Match)',
					data: d => {
						return d.ancestorPmidCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
					visible: false,
				},
				{
					title: 'Indicated / Contraindicated',
					data: d => {
						return d.indCi.toString() == "1" ? 'Y' : 'N';
					},
					visible: false,
				},
				{
					title: 'Broad Concept',
					data: d => {
						return d.tooBroad.toString() == "1" ? 'Y' : 'N';
					},
					visible: false,
				},
				{
					title: 'Drug Induced Concept',
					data: d => {
						return d.drugInduced.toString() == "1" ? 'Y' : 'N';
					},
					visible: false,
				},
				{
					title: 'Pregnancy Concept',
					data: d => {
						return d.pregnancy.toString() == "1" ? 'Y' : 'N';
					},
					visible: false,
				},
				{
					title: 'Product Label Count (Descendant Concept Match)',
					data: d => {
						return d.descendantSplicerCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'Product Label (Exact Concept Match)',
					data: d => {
						return d.exactSplicerCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'Product Label (Parent Concept Match)',
					data: d => {
						return d.parentSplicerCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'Product Label (Ancestor Concept Match)',
					data: d => {
						return d.ancestorSplicerCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
					visible: false,
				},
				{
					title: 'FAERS Count (Descendant Concept Match)',
					data: d => {
						return d.descendantFaersCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'FAERS Count (Exact Concept Match)',
					data: d => {
						return d.exactFaersCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'FAERS Count (Parent Concept Match)',
					data: d => {
						return d.parentFaersCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
				},
				{
					title: 'FAERS Count (Ancestor Concept Match)',
					data: d => {
						return d.ancestorFaersCount.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
					visible: false,
				},
				{
					title: 'User Excluded',
					data: d => {
						return d.userExcluded.toString() == "1" ? 'Y' : 'N';
					},
				},
				{
					title: 'User Included',
					data: d => {
						return d.userIncluded.toString() == "1" ? 'Y' : 'N';
					},
				},
				{
					title: 'Optimized Out',
					data: d => {
						return d.optimizedOut.toString() == "1" ? 'Y' : 'N';
					},
					visible: false,
				},
				{
					title: 'Not Prevalent',
					data: d => {
						return d.notPrevalent.toString() == "1" ? 'Y' : 'N';
					},
					visible: false,
				},
				{ 
					title: 'Drug Label Exists',
					data: d => {
						return d.drugLabelExists.toString()
					},
					visible: true,
				},
				{
					title: '<i id="dtNegCtrlRC" class="fa fa-database" aria-hidden="true"></i> RC',
					data: d => {
						return `<span class="ncRecordCount">${d.recordCount}</span>`;
					},
				},
				{
					title: '<i id="dtNegCtrlDRC" class="fa fa-database" aria-hidden="true"></i> DRC',
					data: d => {
						return `<span class="ncRecordCount">${d.descendantRecordCount}</span>`;
					},
				},
			];

			this.negControlOptions = {
				lengthMenu: [
					[10, 25, 50, 100, -1],
					['10', '25', '50', '100', 'All']
				],
				order: [
					[4, 'desc'],
					[5, 'desc']
				],
				Facets: [{
						'caption': 'Suggested Negative Control',
						'binding': d => {
							return d.negativeControl.toString() == "1" ? 'Yes' : 'No';
						},
					},
					{
						'caption': 'Found in Publications',
						'binding': d => {
							var desc = d.descenantPmidCount;
							var exact = d.exactPmidCount;
							var parent = d.parentPmidCount;
							if (exact > 0) {
								return 'Yes (Exact)'
							} else if (desc > 0) {
								return 'Yes (Descendant)'
							} else if (parent > 0) {
								return 'Yes (Parent)'
							} else {
								return 'No'
							}
						},
					},
					{
						'caption': 'Found on Product Label',
						'binding': d => {
							var desc = d.descenantSplicerCount;
							var exact = d.exactSplicerCount;
							var parent = d.parentSplicerCount;
							if (exact > 0) {
								return 'Yes (Exact)'
							} else if (desc > 0) {
								return 'Yes (Descendant)'
							} else if (parent > 0) {
								return 'Yes (Parent)'
							} else {
								return 'No'
							}
						},
					},
					{
						'caption': 'Found in Product Label Or Publications',
						'binding': d => {
							return this.hasEvidence(d) ? 'Yes' : 'No';
						},
					},
					{
						'caption': 'Signal in FAERS',
						'binding': d => {
							var desc = d.descenantFaersCount;
							var exact = d.exactFaersCount;
							var parent = d.parentFaersCount;
							if (exact > 0) {
								return 'Yes (Exact)'
							} else if (desc > 0) {
								return 'Yes (Descendant)'
							} else if (parent > 0) {
								return 'Yes (Parent)'
							} else {
								return 'No'
							}
						},
					},
					{
						'caption': 'User Specified',
						'binding': d => {
							var inc = d.userIncluded;
							var exc = d.userExcluded;
							if (inc > 0) {
								return 'Included'
							} else if (exc > 0) {
								return 'Excluded'
							} else {
								return 'None'
							}
						},
					},
				]
			};

			this.selectedConceptsSubscription = this.selectedConcepts.subscribe(function (newValue) {
				if (newValue != null) {
					this.evaluateConceptSet();
				}
			});

			this.isRunning = ko.pureComputed(function () {
				return this.evidenceSources()
					.filter(function (info) {
						return !(info.status() == "COMPLETE" || info.status() == "n/a");
					})
					.length > 0;
			});

			this.getSourceInfo = function (sourceKey) {
				return this.evidenceSources()
					.filter(function (d) {
						return d.sourceKey() == sourceKey
					})[0];
			}

			this.canGenerate = ko.pureComputed(() => {
				var isDirty = this.dirtyFlag() && this.dirtyFlag()
					.isDirty();
				var isNew = this.model.currentConceptSet() && (this.model.currentConceptSet()
					.id == 0);
				var canGenerate = !(isDirty || isNew);
				return (canGenerate);
			});

			this.pollForInfo = function () {
				if (pollTimeout)
					clearTimeout(pollTimeout);

				var id = this.conceptSet().id;
				conceptSetAPI.getGenerationInfo(id)
					.then(infoList => {
						var hasPending = false;
						console.log("poll for evidence....")

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
					alert("The concept set is not marked as valid to generate results. Please make sure this concept set contains only CONDITIONS or DRUGS.");
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

				// Create a job to monitor progress
				var job = new jobDetail({
					name: this.conceptSet().name() + "_" + service.sourceKey(),
					type: 'negative-controls',
					status: 'PENDING',
					executionId: String(this.conceptSet().id) + String(service.sourceId()),
					statusUrl: config.api.url + 'conceptset/' + this.conceptSet().id + '/generationinfo',
					statusValue: 'status',
					viewed: false,
					url: 'conceptset/' + this.conceptSet().id + '/evidence',
				});

				// Kick the job off
				$.when(negativeControlsJob)
					.done(jobInfo => {
						pollTimeout = setTimeout(() => {
							sharedState.jobListing.queue(job);
							this.pollForInfo();
						}, 5000);
					})
					.fail(info => {
						authApi.handleAccessDenied;
						console.error("Job failed: " + JSON.stringify(info));
					});
			}

			this.isGenerating = function () {
				return false;
			}

			this.evaluateConceptSet = function () {
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
						this.conceptSetValidText("Your saved concepts come from multiple Domains (Condition, Drug). The concept set must contain ONLY conditions OR drugs in order to explore evidence.");
					}
				} else {
					this.conceptSetValidText("You must define a concept set with drugs found in the RxNorm vocbulary at the Ingredient class level OR Conditions from SNOMED. The concept set must contain ONLY conditions OR drugs in order to explore evidence.");
				}
				this.conceptSetValid(conceptSetValid);
				this.conceptDomainId(conceptDomainId);
				this.targetDomainId(targetDomainId);
			}

			this.getEvidenceSourcesFromConfig = function () {
				var evidenceSources = [];

				$.each(sharedState.sources(), function (i, source) {
					if (source.hasEvidence) {
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

			this.getEvidenceSources = function () {
				this.loadingEvidenceSources(true);
				var resolvingPromise = conceptSetAPI.getGenerationInfo(this.conceptSet()
					.id);
				$.when(resolvingPromise)
					.done(generationInfo => {
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
								
								var csToIncludePromise = $.Deferred();
								if (evidenceSources[i].csToInclude() > 0) {
									csToIncludePromise = conceptSetAPI.getConceptSet(evidenceSources[i].csToInclude());
								} else {
									csToIncludePromise.resolve();
									evidenceSources[i].csToIncludeLoading(false);
								}
								var csToExcludePromise = $.Deferred();
								if (evidenceSources[i].csToExclude() > 0) {
									csToExcludePromise = conceptSetAPI.getConceptSet(evidenceSources[i].csToExclude());
								} else {
									csToExcludePromise.resolve();
									evidenceSources[i].csToExcludeLoading(false);
								}
								
								$.when(csToIncludePromise, csToExcludePromise)
									.done(function (csInclude, csExclude) {
										if (csInclude != null && csInclude.length > 0) {
											evidenceSources[i].csToIncludeCaption(csInclude[0].name);
											evidenceSources[i].csToIncludeLoading(false);
										}
										if (csExclude != null && csExclude.length > 0) {
											evidenceSources[i].csToExcludeCaption(csExclude[0].name);
											evidenceSources[i].csToExcludeLoading(false);
										}
								});
								

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

			this.refreshRecordCounts = function (obj, event) {
				if (event.originalEvent) {
					// User changed event
					this.recordCountsRefreshing(true);
					$("#dtNegCtrlRC")
						.toggleClass("fa-database")
						.toggleClass("fa-circle-o-notch")
						.toggleClass("fa-spin");
					$("#dtNegCtrlDRC")
						.toggleClass("fa-database")
						.toggleClass("fa-circle-o-notch")
						.toggleClass("fa-spin");
					$(".ncRecordCount").each(function(index) { $(this).text("...") });
					var negativeControls = this.negativeControls();
					var conceptIdsForNegativeControls = $.map(negativeControls, function (o, n) {
						return o.conceptId;
					});
					cdmResultsAPI.getConceptRecordCount(this.currentResultSource()
							.sourceKey, conceptIdsForNegativeControls, negativeControls)
						.then(function (rowcounts) {
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

			this.addDrugLabelToResults = function(drugLabelExists, negativeControls, targetDomainId) {
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

			this.getDrugLabelExistsByBoolean = function(filter) {
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

			this.toggleLabelDetails = function() {
				var newDisplay = !this.drugLabelDetailsDisplay();
				this.drugLabelDetailsDisplay(newDisplay);
			}

			this.toggleLabelDisplay = ko.pureComputed(() => {
				var displayVal = this.drugLabelDetailsDisplay() ? 'hide' : 'show';
				return displayVal;
			})

			this.isSourceRunning = function (source) {
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

			this.showNegControlsSaveNewModal = function () {
				$('negative-controls #modalNegControlsSaveNew')
					.modal('show');
			}

			this.saveNewConceptSet = () => {
				var dtItems = $('#negControlResults table')
					.DataTable()
					.data();
				var conceptSet = {};
				conceptSet.id = 0;
				conceptSet.name = this.newConceptSetName;
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
				})
				this.saveConceptSet("#txtNewConceptSetName", conceptSet, selectedConcepts);
				$('conceptset-manager #modalSaveNew')
					.modal('hide');
			}
			
			this.chooseIncludeConceptSet = function (source) {
				$('#ncModalConceptSetSelect').modal('show');
				this.csTarget = source.csToInclude;
				this.csTargetCaption = source.csToIncludeCaption;
			}
			
			this.clearIncludeConceptSet = function (source) {
				source.csToInclude(0);
				source.csToIncludeCaption(null);
			}
			
			this.chooseExcludeConceptSet = function (source) {
				$('#ncModalConceptSetSelect').modal('show');
				this.csTarget = source.csToExclude;
				this.csTargetCaption = source.csToExcludeCaption;
			}
			
			this.clearExcludeConceptSet = function (source) {
				source.csToExclude(0);
				source.csToExcludeCaption(null);
			}
			
			this.conceptsetSelected = function(d) {
				$('#ncModalConceptSetSelect').modal('hide');
				conceptSetAPI.getConceptSet(d.id).then(function (csInfo) {
					this.csTarget(csInfo.id);
					this.csTargetCaption(csInfo.name);
					/*
					var conceptSetData = new ConceptSet({
						id: d.id,
						name: d.name,
						expression: csExpression
					});
					this.targetExpression.removeAll();
					this.targetExpression.push(conceptSetData);

					vocabularyAPI.getConceptSetExpressionSQL(csExpression).then(
						function (data) {
							this.targetConceptSetSQL(data);
						});
					*/
				});
			}
			
			this.disableNewConceptSetButton = function() {
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
