define([
  'knockout',
  'text!./conceptset-compare.html',
  'services/AuthAPI',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'utils/CsvUtils',
  'services/Vocabulary',
  'services/MomentAPI',
  'services/CDMResultsAPI',
  'jquery',
  'atlas-state',
  'components/conceptset/ConceptSetStore',
  'components/conceptset/InputTypes/ConceptSet',
  './coneptset-compare-const',
  'components/modal',
  'components/charts/venn',
  'less!./conceptset-compare.less'
], function (
	ko,
	view,
    authApi,
	Component,
  AutoBind,
  commonUtils,
  CsvUtils,
  vocabularyProvider,
  MomentApi,
  cdmResultsAPI,
  $,
  sharedState,
  ConceptSetStore,
  ConceptSet,
  Const
) {
class ConceptsetCompare extends AutoBind(Component) {
    constructor(params) {
        super(params);
        this.isModalShown = ko.observable(false);
        this.saveConceptSetFn = params.saveConceptSetFn;
        this.saveConceptSetShow = params.saveConceptSetShow;
        this.currentConceptSet = ConceptSetStore.repository().current;
        this.selectedConcepts = ko.pureComputed(() => this.currentConceptSet() && this.currentConceptSet().expression.items());
        this.currentConceptSetDirtyFlag = sharedState.RepositoryConceptSet.dirtyFlag;
        this.compareCS1Id = ko.observable(this.currentConceptSet().id); // Init to the currently loaded cs
        this.compareCS1Caption = ko.observable(this.currentConceptSet().name());
        this.compareCS1ConceptSet = ko.observable(sharedState.selectedConcepts());
        this.compareCS1ConceptSetExpression = ko.pureComputed(() => {
        if (this.currentConceptSet() && this.compareCS1Id() === this.currentConceptSet().id) {
          return ko.toJS(this.selectedConcepts());
        } else {
          return ko.toJS(this.compareCS1ConceptSet());
        }
        });
        this.compareCS1TypeFile = ko.observable(null);
        this.compareCS2Id = ko.observable(null);
        this.compareCS2Caption = ko.observable();
        this.compareCS2ConceptSet = ko.observable(null);
        this.compareCS2ConceptSetExpression = ko.pureComputed(() => {
          if (this.currentConceptSet() && this.compareCS2Id() === this.currentConceptSet().id) {
            return ko.toJS(this.selectedConcepts());
          } else {
            return ko.toJS(this.compareCS2ConceptSet());
          }
        });

        this.compareCS2TypeFile = ko.observable(null);
        this.compareResults = ko.observable();
        this.compareResultsSame = ko.observable();

        this.outsideFilters = ko.observable("");
        this.lastSelectedMatchFilter = ko.observable("");

        this.comparisonTargets = ko.observable(null);
        this.compareError = ko.pureComputed(() => {
        return (
          this.compareCS1Id() &&
          this.compareCS2Id() &&
          (this.compareCS1Id() === this.compareCS2Id())
        )
        });
        this.compareReady = ko.pureComputed(() => {
        // both are specified & not the same
        const conceptSetsSpecifiedAndDifferent = (
          (this.compareCS1Id() && this.compareCS2Id()) &&
          (this.compareCS1Id() !== this.compareCS2Id())
        );

        // Check to see if one of the concept sets is the one
        // that is currently open. If so, check to see if it is
        // "dirty" and if so, we are not ready to compare.
        let currentConceptSetClean = true;
        if (conceptSetsSpecifiedAndDifferent && this.currentConceptSet()) {
          // If we passed the check above, then we'll enforce this condition
          // which also ensures that we have 2 valid concept sets specified
          if (this.compareCS1Id() === this.currentConceptSet().id ||
              this.compareCS2Id() === this.currentConceptSet().id) {
            // One of the concept sets that is involved in the comparison
            // is the one that is currently loaded; check to see if it is dirty
            currentConceptSetClean = !this.currentConceptSetDirtyFlag().isDirty();
          }
        }


        return (conceptSetsSpecifiedAndDifferent && currentConceptSetClean);
        });
        this.compareUnchanged = ko.pureComputed(() => {
        // both are specified & not the same
        const conceptSetsSpecifiedAndDifferent = (
          (this.compareCS1Id() && this.compareCS2Id()) &&
          (this.compareCS1Id() !== this.compareCS2Id())
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
        return this.compareLoading() ? "fa fa-circle-notch fa-spin fa-lg" : "fa fa-question-circle fa-lg"
        });
        this.compareNewConceptSetName = ko.observable(this.currentConceptSet().name() + ko.i18n('cs.browser.compare.saveFromComparisonNameTail', ' - From Comparison')());
        this.compareResultsColumns = [{
        data: d => {
            if (d.conceptIn1Only == 1) {
              return ko.i18n('facets.match.only1', 'CS1 Only')();
            } else if (d.conceptIn2Only == 1) {
              return ko.i18n('facets.match.only2', 'CS2 Only')();
            } else {
              return ko.i18n('facets.match.both', 'Both')();
            }
          },
        },
        {
          render: (s,p,d) => {
              return d.conceptId ? d.conceptId :
                  `<span data-bind="title: ko.i18n('cs.browser.compare.idNotFoundTitle', 'Concept ID not found by Code and Vocabulary')">
                        <i class="fa fa-exclamation-triangle id-not-found"></i>
                        <span data-bind="text: ko.i18n('cs.browser.compare.idNotFound', 'Not found')"></span>
                   </span>`;
          }
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
            const link = commonUtils.renderLink(s, p, concept);
            return d.nameMismatch
                ? `<span data-bind="title: ko.i18n('cs.browser.compare.nameMismatchWarning', 'Concept is found in the source by code and vocabulary, but the name does not match')"><i class="fa fa-exclamation-triangle name-mismatch"></i></span> ${link}`
                : link;
          }
        },
        {
          data: d => d.conceptClassId,
        },
        {
          render: (s, type, d) => type === "sort" ? +d.validStartDate :
              MomentApi.formatDateTimeWithFormat(d.validStartDate, MomentApi.DATE_FORMAT),
          visible: false
        },
        {
          render: (s, type, d) => type === "sort" ? +d.validEndDate :
              MomentApi.formatDateTimeWithFormat(d.validEndDate, MomentApi.DATE_FORMAT),
          visible: false
        },
        {
          data: d => d.recordCount,
        },
        {
          data: d => d.descendantRecordCount,
        },
        {
          data: d => d.personCount,
        },
        {
          data: d => d.descendantPersonCount,
        },
        {
          data: d => d.domainId,
        },
        {
          data: d => d.vocabularyId,
        },
        ];

        this.compareResultsOptions = {
        ...commonUtils.getTableOptions('L'),
        order: [
          [1, 'asc'],
          [2, 'desc']
        ],
        Facets: [{
            'caption': ko.i18n('facets.caption.match', 'Match'),
            'binding': d => {
              if (d.conceptIn1Only == 1) {
                return ko.i18n('facets.match.only1', 'CS1 Only');
              } else if (d.conceptIn2Only == 1) {
                return ko.i18n('facets.match.only2', 'CS2 Only');
              } else {
                return ko.i18n('facets.match.both', 'Both');
              }
            },
          },
          {
            'caption': ko.i18n('facets.caption.class', 'Class'),
            'binding': d => d.conceptClassId,
          },
          {
            'caption': ko.i18n('facets.caption.domain', 'Domain'),
            'binding': d => d.domainId,
          },
          {
            'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
            'binding': d => d.vocabularyId,
          },
          {
            'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
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
            'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
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
          if (source.hasResults && authApi.isPermittedAccessSource(source.sourceKey)) {
            resultSources.push(source);
            if (source.resultsUrl === sharedState.resultsUrl()) {
              this.currentResultSource(source);
            }
          }
        })

        return resultSources;
        });
        this.recordCountsRefreshing = ko.observable(false);
        this.recordCountClass = ko.pureComputed(() => {
          return this.recordCountsRefreshing() ? "fa fa-circle-notch fa-spin fa-lg" : "fa fa-database fa-lg";
        });
        this.conceptSetLoading = ko.observable(false);
        this.showDiagram = ko.observable(false);
    }

    chooseCS1() {
        this.isModalShown(true);
        this.targetId = this.compareCS1Id;
        this.targetCaption = this.compareCS1Caption;
        this.targetExpression = this.compareCS1ConceptSet;
        this.targetTypeFile = this.compareCS1TypeFile;
    }

    clearCS1() {
        this.compareCS1Id(null);
        this.compareCS1Caption(null);
        this.compareCS1ConceptSet(null);
        this.compareResults(null);
        this.compareCS1TypeFile(null);
    }

    chooseCS2() {
        this.isModalShown(true);
        this.targetId = this.compareCS2Id;
        this.targetCaption = this.compareCS2Caption;
        this.targetExpression = this.compareCS2ConceptSet;
        this.targetTypeFile = this.compareCS2TypeFile;
		}

    clearCS2() {
        this.compareCS2Id(null);
        this.compareCS2Caption(null);
        this.compareCS2ConceptSet(null);
        this.compareResults(null);
        this.compareCS2TypeFile(null);
    }

    prepareDataAfterUploadFile(csvParse) {
        return csvParse.map(item => {
            const {concept_name, concept_code, vocabulary_id} = item;
            return {
                concept: {VOCABULARY_ID: vocabulary_id, CONCEPT_NAME: concept_name, CONCEPT_CODE: concept_code},
                includeDescendants: false,
                includeMapped: false,
                isExcluded: false
            };
        });
    }

    async uploadCS1(e) {
        const file = e.target.files[0];
        try {
            const csvParse = await CsvUtils.csvToJson(file, Const.requiredHeader);
            const data = this.prepareDataAfterUploadFile(csvParse);
            this.compareCS1Caption(file.name);
            this.compareCS1ConceptSet(data);
            this.compareCS1Id(file.name);
            this.compareCS1TypeFile(Const.expressionType.BRIEF);
        } catch (e) {
            throw new Error(e);
        } finally {
            e.target.value = '';
        }
    }

    async uploadCS2(e) {
        const file = e.target.files[0];
        try {
            const csvParse = await CsvUtils.csvToJson(file, Const.requiredHeader);
            const data = this.prepareDataAfterUploadFile(csvParse);
            this.compareCS2Caption(file.name);
            this.compareCS2ConceptSet(data);
            this.compareCS2Id(file.name);
            this.compareCS2TypeFile(Const.expressionType.BRIEF);
        } catch (e) {
            throw new Error(e);
        } finally {
            e.target.value = '';
        }
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
        const csTypes = [this.compareCS1TypeFile(), this.compareCS2TypeFile()];
        const apiMethod = csTypes[0] === Const.expressionType.BRIEF || csTypes[1] === Const.expressionType.BRIEF
            ? vocabularyProvider.compareConceptSetCsv(compareTargets, csTypes)
            : vocabularyProvider.compareConceptSet(compareTargets);

        apiMethod.then((compareResults) => {
            const conceptIds = compareResults.map((o, n) => {
                return o.conceptId;
            }).filter((id) => id !== null);
            const sameConcepts = compareResults.find(concept => concept.conceptIn1And2 === 0);
            cdmResultsAPI.getConceptRecordCount(this.currentResultSource().sourceKey, conceptIds, compareResults).then(() => {
                this.compareResults(compareResults);
                this.compareResultsSame(sameConcepts);
                this.comparisonTargets(compareTargets); // Stash the currently selected concept sets so we can use this to determine when to show/hide results
                this.compareLoading(false);
            });
        });
    }

    compareCreateNewConceptSet() {
        const dtItems = $('#compareResults table')
            .DataTable()
            .data()
            .toArray();
        const conceptSetItems = dtItems.map(item => ({
            concept: {
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
        }));

        const conceptSet = new ConceptSet({
            id: 0,
            name: this.compareNewConceptSetName(),
            expression: {
                items: conceptSetItems
            }
        });
        this.saveConceptSetFn(conceptSet, "#txtNewConceptSetName");
        this.saveConceptSetShow(false);
    }

    async conceptsetSelected(d) {
        this.isModalShown(false);
        this.conceptSetLoading(true);
        try {
            const csExpression = await vocabularyProvider.getConceptSetExpression(d.id);
            this.targetId(d.id);
            this.targetCaption(d.name);
            this.targetExpression(csExpression.items);
            this.targetTypeFile(Const.expressionType.FULL);
        } finally {
            this.conceptSetLoading(false);
        }
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
					.addClass("fa-circle-notch")
					.addClass("fa-spin");
				$("#dtConeptManagerDRC")
					.removeClass("fa-database")
					.addClass("fa-circle-notch")
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
							.removeClass("fa-circle-notch")
							.removeClass("fa-spin");
						$("#dtConeptManagerDRC")
							.addClass("fa-database")
							.removeClass("fa-circle-notch")
							.removeClass("fa-spin");
					});
			}
		}

    toggleShowDiagram() {
        this.showDiagram(!this.showDiagram());
    }

    updateOutsideFilters(key) {
        this.outsideFilters(key);
    }

    updateLastSelectedMatchFilter(key) {
        this.lastSelectedMatchFilter(key)
    }
}

	return commonUtils.build('conceptset-compare', ConceptsetCompare, view);
});