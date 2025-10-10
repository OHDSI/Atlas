define([
  'knockout',
  'text!./compare-results-included-concepts.html',
  'services/AuthAPI',
  'services/CDMResultsAPI',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'services/MomentAPI',
  'jquery',
  'atlas-state',
  'components/charts/venn',
  'less!./compare-results-included-concepts.less'
], function (
  ko,
  view,
  authApi,
  cdmResultsAPI,
  Component,
  AutoBind,
  commonUtils,
  MomentApi,
  $,
  sharedState
) {
  class CompareResultsIncludedConcepts extends AutoBind(Component) {
    constructor(params) {
      super(params);
      this.compareResults = params.results;
      this.compareResultsSame = ko.pureComputed(() => {
        const results = this.compareResults();
        if (!results || results.length === 0) {
          return true;
        }
        return results.find(concept => concept.conceptInCS1AndCS2 === 0);
      });

      this.saveConceptSetFn = params.saveConceptSetFn;
      this.saveConceptSetShow = params.saveConceptSetShow;
      this.compareNewConceptSetName = params.compareNewConceptSetName;
      this.compareCS1Caption = params.compareCS1Caption;
      this.compareCS2Caption = params.compareCS2Caption;
      this.currentResultSource = params.currentResultSource;
      this.resultSources = params.resultSources;
      this.selectedVocabularyCS1 = params.selectedVocabularyCS1;
      this.selectedVocabularyCS2 = params.selectedVocabularyCS2;

      this.outsideFilters = ko.observable("");
      this.lastSelectedMatchFilter = ko.observable("");
      this.showDiagram = ko.observable(false);
      this.recordCountsRefreshing = ko.observable(false);
      this.recordCountClass = ko.pureComputed(() => {
        return this.recordCountsRefreshing() ? "fa fa-circle-notch fa-spin fa-lg" : "fa fa-database fa-lg";
      });

      this.getMatchType = this.getMatchType.bind(this);
      this.getMatchDisplayText = this.getMatchDisplayText.bind(this);

      this.compareResultsColumns = this.getColumns();
      this.compareResultsOptions = this.getOptions();

      this.hasMultipleSets = ko.pureComputed(() => {
        const results = this.compareResults();
        if (!results || results.length === 0) {
          return false;
        }
        
        let hasCS1Only = false;
        let hasCS2Only = false;
        let hasBoth = false;
        
        results.forEach(c => {
          if (c.conceptInCS1Only === 1) hasCS1Only = true;
          if (c.conceptInCS2Only === 1) hasCS2Only = true;
          if (c.conceptInCS1AndCS2 === 1) hasBoth = true;
        });
        
        const categoriesCount = (hasCS1Only ? 1 : 0) + (hasCS2Only ? 1 : 0) + (hasBoth ? 1 : 0);
        return categoriesCount >= 2;
      });
    }

    getColumns() {
      return [
        {
          title: ko.i18n('columns.match', 'Match'),
          data: d => {
            const matchType = this.getMatchType(d);
            return this.getMatchDisplayText(matchType);
          },
        },
        {
          title: ko.i18n('columns.vocabularyBundle', 'Vocabulary Bundle'),
          render: (s, p, d) => {
            // Only show if there are any mismatches
            const hasMismatches = 
              d.nameMismatch || 
              d.conceptCodeMismatch || 
              d.domainIdMismatch || 
              d.vocabularyIdMismatch || 
              d.conceptClassIdMismatch || 
              d.validStartDateMismatch || 
              d.validEndDateMismatch || 
              d.standardConceptMismatch || 
              d.invalidReasonMismatch;
    
            if (!hasMismatches) {
              return '';
            }
    
            const vocab1Label = this.selectedVocabularyCS1()
              ? `[${this.selectedVocabularyCS1().sourceName}] ${this.selectedVocabularyCS1().version}`
              : 'Vocab 1';
            const vocab2Label = this.selectedVocabularyCS2()
              ? `[${this.selectedVocabularyCS2().sourceName}] ${this.selectedVocabularyCS2().version}`
              : 'Vocab 2';
    
            let html = '<div class="vocab-source-column">';
            html += `<div class="vocab-source-row">${this.escapeHtml(vocab1Label)}</div>`;
            html += `<div class="vocab-source-row">${this.escapeHtml(vocab2Label)}</div>`;
            html += '</div>';
            return html;
          },
          visible: true
        },
        {
          title: ko.i18n('columns.id', 'Id'),
          render: (s, p, d) => {
            return d.conceptId ? d.conceptId :
              `<span title="${ko.i18n('cs.browser.compare.idNotFoundTitle', 'Concept ID not found by Code and Vocabulary')()}">
                  <i class="fa fa-exclamation-triangle id-not-found"></i>
                  <span>${ko.i18n('cs.browser.compare.idNotFound', 'Not found')()}</span>
                </span>`;
          }
        },
        {
          title: ko.i18n('columns.code', 'Code'),
          render: (s, p, d) => {
            if (d.vocab1ConceptCode !== null || d.vocab2ConceptCode !== null) {
              return this.renderFieldComparison(d.vocab1ConceptCode, d.vocab2ConceptCode, d.conceptCodeMismatch);
            } else {
              return this.escapeHtml(d.conceptCode || '');
            }
          },
        },
        {
          title: ko.i18n('columns.name', 'Name'),
          render: (s, p, d) => {
            const buildConceptForLink = (conceptName) => ({
              CONCEPT_ID: d.conceptId,
              CONCEPT_NAME: conceptName,
              INVALID_REASON_CAPTION: d.invalidReason,
              STANDARD_CONCEPT: d.standardConcept,
            });
    
            const isCrossVocab = d.vocab1ConceptName !== null && d.vocab2ConceptName !== null;
    
            if (isCrossVocab) {
              if (d.nameMismatch) {
                const link1 = commonUtils.renderLink(d.vocab1ConceptName, p, buildConceptForLink(d.vocab1ConceptName));
                const link2 = commonUtils.renderLink(d.vocab2ConceptName, p, buildConceptForLink(d.vocab2ConceptName));
    
                let html = '<div class="vocab-concept-names">';
                html += `<div class="vocab-name-row">${link1}</div>`;
                html += `<div class="vocab-name-row">${link2}</div>`;
                html += '</div>';
                return html;
              } else {
                return commonUtils.renderLink(d.vocab1ConceptName, p, buildConceptForLink(d.vocab1ConceptName));
              }
            } else {
              const conceptName = d.vocab1ConceptName || d.vocab2ConceptName || d.conceptName;
              if (!conceptName) return '';
              return commonUtils.renderLink(conceptName, p, buildConceptForLink(conceptName));
            }
          },
        },
        {
          title: ko.i18n('columns.class', 'Class'),
          render: (s, p, d) => this.renderFieldComparison(d.vocab1ConceptClassId, d.vocab2ConceptClassId, d.conceptClassIdMismatch, d.conceptClassId),
        },
        {
          title: ko.i18n('columns.validStartDate', 'Valid Start Date'),
          render: (s, type, d) => this.renderDateFieldComparison(d.vocab1ValidStartDate, d.vocab2ValidStartDate, d.validStartDateMismatch, d.validStartDate, type),
          visible: false
        },
        {
          title: ko.i18n('columns.validEndDate', 'Valid End Date'),
          render: (s, type, d) => this.renderDateFieldComparison(d.vocab1ValidEndDate, d.vocab2ValidEndDate, d.validEndDateMismatch, d.validEndDate, type),
          visible: false
        },
        {
          title: `<i id="dtConeptManagerRC" class="fa fa-database" aria-hidden="true"></i> ${ko.i18n('columns.rc', 'RC')()}`,
          data: d => d.recordCount,
        },
        {
          title: `<i id="dtConeptManagerDRC" class="fa fa-database" aria-hidden="true"></i> ${ko.i18n('columns.drc', 'DRC')()}`,
          data: d => d.descendantRecordCount,
        },
        {
          title: `<i id="dtConeptManagerPC" class="fa fa-database" aria-hidden="true"></i> ${ko.i18n('columns.pc', 'PC')()}`,
          data: d => d.personCount,
        },
        {
          title: `<i id="dtConeptManagerDPC" class="fa fa-database" aria-hidden="true"></i> ${ko.i18n('columns.dpc', 'DPC')()}`,
          data: d => d.descendantPersonCount,
        },
        {
          title: ko.i18n('columns.domain', 'Domain'),
          render: (s, p, d) => this.renderFieldComparison(d.vocab1DomainId, d.vocab2DomainId, d.domainIdMismatch, d.domainId),
        },
        {
          title: ko.i18n('columns.vocabulary', 'Vocabulary'),
          render: (s, p, d) => this.renderFieldComparison(d.vocab1VocabularyId, d.vocab2VocabularyId, d.vocabularyIdMismatch, d.vocabularyId),
        },
        {
          title: ko.i18n('columns.standardConcept', 'Standard Concept'),
          render: (s, p, d) => this.renderFieldComparison(d.vocab1StandardConcept, d.vocab2StandardConcept, d.standardConceptMismatch, d.standardConcept),
          visible: false
        },
        {
          title: ko.i18n('columns.invalidReason', 'Invalid Reason'),
          render: (s, p, d) => this.renderFieldComparison(d.vocab1InvalidReason, d.vocab2InvalidReason, d.invalidReasonMismatch, d.invalidReason),
          visible: false
        },
      ];
    }

    getOptions() {
      return {
        ...commonUtils.getTableOptions('L'),
        order: [[1, 'asc'], [2, 'desc']],
        Facets: [
          { 'caption': ko.i18n('facets.caption.match', 'Match'), 'binding': d => this.getMatchDisplayText(this.getMatchType(d)) },
          { 'caption': ko.i18n('facets.caption.class', 'Class'), 'binding': d => d.conceptClassId },
          { 'caption': ko.i18n('facets.caption.domain', 'Domain'), 'binding': d => d.domainId },
          { 'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'), 'binding': d => d.vocabularyId },
          { 'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'), 'binding': d => (parseInt((d.recordCount || '-1').replace(/,/g, '')) > 0) ? 'true' : 'false' },
          { 'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'), 'binding': d => (parseInt((d.descendantRecordCount || '-1').replace(/,/g, '')) > 0) ? 'true' : 'false' },
        ]
      };
    }

    getMatchType(d) {
      const inBothCS = d.conceptInCS1AndCS2 === 1;
      
      if (inBothCS) {
        // Check for any mismatches
        const hasMismatches = 
          d.nameMismatch || 
          d.conceptCodeMismatch || 
          d.domainIdMismatch || 
          d.vocabularyIdMismatch || 
          d.conceptClassIdMismatch || 
          d.validStartDateMismatch || 
          d.validEndDateMismatch || 
          d.standardConceptMismatch || 
          d.invalidReasonMismatch;

        if (hasMismatches) {
          return 'BOTH_WITH_DIFF';
        } else {
          return 'BOTH_SAME';
        }
      } else if (d.conceptInCS1Only === 1) {
        return 'CS1_ONLY';
      } else if (d.conceptInCS2Only === 1) {
        return 'CS2_ONLY';
      }
      
      return 'UNKNOWN';
    }

    getMatchDisplayText(matchType) {
      switch(matchType) {
        case 'BOTH_SAME':
          return ko.i18n('facets.match.bothSame', 'Both (Same)')();
        case 'BOTH_WITH_DIFF':
          return ko.i18n('facets.match.bothWithDiff', 'Both (Has Diffs)')();
        case 'CS1_ONLY':
          return ko.i18n('facets.match.only1', 'CS1 Only')();
        case 'CS2_ONLY':
          return ko.i18n('facets.match.only2', 'CS2 Only')();
        default:
          return ko.i18n('facets.match.unknown', 'Unknown')();
      }
    }

    showSaveNewModal() {
      this.saveConceptSetShow(true);
    }

    refreshRecordCounts(obj, event) {
      if (event.originalEvent) {
        this.recordCountsRefreshing(true);
        const compareResults = this.compareResults();
        const conceptIds = compareResults.map(o => o.conceptId).filter(id => id != null);
        cdmResultsAPI.getConceptRecordCount(this.currentResultSource().sourceKey, conceptIds, compareResults)
          .then(() => {
            this.compareResults(compareResults);
          })
          .finally(() => {
            this.recordCountsRefreshing(false);
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
      this.lastSelectedMatchFilter(key);
    }

    renderFieldComparison(value1, value2, hasMismatch, fallbackValue) {
      const isCrossVocab = value1 !== null && value2 !== null;
    
      if (isCrossVocab) {
        if (hasMismatch) {
          let html = '<div class="vocab-field-values">';
          html += `<div class="vocab-field-row"><i class="fa fa-exclamation-triangle field-mismatch"></i> ${this.escapeHtml(value1 || '')}</div>`;
          html += `<div class="vocab-field-row"><i class="fa fa-exclamation-triangle field-mismatch"></i> ${this.escapeHtml(value2 || '')}</div>`;
          html += '</div>';
          return html;
        } else {
          return this.escapeHtml(value1 || value2 || '');
        }
      } else {
        return this.escapeHtml(fallbackValue || '');
      }
    }
    
    renderDateFieldComparison(date1, date2, hasMismatch, fallbackDate, type) {
      if (type === "sort") {
        return fallbackDate ? +fallbackDate : 0;
      }
    
      const formatDate = (date) => {
        return date ? MomentApi.formatDateTimeWithFormat(date, MomentApi.DATE_FORMAT) : '';
      };
    
      const formattedDate1 = formatDate(date1);
      const formattedDate2 = formatDate(date2);
      const formattedFallbackDate = formatDate(fallbackDate);
    
      const isCrossVocab = date1 !== null && date2 !== null;
    
      if (isCrossVocab) {
        if (hasMismatch) {
          let html = '<div class="vocab-field-values">';
          html += `<div class="vocab-field-row"><i class="fa fa-exclamation-triangle field-mismatch"></i> ${formattedDate1}</div>`;
          html += `<div class="vocab-field-row"><i class="fa fa-exclamation-triangle field-mismatch"></i> ${formattedDate2}</div>`;
          html += '</div>';
          return html;
        } else {
          return formattedDate1 || formattedDate2;
        }
      } else {
        return formattedFallbackDate;
      }
    }

    escapeHtml(text) {
      if (!text) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    }
  }

  return commonUtils.build('compare-results-included-concepts', CompareResultsIncludedConcepts, view);
});