define([
	'knockout',
	'text!./conceptset-compare.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/Vocabulary',
  'services/CDMResultsAPI',
  'jquery',
  'atlas-state',
  'components/modal',
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  vocabularyProvider,
  cdmResultsAPI,
  $,
  sharedState,
) {
	class ConceptsetCompare extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.model = params.model;
      this.isModalShown = ko.observable(false);
      this.saveConceptSetFn = params.saveConceptSetFn;
      this.saveConceptSetShow = params.saveConceptSetShow;
      this.compareCS1Id = ko.observable(this.model.currentConceptSet().id); // Init to the currently loaded cs
      this.compareCS1Caption = ko.observable(this.model.currentConceptSet().name());
      this.compareCS1ConceptSet = ko.observable(sharedState.selectedConcepts());
      this.compareCS1ConceptSetExpression = ko.pureComputed(() => {
        if (this.compareCS1Id === this.model.currentConceptSet().id) {
          return ko.toJS(sharedState.selectedConcepts());
        } else {
          return ko.toJS(this.compareCS1ConceptSet);
        }
      });
      this.compareCS2Id = ko.observable(0);
      this.compareCS2Caption = ko.observable();
      this.compareCS2ConceptSet = ko.observable(null);
      this.compareCS2ConceptSetExpression = ko.pureComputed(() => {
        if (this.compareCS2Id === this.model.currentConceptSet().id) {
          return ko.toJS(sharedState.selectedConcepts());
        } else {
          return ko.toJS(this.compareCS2ConceptSet);
        }
      })
      this.compareResults = ko.observable();
      this.comparisonTargets = ko.observable(null);
      this.compareError = ko.pureComputed(() => {
        return (
          this.compareCS1Id() > 0 &&
          this.compareCS2Id() > 0 &&
          (this.compareCS1Id() == this.compareCS2Id())
        )
      });
      this.compareReady = ko.pureComputed(() => {
        // both are specified & not the same
        const conceptSetsSpecifiedAndDifferent = (
          (this.compareCS1Id() > 0 && this.compareCS2Id() > 0) &&
          (this.compareCS1Id() != this.compareCS2Id())
        );

        // Check to see if one of the concept sets is the one
        // that is currently open. If so, check to see if it is
        // "dirty" and if so, we are not ready to compare.
        let currentConceptSetClean = true;
        if (conceptSetsSpecifiedAndDifferent && this.model.currentConceptSet()) {
          // If we passed the check above, then we'll enforce this condition
          // which also ensures that we have 2 valid concept sets specified
          if (this.compareCS1Id() == this.model.currentConceptSet().id ||
              this.compareCS2Id() == this.model.currentConceptSet().id) {
            // One of the concept sets that is involved in the comparison
            // is the one that is currently loaded; check to see if it is dirty
            currentConceptSetClean = !this.model.currentConceptSetDirtyFlag().isDirty();
          }
        }


        return (conceptSetsSpecifiedAndDifferent && currentConceptSetClean);
      });
      this.compareUnchanged = ko.pureComputed(() => {
        // both are specified & not the same
        const conceptSetsSpecifiedAndDifferent = (
          (this.compareCS1Id() > 0 && this.compareCS2Id() > 0) &&
          (this.compareCS1Id() != this.compareCS2Id())
        );

        // Next, determine if one of the concept sets that was used to show
        // results was changed. In that case, we do not want to show the
        // current results
        let currentComparisonCriteriaUnchanged = true;
        if (conceptSetsSpecifiedAndDifferent && this.comparisonTargets()) {
          // Check to see if the comparison crtieria has changed
          currentComparisonCriteriaUnchanged = (ko.toJSON(this.comparisonTargets()) === ko.toJSON(this.getCompareTargets()));
        }

        return (conceptSetsSpecifiedAndDifferent && currentComparisonCriteriaUnchanged);
      });
      this.compareLoading = ko.observable(false);
      this.compareLoadingClass = ko.pureComputed(() => {
        return this.compareLoading() ? "fa fa-circle-o-notch fa-spin fa-lg" : "fa fa-question-circle fa-lg"
      })
      this.compareNewConceptSetName = ko.observable(this.model.currentConceptSet().name() + " - From Comparison");
      this.compareResultsColumns = [{
        data: d => {
            if (d.conceptIn1Only == 1) {
              return '1 Only'
            } else if (d.conceptIn2Only == 1) {
              return '2 Only'
            } else {
              return 'Both'
            }
          },
        },
        {
          data: d => d.conceptId,
        },
        {
          data: d => d.conceptCode,
        },
        {
          render: (s,p,d) => {
            const concept = {
              CONCEPT_ID: d.conceptId,
              CONCEPT_NAME: d.conceptName,
              INVALID_REASON_CAPTION: d.invalidReason,
              STANDARD_CONCEPT: d.standardConcept,
            };
            return commonUtils.renderLink(s,p,concept)
          }
        },
        {
          data: d => d.conceptClassId,
        },
        {
          data: d => d.recordCount,
        },
        {
          data: d => d.descendantRecordCount,
        },
        {
          data: d => d.domainId,
        },
        {
          data: d => d.vocabularyId,
        },
      ];

      this.compareResultsOptions = {
        lengthMenu: [
          [10, 25, 50, 100, -1],
          ['10', '25', '50', '100', 'All']
        ],
        order: [
          [1, 'asc'],
          [2, 'desc']
        ],
        Facets: [{
            'caption': 'Match',
            'binding': d => {
              if (d.conceptIn1Only == 1) {
                return '1 Only'
              } else if (d.conceptIn2Only == 1) {
                return '2 Only'
              } else {
                return 'Both'
              }
            },
          },
          {
            'caption': 'Class',
            'binding': d => d.conceptClassId,
          },
          {
            'caption': 'Domain',
            'binding': d => d.domainId,
          },
          {
            'caption': 'Vocabulary',
            'binding': d => d.vocabularyId,
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
        ]
      };
      this.currentResultSource = ko.observable();
      this.resultSources = ko.computed(() => {
        const resultSources = [];
        sharedState.sources().forEach((source) => {
          if (source.hasResults) {
            resultSources.push(source);
            if (source.resultsUrl == sharedState.resultsUrl()) {
              this.currentResultSource(source);
            }
          }
        })

        return resultSources;
      });
      this.recordCountsRefreshing = ko.observable(false);
      this.recordCountClass = ko.pureComputed(() => {
        return this.recordCountsRefreshing() ? "fa fa-circle-o-notch fa-spin fa-lg" : "fa fa-database fa-lg";
      });
    }

    chooseCS1() {
			this.isModalShown(true);
			this.targetId = this.compareCS1Id;
			this.targetCaption = this.compareCS1Caption;
			this.targetExpression = this.compareCS1ConceptSet;
		}

		clearCS1() {
			this.compareCS1Id(0);
			this.compareCS1Caption(null);
			this.compareCS1ConceptSet(null);
			this.compareResults(null);
		}

		chooseCS2() {
			this.isModalShown(true);
			this.targetId = this.compareCS2Id;
			this.targetCaption = this.compareCS2Caption;
			this.targetExpression = this.compareCS2ConceptSet;
		}

		clearCS2() {
			this.compareCS2Id(0);
			this.compareCS2Caption(null);
			this.compareCS2ConceptSet(null);
			this.compareResults(null);
    }

    getCompareTargets() {
      return [{
				items: this.compareCS1ConceptSetExpression()
			}, {
				items: this.compareCS2ConceptSetExpression()
			}];
    }

		compareConceptSets() {
			this.compareLoading(true);
			const compareTargets = this.getCompareTargets();
			vocabularyProvider.compareConceptSet(compareTargets)
				.then((compareResults) => {
					const conceptIds = compareResults.map((o, n) => {
						return o.conceptId;
					});
					cdmResultsAPI.getConceptRecordCount(this.currentResultSource().sourceKey, conceptIds, compareResults)
						.then((rowcounts) => {
							//this.compareResults(null);
							this.compareResults(compareResults);
							this.comparisonTargets(compareTargets); // Stash the currently selected concept sets so we can use this to determine when to show/hide results
							this.compareLoading(false);
						});
				});
    }

    compareCreateNewConceptSet() {
			const dtItems = $('#compareResults table')
				.DataTable()
				.data();
			const conceptSet = {};
			conceptSet.id = 0;
			conceptSet.name = this.compareNewConceptSetName;
			const selectedConcepts = [];
			$.each(dtItems, (index, item) => {
				const concept = {
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
				const newItem = {
					concept: concept,
					isExcluded: ko.observable(false),
					includeDescendants: ko.observable(false),
					includeMapped: ko.observable(false),
				}
				selectedConcepts.push(newItem);
			})
			this.saveConceptSetFn("#txtNewConceptSetName", conceptSet, selectedConcepts);
			this.saveConceptSetShow(false);
    }

    conceptsetSelected(d) {
			this.isModalShown(false);
			vocabularyProvider.getConceptSetExpression(d.id)
				.then((csExpression) => {
					this.targetId(d.id);
					this.targetCaption(d.name);
					this.targetExpression(csExpression.items);
				});
    }

    showSaveNewModal() {
			this.saveConceptSetShow(true);
    }

    refreshRecordCounts(obj, event) {
			if (event.originalEvent) {
        // User changed event
				this.recordCountsRefreshing(true);
				$("#dtConeptManagerRC")
					.removeClass("fa-database")
					.addClass("fa-circle-o-notch")
					.addClass("fa-spin");
				$("#dtConeptManagerDRC")
					.removeClass("fa-database")
					.addClass("fa-circle-o-notch")
					.addClass("fa-spin");
				var compareResults = this.compareResults();
				var conceptIds = $.map(compareResults, function (o, n) {
					return o.conceptId;
				});
				cdmResultsAPI.getConceptRecordCount(this.currentResultSource().sourceKey, conceptIds, compareResults)
					.then((rowcounts) => {
						this.compareResults(compareResults);
            this.recordCountsRefreshing(false);
						$("#dtConeptManagerRC")
							.addClass("fa-database")
							.removeClass("fa-circle-o-notch")
							.removeClass("fa-spin");
						$("#dtConeptManagerDRC")
							.addClass("fa-database")
							.removeClass("fa-circle-o-notch")
							.removeClass("fa-spin");
					});
			}
		}
	}

	return commonUtils.build('conceptset-compare', ConceptsetCompare, view);
});