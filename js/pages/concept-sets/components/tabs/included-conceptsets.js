define([
	'knockout',
	'text!./included-conceptsets.html',
	'components/Component',
  'utils/CommonUtils',
  'atlas-state',
  'services/ConceptSet',
  'const',
  'lodash',
  './included-conceptsets-badge',
  'components/empty-state',
], function (
	ko,
	view,
	Component,
  commonUtils,
  sharedState,
  conceptSetService,
  globalConstants,
  lodash,
) {
	class IncludedConceptsets extends Component {
		constructor(params) {
			super(params);
      this.commonUtils = commonUtils;
      this.ancestorsModalIsShown = ko.observable(false);
      this.ancestors = ko.observableArray([]);
      this.includedConcepts = sharedState.includedConcepts;
      this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
      this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.loading = ko.pureComputed(() => {
				return sharedState.loadingSourcecodes() || sharedState.loadingIncluded() || sharedState.resolvingConceptSetExpression();
      });
      this.showAncestorsModal = conceptSetService.getAncestorsModalHandler({
        sharedState: sharedState,
        ancestors: this.ancestors,
        ancestorsModalIsShown: this.ancestorsModalIsShown,
      });
      this.searchConceptsColumns = globalConstants.getSearchConceptsColumns(sharedState, this, commonUtils, conceptSetService);

      this.searchConceptsOptions = {
        Facets: [{
          'caption': ko.i18n('cs.manager.includedConceptSets.vocabulary', 'Vocabulary')(),
          'binding': function (o) {
            return o.VOCABULARY_ID;
          }
        }, {
          'caption': ko.i18n('cs.manager.includedConceptSets.class', 'Class')(),
          'binding': function (o) {
            return o.CONCEPT_CLASS_ID;
          }
        }, {
          'caption': ko.i18n('cs.manager.includedConceptSets.domain', 'Domain')(),
          'binding': function (o) {
            return o.DOMAIN_ID;
          }
        }, {
          'caption': ko.i18n('cs.manager.includedConceptSets.standardConcept', 'Standard Concept')(),
          'binding': function (o) {
            return o.STANDARD_CONCEPT_CAPTION;
          }
        }, {
          'caption': ko.i18n('cs.manager.includedConceptSets.invalidReason', 'Invalid Reason')(),
          'binding': function (o) {
            return o.INVALID_REASON_CAPTION;
          }
        }, {
          'caption': ko.i18n('cs.manager.includedConceptSets.hasRecords', 'Has Records')(),
          'binding': function (o) {
            return parseInt(o.RECORD_COUNT.toString()
              .replace(',', '')) > 0;
          }
        }, {
          'caption': ko.i18n('cs.manager.includedConceptSets.hasDescendantRecords', 'Has Descendant Records')(),
          'binding': function (o) {
            return parseInt(o.DESCENDANT_RECORD_COUNT.toString()
              .replace(',', '')) > 0;
          }
        }],
      };

      // Triggers parallel load of subset of Ancestors only for current page - to display data ASAP
      // while the query for full ancestors list is being executed in background
      // Per: https://github.com/OHDSI/Atlas/pull/614#issuecomment-383050990
      this.includedDrawCallback = conceptSetService.getIncludedConceptSetDrawCallback({ searchConceptsColumns: this.searchConceptsColumns });

      this.datatableLanguage = ko.i18n('datatable.language');
    }

    dispose() {
      this.ancestorsModalIsShown(false)
    }

    dispose() {
      this.ancestorsModalIsShown(false)
    }

	}

	return commonUtils.build('included-conceptsets', IncludedConceptsets, view);
});