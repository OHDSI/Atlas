define(['knockout',
	'text!./negative-controls.html',
	'appConfig',
	'webapi/EvidenceAPI',
	'webapi/CDMResultsAPI',
	'webapi/ConceptSetAPI',
	'atlas-state',
	'job/jobDetail',
  'webapi/MomentAPI',
	'assets/ohdsi.util',
	'databindings'
], function (ko, view, config, evidenceAPI, cdmResultsAPI, conceptSetAPI, sharedState, jobDetail, momentApi) {
	function negativeControls(params) {
		var self = this;

		var pollTimeout = null;
		var authApi = params.model.authApi;
		self.model = params.model;
		self.selectedConcepts = params.selectedConcepts;
		self.conceptSet = params.conceptSet;
		self.conceptIds = params.conceptIds;
		self.defaultResultsUrl = params.defaultResultsUrl;
		self.negativeControls = params.negativeControls;
		self.dirtyFlag = params.dirtyFlag;
		self.saveConceptSet = params.saveConceptSet;
		self.conceptSetValid = ko.observable(false);
		self.conceptSetValidText = ko.observable("");
		self.conceptDomainId = ko.observable(null);
		self.targetDomainId = ko.observable(null);
		self.currentEvidenceService = ko.observable();
		self.currentResultSource = ko.observable();
		self.loadingResults = ko.observable(false);
		self.evidenceSources = ko.observableArray();
		self.loadingEvidenceSources = ko.observable(false);
		self.drugLabelExists = ko.observableArray();
		self.drugLabelDetailsDisplay = ko.observable(false);
		self.loadingDrugLabelExists = ko.observable(false);
		self.selectedReportCaption = ko.observable();
		self.recordCountsRefreshing = ko.observable(false);
		self.recordCountClass = ko.pureComputed(function () {
			return self.recordCountsRefreshing() ? "fa fa-circle-o-notch fa-spin fa-lg" : "fa fa-database fa-lg";
		});
		self.newConceptSetName = ko.observable(self.conceptSet()
			.name() + " - Candidate Controls");
		self.csTarget = ko.observable();
		self.csTargetCaption = ko.observable();

		self.negControlColumns = [
			{
				title: 'Id',
				data: d => d.conceptId,
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
				data: d => {
					return d.exactPmidCount.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
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

		self.negControlOptions = {
			lengthMenu: [
				[10, 25, 50, 100, -1],
				['10', '25', '50', '100', 'All']
			],
			order: [
				[3, 'desc'],
				[4, 'desc']
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

		self.selectedConceptsSubscription = self.selectedConcepts.subscribe(function (newValue) {
			if (newValue != null) {
				self.evaluateConceptSet();
			}
		});

		self.isRunning = ko.pureComputed(function () {
			return self.evidenceSources()
				.filter(function (info) {
					return !(info.status() == "COMPLETE" || info.status() == "n/a");
				})
				.length > 0;
		});

		self.getSourceInfo = function (sourceKey) {
			return self.evidenceSources()
				.filter(function (d) {
					return d.sourceKey() == sourceKey
				})[0];
		}

		self.canGenerate = ko.pureComputed(function () {
			var isDirty = self.dirtyFlag() && self.dirtyFlag()
				.isDirty();
			var isNew = self.model.currentConceptSet() && (self.model.currentConceptSet()
				.id == 0);
			var canGenerate = !(isDirty || isNew);
			return (canGenerate);
		});

		self.pollForInfo = function () {
			if (pollTimeout)
				clearTimeout(pollTimeout);

			var id = self.conceptSet().id;
			conceptSetAPI.getGenerationInfo(id)
				.then(function (infoList) {
					var hasPending = false;
					console.log("poll for evidence....")

					infoList.forEach(function (info) {
						// obtain source reference
						var source = self.evidenceSources()
							.filter(function (s) {
								return s.sourceId() == info.sourceId
							})[0];

						if (source) {
							// only bother updating those sources that we know are running
							if (self.isSourceRunning(source)) {
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
						pollTimeout = setTimeout(function () {
							self.pollForInfo();
						}, 5000);
					}
				});
		}

		self.generate = function (service, event) {
			// Check to make sure the concept set is valid before calling the service
			if (!self.conceptSetValid()) {
				alert("The concept set is not marked as valid to generate results. Please make sure this concept set contains only CONDITIONS or DRUGS.");
				return;
			}

			// Call the ajax service to generate the results
			var negativeControlsJob = evidenceAPI.generateNegativeControls(service.sourceKey(), self.conceptSet()
				.id, self.conceptSet()
				.name(), self.conceptDomainId(), self.targetDomainId(), self.conceptIds(), service.csToInclude(), service.csToExclude());

			// Mark as pending results
			self.getSourceInfo(service.sourceKey()).status('PENDING');
			self.negativeControls(null);
			self.loadingResults(false);

			// Create a job to monitor progress
			var job = new jobDetail({
				name: self.conceptSet().name() + "_" + service.sourceKey(),
				type: 'negative-controls',
				status: 'PENDING',
				executionId: String(self.conceptSet().id) + String(service.sourceId()),
				statusUrl: config.api.url + 'conceptset/' + self.conceptSet().id + '/generationinfo',
				statusValue: 'status',
				viewed: false,
				url: 'conceptset/' + self.conceptSet().id + '/evidence',
			});

			// Kick the job off
			$.when(negativeControlsJob)
				.done(function (jobInfo) {
					pollTimeout = setTimeout(function () {
						sharedState.jobListing.queue(job);
						self.pollForInfo();
					}, 5000);
				})
				.fail(function(info) {
					authApi.handleAccessDenied;
					console.error("Job failed: " + JSON.stringify(info));
				});
		}

		self.isGenerating = function () {
			return false;
		}

		self.evaluateConceptSet = function () {
			// Determine if all of the concepts in the current concept set
			// are all of the same type (CONDITION or DRUG) and if so, this
			// concept set is valid and can be evaluated for negative controls
			var conceptSetValid = false;
			var conceptDomainId = null;
			var targetDomainId = null;
			var conceptSetLength = self.selectedConcepts()
				.length;
			var conditionLength = self.selectedConcepts()
				.filter(function (elem) {
					return elem.concept.DOMAIN_ID == "Condition";
				})
				.length;
			var drugLength = self.selectedConcepts()
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
					self.conceptSetValidText("Your saved concepts come from multiple Domains (Condition, Drug). The concept set must contain ONLY conditions OR drugs in order to explore evidence.");
				}
			} else {
				self.conceptSetValidText("You must define a concept set with drugs found in the RxNorm vocbulary at the Ingredient class level OR Conditions from SNOMED. The concept set must contain ONLY conditions OR drugs in order to explore evidence.");
			}
			self.conceptSetValid(conceptSetValid);
			self.conceptDomainId(conceptDomainId);
			self.targetDomainId(targetDomainId);
		}

		self.getEvidenceSourcesFromConfig = function () {
			evidenceSources = [];

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

		self.getEvidenceSources = function () {
			self.loadingEvidenceSources(true);
			var resolvingPromise = conceptSetAPI.getGenerationInfo(self.conceptSet()
				.id);
			$.when(resolvingPromise)
				.done(function (generationInfo) {
					var evidenceSources = self.getEvidenceSourcesFromConfig();
					$.each(evidenceSources, function (i, evidenceSource) {
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
							
							csToIncludePromise = $.Deferred();
							if (evidenceSources[i].csToInclude() > 0) {
								csToIncludePromise = conceptSetAPI.getConceptSet(evidenceSources[i].csToInclude());
							} else {
								csToIncludePromise.resolve();
								evidenceSources[i].csToIncludeLoading(false);
							}
							csToExcludePromise = $.Deferred();
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
								self.pollForInfo();
							}
						} else {
							evidenceSources[i].csToInclude = ko.observable(0);
							evidenceSources[i].csToIncludeCaption = ko.observable(null);
							evidenceSources[i].csToExclude = ko.observable(0);
							evidenceSources[i].csToExcludeCaption = ko.observable(null);
						}
					});
					self.evidenceSources(evidenceSources);
					self.loadingEvidenceSources(false);
				});
		};

		self.resultSources = ko.computed(function () {
			var resultSources = [];
			$.each(sharedState.sources(), function (i, source) {
				if (source.hasResults) {
					resultSources.push(source);
					if (source.resultsUrl == sharedState.resultsUrl()) {
						self.currentResultSource(source);
					}
				}
			});


			return resultSources;
		}, this);

		self.refreshRecordCounts = function (obj, event) {
			if (event.originalEvent) {
				// User changed event
				self.recordCountsRefreshing(true);
				$("#dtNegCtrlRC")
					.toggleClass("fa-database")
					.toggleClass("fa-circle-o-notch")
					.toggleClass("fa-spin");
				$("#dtNegCtrlDRC")
					.toggleClass("fa-database")
					.toggleClass("fa-circle-o-notch")
					.toggleClass("fa-spin");
				$(".ncRecordCount").each(function(index) { $(this).text("...") });
				var negativeControls = self.negativeControls();
				var conceptIdsForNegativeControls = $.map(negativeControls, function (o, n) {
					return o.conceptId;
				});
				cdmResultsAPI.getConceptRecordCount(self.currentResultSource()
						.sourceKey, conceptIdsForNegativeControls, negativeControls)
					.then(function (rowcounts) {
						self.negativeControls(negativeControls);
						self.recordCountsRefreshing(false);
					});
			}
		}

		self.loadResults = function (service) {
			self.loadingResults(true);
			self.currentEvidenceService(service);
			self.selectedReportCaption(service.name);
			evidenceAPI.getNegativeControls(service.sourceKey(), self.conceptSet()
					.id)
				.then(function (results) {
					console.log("Get negative controls");
					var conceptIdsForNegativeControls = $.map(results, function (o, n) {
						return o.conceptId;
					});
					cdmResultsAPI.getConceptRecordCount(self.currentResultSource()
							.sourceKey, conceptIdsForNegativeControls, results)
						.then(function (rowcounts) {
							self.negativeControls(results);
							// Get the drug label information
							var conceptIdsForLabels = null;
							if (self.targetDomainId() == "Drug") {
								// Take the list of drugs from the results
								conceptIdsForLabels = conceptIdsForNegativeControls;
							} else {
								// Take the list of drugs from the concept set
								conceptIdsForLabels = self.conceptIds(); 
							}
							evidenceAPI.getDrugLabelExists(service.sourceKey(), conceptIdsForLabels).then(function (results) {
								var negativeControls = self.addDrugLabelToResults(results, self.negativeControls(), self.targetDomainId());
								self.negativeControls(negativeControls);
								self.drugLabelExists(results);								
								self.loadingResults(false);
							});				
						});
				});
		}

		self.addDrugLabelToResults = function(drugLabelExists, negativeControls, targetDomainId) {
			var drugLabelExistsIndex = {};
			for (i = 0; i < negativeControls.length; i++) {
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

		self.getDrugLabelExistsByBoolean = function(filter) {
			return self.drugLabelExists()
				.filter(function (elem) {
					return elem.usaProductLabelExists == filter;
				})
				.sort(function (left, right) { 
					return left.conceptName.toLowerCase() == right.conceptName.toLowerCase() ? 0 : (left.conceptName.toLowerCase() < right.conceptName.toLowerCase() ? -1 : 1) 
				});
		}

		self.drugLabelExistsIsTrue = ko.pureComputed(function (){
			return self.getDrugLabelExistsByBoolean("1");
		});

		self.drugLabelExistsIsFalse = ko.pureComputed(function (){
			return self.getDrugLabelExistsByBoolean("0");
		});

		self.drugLabelExistsPercentage = ko.pureComputed(function() {
			if (self.drugLabelExists().length > 0) {
				var pct = (self.drugLabelExistsIsTrue().length / self.drugLabelExists().length) * 100;
				return parseFloat(pct).toFixed(0);
			} else {
				return "0"
			}
		});

		self.toggleLabelDetails = function() {
			var newDisplay = !self.drugLabelDetailsDisplay();
			self.drugLabelDetailsDisplay(newDisplay);
		}

		self.toggleLabelDisplay = ko.pureComputed(function() {
			var displayVal = self.drugLabelDetailsDisplay() ? 'hide' : 'show';
			return displayVal;
		})

		self.isSourceRunning = function (source) {
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

		self.showNegControlsSaveNewModal = function () {
			$('negative-controls #modalNegControlsSaveNew')
				.modal('show');
		}

		self.saveNewConceptSet = function () {
			var dtItems = $('#negControlResults table')
				.DataTable()
				.data();
			var conceptSet = {};
			conceptSet.id = 0;
			conceptSet.name = self.newConceptSetName;
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
			self.saveConceptSet("#txtNewConceptSetName", conceptSet, selectedConcepts);
			$('conceptset-manager #modalSaveNew')
				.modal('hide');
		}
		
		self.chooseIncludeConceptSet = function (source) {
			$('#ncModalConceptSetSelect').modal('show');
			self.csTarget = source.csToInclude;
			self.csTargetCaption = source.csToIncludeCaption;
		}
		
		self.clearIncludeConceptSet = function (source) {
			source.csToInclude(0);
			source.csToIncludeCaption(null);
		}
		
		self.chooseExcludeConceptSet = function (source) {
			$('#ncModalConceptSetSelect').modal('show');
			self.csTarget = source.csToExclude;
			self.csTargetCaption = source.csToExcludeCaption;
		}
		
		self.clearExcludeConceptSet = function (source) {
			source.csToExclude(0);
			source.csToExcludeCaption(null);
		}
		
		self.conceptsetSelected = function(d) {
			$('#ncModalConceptSetSelect').modal('hide');
			conceptSetAPI.getConceptSet(d.id).then(function (csInfo) {
				self.csTarget(csInfo.id);
				self.csTargetCaption(csInfo.name);
				/*
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
				*/
			});
		}
		
		self.disableNewConceptSetButton = function() {
			return true;
		}

		// Evalute the concept set when this component is loaded
		self.evaluateConceptSet();

		// Get the evidence sources
		self.getEvidenceSources();
	}

	var component = {
		viewModel: negativeControls,
		template: view
	};

	ko.components.register('negative-controls', component);
	return component;
});
