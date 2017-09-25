define(['jquery', 'knockout', 'text!./cohort-comparison-manager.html', 'lodash', 'clipboard',
				'webapi/CohortDefinitionAPI', 'appConfig', 'ohdsi.util',
				'cohortcomparison/ComparativeCohortAnalysis', 'webapi/ComparativeCohortAnalysisAPI'],
	function ($, ko, view, _, clipboard, cohortDefinitionAPI, config, ohdsiUtil,
		ComparativeCohortAnalysis, comparativeCohortAnalysisAPI) {
		function cohortComparisonManager(params) {
			var self = this;
			self.cohortComparisonId = params.currentCohortComparisonId;
			self.cohortComparison = params.currentCohortComparison;
			self.cohortComparisonDirtyFlag = params.dirtyFlag;

			self.config = config;
			self.loading = ko.observable(true);
			self.expressionMode = ko.observable('print');
			self.tabMode = ko.observable('specification');
			self.isSaving = ko.observable(false);
			
			self.saveText = ko.pureComputed(function() {
				if (self.isSaving()) {
					return "<i class=\"fa fa-circle-o-notch fa-spin\"></i> Saving";
				} else {
					return "Save";
				}
			});

			self.canSave = ko.pureComputed(function () {
				return (self.cohortComparison().name() && self.cohortComparison().targetComparator().comparatorId() && self.cohortComparison().targetComparator().comparatorId() > 0 && self.cohortComparison().targetComparator().targetId() && self.cohortComparison().targetComparator().targetId() > 0 && self.cohortComparison().outcome().outcomeId() && self.cohortComparison().outcome().outcomeId() > 0 && self.cohortComparison().analysis().modelType && self.cohortComparison().analysis().modelType() > 0 && self.cohortComparisonDirtyFlag() && self.cohortComparisonDirtyFlag().isDirty());
			});

			self.canDelete = ko.pureComputed(function () {
				return (self.cohortComparisonId() && self.cohortComparisonId() > 0);
			});

			self.delete = function () {
				if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
					return;

				comparativeCohortAnalysisAPI.deleteAnalysis(self.cohortComparisonId()).then(function (result) {
					self.cohortComparisonId(null);
					self.cohortComparison(null);
					self.cohortComparison = params.currentCohortComparison;
					self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
					document.location = "#/estimation"
				}, function (error) {
					console.log("Error: " + error);
				});
			}

			self.save = function () {
				self.isSaving(true);
				comparativeCohortAnalysisAPI.saveAnalysis(self.cohortComparison()).then(function (saveResult) {
					var redirectWhenComplete = saveResult.analysisId != self.cohortComparison().analysisId;
					self.cohortComparisonId(saveResult.analysisId);
					self.cohortComparison().analysisId = saveResult.analysisId;
					setTimeout(function () {
						self.cohortComparison(new ComparativeCohortAnalysis(saveResult));
						setTimeout(function () {
							self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
							if (redirectWhenComplete) {
								document.location = "#/estimation/" + self.cohortComparisonId();
							}
							self.isSaving(false);
						}, 0);
					}, 0);
				});
			}

			self.close = function () {
				if (self.cohortComparisonDirtyFlag().isDirty() && !confirm("Estimation analysis changes are not saved. Would you like to continue?")) {
					return;
				}
				self.cohortComparison(null);
				self.cohortComparisonId(null);
				self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
				document.location = '#/estimation';
			}

			self.import = function () {
				if (self.importJSON().length > 0) {
					var updatedExpression = JSON.parse(self.importJSON());
					self.cohortComparison(new ComparativeCohortAnalysis(updatedExpression));
					self.importJSON("");
					self.tabMode('specification');
				}
			};

			self.copyToClipboard = function (element) {
				var currentClipboard = new clipboard('#btnCopyToClipboard');

				currentClipboard.on('success', function (e) {
					console.log('Copied to clipboard');
					e.clearSelection();
					$('#copyToClipboardMessage').fadeIn();
					setTimeout(function () {
						$('#copyToClipboardMessage').fadeOut();
					}, 1500);
				});

				currentClipboard.on('error', function (e) {
					console.log('Error copying to clipboard');
					console.log(e);
				});
			}

			self.newCohortComparison = function () {
				// The ComparativeCohortAnalysis module is pretty big - use the setTimeout({}, 0) 
				// to allow the event loop to catch up.
				// http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
				setTimeout(function () {
					self.loading(false);
					self.cohortComparison(new ComparativeCohortAnalysis());
					setTimeout(function () {
						self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
					}, 0);
				}, 0);
			}

			self.loadCohortComparison = function () {
				// load cca
				comparativeCohortAnalysisAPI.getComparativeCohortAnalysis(self.cohortComparisonId()).then(function (comparativeCohortAnalysis) {
					setTimeout(function () {
						self.loading(false);
						self.cohortComparison(new ComparativeCohortAnalysis(comparativeCohortAnalysis));
						setTimeout(function () {
							self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
						}, 0);
					}, 0);
				});
			}

			// startup actions
			if (self.cohortComparisonId() == 0 && self.cohortComparison() == null) {
				self.newCohortComparison();
			} else if (self.cohortComparisonId() > 0 && self.cohortComparisonId() != (self.cohortComparison() && self.cohortComparison().analysisId)) {
				self.loadCohortComparison();
			} else {
				// already loaded
				self.loading(false);
			}
		}

		var component = {
			viewModel: cohortComparisonManager,
			template: view
		};

		ko.components.register('cohort-comparison-manager', component);
		return component;
	}
);
