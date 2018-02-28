define(['knockout',
	'text!./negative-controls.html',
	'appConfig',
	'webapi/EvidenceAPI',
	'webapi/CDMResultsAPI',
	'webapi/ConceptSetAPI',
	'atlas-state',
	'job/jobDetail',
	'ohdsi.util',
	'databindings'
], function (ko, view, config, evidenceAPI, cdmResultsAPI, conceptSetAPI, sharedState, jobDetail) {
	function negativeControls(params) {
		var self = this;

		var pollTimeout = null;
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
		self.selectedReportCaption = ko.observable();
		self.recordCountsRefreshing = ko.observable(false);
		self.recordCountClass = ko.pureComputed(function () {
			return self.recordCountsRefreshing() ? "fa fa-circle-o-notch fa-spin fa-lg" : "fa fa-database fa-lg";
		});
		self.newConceptSetName = ko.observable(self.conceptSet()
			.name() + " - Candidate Controls");

		self.fields = {
			id: {
				propName: 'conceptId',
				value: d => d.conceptId,
				isColumn: true,
				isFacet: false,
				colIdx: 0,
				label: 'Id',
				isField: true,
			},
			name: {
				propName: 'conceptName',
				value: d => {
					var valid = true; //d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class=' + valid + ' href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
				},
				isColumn: true,
				isFacet: false,
				colIdx: 1,
				label: 'Name',
				isField: true,
			},
			domainId: {
				propName: 'domainId',
				value: d => d.domainId,
				isColumn: true,
				isFacet: false,
				colIdx: 2,
				label: 'Domain Id',
				isField: true,
			},
			medlineCT: {
				propName: 'medlineCt',
				value: d => {
					return d.medlineCt.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 3,
				label: 'Medline CT',
				isField: true,
			},
			medlineCase: {
				propName: 'medlineCase',
				value: d => {
					return d.medlineCase.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 4,
				label: 'Medline Case',
				isField: true,
			},
			medlineOther: {
				propName: 'medlineOther',
				value: d => {
					return d.medlineOther.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 4,
				label: 'Medline Other',
				isField: true,
			},
			semmeddbCtT: {
				propName: 'semmeddbCtT',
				value: d => {
					return d.semmeddbCtT.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 5,
				label: 'SemMedDB CT (True)',
				isField: true,
				visible: false,
			},
			semmeddbCaseT: {
				propName: 'semmeddbCaseT',
				value: d => {
					return d.semmeddbCaseT.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 6,
				label: 'SemMedDB Case (True)',
				isField: true,
				visible: false,
			},
			semmeddbOtherT: {
				propName: 'semmeddbOtherT',
				value: d => {
					return d.semmeddbOtherT.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 6,
				label: 'SemMedDB Other (True)',
				isField: true,
				visible: false,
			},
			semmeddbCtF: {
				propName: 'semmeddbCtF',
				value: d => {
					return d.semmeddbCtF.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 7,
				label: 'SemMedDB CT (False)',
				isField: true,
				visible: false,
			},
			semmeddbCaseF: {
				propName: 'semmeddbCaseF',
				value: d => {
					return d.semmeddbCaseF.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 8,
				label: 'SemMedDB Case (False)',
				isField: true,
				visible: false,
			},
			semmeddbOtherF: {
				propName: 'semmeddbOtherF',
				value: d => {
					return d.semmeddbOtherF.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 9,
				label: 'SemMedDB Other (False)',
				isField: true,
				visible: false,
			},
			euSPC: {
				propName: 'euSPC',
				value: d => {
					return d.euSPC.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 11,
				label: 'EU SPC',
				isField: true,
				visible: false,
			},
			splicerADR: {
				propName: 'splADR',
				value: d => {
					return d.splADR.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 12,
				label: 'Splicer ADR',
				isField: true,
			},
			aers: {
				propName: 'aers',
				value: d => {
					return d.aers.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				isColumn: true,
				isFacet: false,
				colIdx: 13,
				label: 'AERS',
				isField: true,

			},
			aersPRR: {
				propName: 'aersPRR',
				value: d => {
					return (Math.ceil(d.aersPRR * 1000) / 1000)
						.toFixed(4);
				},
				isColumn: true,
				isFacet: false,
				colIdx: 14,
				label: 'AERS PRR',
				isField: true,
			},
			prediction: {
				propName: 'prediction',
				value: d => {
					return (Math.ceil(d.prediction * 1000) / 1000)
						.toFixed(4);
				},
				isColumn: true,
				isFacet: false,
				colIdx: 15,
				label: 'Prediction',
				isField: true,
			},
			RC: {
				propName: 'recordCount',
				value: d => d.recordCount,
				isColumn: true,
				isFacet: false,
				colIdx: 16,
				label: '<i id="dtNegCtrlRC" class="fa fa-database" aria-hidden="true"></i> RC',
				isField: true,
			},
			DRC: {
				propName: 'descendantRecordCount',
				value: d => d.descendantRecordCount,
				isColumn: true,
				isFacet: false,
				colIdx: 17,
				label: '<i id="dtNegCtrlDRC" class="fa fa-database" aria-hidden="true"></i> DRC',
				isField: true,
			},
			fControls: {
				propName: 'medlineCt',
				value: d => {
					if (d.medlineCt == 0 &&
						d.medlineCase == 0 &&
						d.medlineOther == 0 &&
						d.splADR == 0 &&
						d.aersPRR.toFixed(2) < 2.00 &&
						d.prediction.toFixed(2) < 0.10) {
						return 'Negative Controls';
					} else if (d.prediction.toFixed(2) > 0.80) {
						return 'Positive Controls'
					} else {
						return 'Other'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
				label: 'Subset to candidate',
			},
			fRC: {
				propName: 'fRecordCount',
				label: 'Has Records',
				value: d => {
					var val = parseInt(d.recordCount.replace(/\,/g, '')); // Remove comma formatting and treat as int
					if (val > 0) {
						return 'true'
					} else {
						return 'false'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			},
			fDRC: {
				propName: 'fDescendantRecordCount',
				label: 'Has Descendant Records',
				value: d => {
					var val = parseInt(d.descendantRecordCount.replace(/\,/g, '')); // Remove comma formatting and treat as int
					if (val > 0) {
						return 'true'
					} else {
						return 'false'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			},
			fMedlineCT: {
				propName: 'medlineCt',
				label: 'Medline CT',
				value: d => {
					if (d.medlineCt == 0) {
						return '0';
					} else if (d.medlineCt > 0 && d.medlineCt <= 10) {
						return '1-10'
					} else {
						return '11 +'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			},
			fMedlineCase: {
				propName: 'medlineCase',
				label: 'Medline Case',
				value: d => {
					if (d.medlineCase == 0) {
						return '0';
					} else if (d.medlineCase > 0 && d.medlineCase <= 10) {
						return '1-10'
					} else {
						return '11 +'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			},
			fMedlineOther: {
				propName: 'medlineOther',
				label: 'Medline Other',
				value: d => {
					if (d.medlineOther == 0) {
						return '0';
					} else if (d.medlineOther > 0 && d.medlineOther <= 10) {
						return '1-10'
					} else {
						return '11 +'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			},
			fSplicer: {
				propName: 'splADR',
				label: 'Splicer ADR',
				value: d => d.splADR,
				isField: true,
				isColumn: false,
				isFacet: true,
			},
			fAERS: {
				propName: 'aers',
				label: 'AERS',
				value: d => {
					if (d.aers == 0) {
						return '0';
					} else if (d.aers > 0 && d.aers <= 10) {
						return '1-10'
					} else if (d.aers > 10 && d.aers <= 100) {
						return '11-100'
					} else {
						return '100+'
					}
				},
				isField: true,
				isColumn: false,
				isFacet: true,
			}
		}

		self.negControlColumns = [{
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
				title: 'Domain Id',
				data: d => d.domainId,
			},
			{
				title: 'Medline CT',
				data: d => {
					return d.medlineCt.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
			},
			{
				title: 'Medline Case',
				data: d => {
					return d.medlineCase.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
			},
			{
				title: 'Medline Other',
				data: d => {
					return d.medlineOther.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
			},
			{
				title: 'SemMedDB CT (True)',
				data: d => {
					return d.semmeddbCtT.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				visible: false,
			},
			{
				title: 'SemMedDB Case (True)',
				data: d => {
					return d.semmeddbCaseT.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				visible: false,
			},
			{
				title: 'SemMedDB Other (True)',
				data: d => {
					return d.semmeddbOtherT.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				visible: false,
			},
			{
				title: 'SemMedDB CT (False)',
				data: d => {
					return d.semmeddbCtF.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				visible: false,
			},
			{
				title: 'SemMedDB Case (False)',
				data: d => {
					return d.semmeddbCaseF.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				visible: false,
			},
			{
				title: 'SemMedDB Other (False)',
				data: d => {
					return d.semmeddbOtherF.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				visible: false,
			},
			{
				title: 'euSPC',
				data: d => {
					return d.euSPC.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
				visible: false,
			},
			{
				title: 'Splicer ADR',
				data: d => {
					return d.splADR.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
			},
			{
				title: 'AERS',
				data: d => {
					return d.aers.toString()
						.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				},
			},
			{
				title: 'AERS PRR',
				data: d => {
					return (Math.ceil(d.aersPRR * 1000) / 1000)
						.toFixed(4);
				},
			},
			{
				title: 'Prediction',
				data: d => {
					return (Math.ceil(d.prediction * 1000) / 1000)
						.toFixed(4);
				},
			},
			{
				title: '<i id="dtNegCtrlRC" class="fa fa-database" aria-hidden="true"></i> RC',
				data: d => d.recordCount,
			},
			{
				title: '<i id="dtNegCtrlDRC" class="fa fa-database" aria-hidden="true"></i> DRC',
				data: d => d.descendantRecordCount,
			},
		];

		self.negControlOptions = {
			lengthMenu: [
				[10, 25, 50, 100, -1],
				['10', '25', '50', '100', 'All']
			],
			order: [
				[16, 'asc'],
				[17, 'desc']
			],
			Facets: [{
					'caption': 'Subset to candidate',
					'binding': d => {
						if (d.medlineCt == 0 &&
							d.medlineCase == 0 &&
							d.medlineOther == 0 &&
							d.splADR == 0 &&
							d.aersPRR.toFixed(2) < 2.00 &&
							d.prediction.toFixed(2) < 0.10) {
							return 'Negative Controls';
						} else if (d.prediction.toFixed(2) > 0.80) {
							return 'Positive Controls'
						} else {
							return 'Other'
						}
					},
				},
				{
					'caption': 'Has Records',
					'binding': d => {
						var val = d.recordCount;
						if (val.replace)
							val = parseInt(val.replace(/\,/g, '')); // Remove comma formatting and treat as int
						if (val > 0) {
							return 'true'
						} else {
							return 'false'
						}
					},
				},
				{
					'caption': 'Has Descendant Records',
					'binding': d => {
						var val = d.descendantRecordCount;
						if (val.replace)
							val = parseInt(val.replace(/\,/g, '')); // Remove comma formatting and treat as int
						if (val > 0) {
							return 'true'
						} else {
							return 'false'
						}
					},
				},
				{
					'caption': 'Medline CT',
					'binding': d => {
						if (d.medlineCt == 0) {
							return '0';
						} else if (d.medlineCt > 0 && d.medlineCt <= 10) {
							return '1-10'
						} else {
							return '11 +'
						}
					},
				},
				{
					'caption': 'Medline Case',
					'binding': d => {
						if (d.medlineCase == 0) {
							return '0';
						} else if (d.medlineCase > 0 && d.medlineCase <= 10) {
							return '1-10'
						} else {
							return '11 +'
						}
					},
				},
				{
					'caption': 'Medline Other',
					'binding': d => {
						if (d.medlineOther == 0) {
							return '0';
						} else if (d.medlineOther > 0 && d.medlineOther <= 10) {
							return '1-10'
						} else {
							return '11 +'
						}
					},
				},
				{
					'caption': 'Splicer ADR',
					'binding': d => d.splADR,
				},
				{
					'caption': 'AERS',
					'binding': d => {
						if (d.aers == 0) {
							return '0';
						} else if (d.aers > 0 && d.aers <= 10) {
							return '1-10'
						} else if (d.aers > 10 && d.aers <= 100) {
							return '11-100'
						} else {
							return '100+'
						}
					},
				}
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

			var id = self.conceptSet()
				.id;
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
								source.startTime(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
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
				.name(), self.conceptDomainId(), self.targetDomainId(), self.conceptIds());

			// Mark as pending results
			self.getSourceInfo(service.sourceKey())
				.status('PENDING');
			
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
			sharedState.jobListing.queue(job);

			// Kick the job off
			$.when(negativeControlsJob)
				.done(function (jobInfo) {
					pollTimeout = setTimeout(function () {
						self.pollForInfo();
					}, 3000);
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

			$.each(config.api.sources, function (i, source) {
				if (source.hasEvidence) {
					var sourceInfo = {};
					sourceInfo.sourceId = ko.observable(source.sourceId);
					sourceInfo.sourceKey = ko.observable(source.sourceKey);
					sourceInfo.sourceName = ko.observable(source.sourceName);
					sourceInfo.startTime = ko.observable("n/a");
					sourceInfo.executionDuration = ko.observable("n/a");
					sourceInfo.status = ko.observable("n/a");
					sourceInfo.isValid = ko.observable(false);

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
							evidenceSources[i].startTime(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
							evidenceSources[i].executionDuration(execDuration);
							evidenceSources[i].status(gi[0].status);
							evidenceSources[i].isValid(gi[0].isValid);

							if (gi[0].status == "RUNNING") {
								self.pollForInfo();
							}
						}
					});
					self.evidenceSources(evidenceSources);
					self.loadingEvidenceSources(false);
				});
		};

		self.resultSources = ko.computed(function () {
			var resultSources = [];
			$.each(config.api.sources, function (i, source) {
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
				console.log("Record count refresh");
				self.recordCountsRefreshing(true);
				$("#dtNegCtrlRC")
					.toggleClass("fa-database")
					.toggleClass("fa-circle-o-notch")
					.toggleClass("fa-spin");
				$("#dtNegCtrlDRC")
					.toggleClass("fa-database")
					.toggleClass("fa-circle-o-notch")
					.toggleClass("fa-spin");
				var negativeControls = self.negativeControls();
				var conceptIdsForNegativeControls = $.map(negativeControls, function (o, n) {
					return o.conceptId;
				});
				cdmResultsAPI.getConceptRecordCount(self.currentResultSource()
						.sourceKey, conceptIdsForNegativeControls, negativeControls)
					.then(function (rowcounts) {
						self.negativeControls(negativeControls);
						console.log('record counts different?');
						self.recordCountsRefreshing(false);
						$("#dtNegCtrlRC")
							.toggleClass("fa-database")
							.toggleClass("fa-circle-o-notch")
							.toggleClass("fa-spin");
						$("#dtNegCtrlDRC")
							.toggleClass("fa-database")
							.toggleClass("fa-circle-o-notch")
							.toggleClass("fa-spin");
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
							self.loadingResults(false);
						});
				});
		}

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
