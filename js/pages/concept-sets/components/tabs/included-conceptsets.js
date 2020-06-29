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
      this.currentConceptSet = sharedState.repositoryConceptSet;
      this.includedConcepts = this.currentConceptSet.includedConcepts;
      this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
      this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.loading = ko.pureComputed(() => {
				return this.currentConceptSet.loadingSourcecodes() || this.currentConceptSet.loadingIncluded() || this.currentConceptSet.resolvingConceptSetExpression();
      });
      this.showAncestorsModal = conceptSetService.getAncestorsModalHandler({
        sharedState: sharedState,
        ancestors: this.ancestors,
        ancestorsModalIsShown: this.ancestorsModalIsShown,
        source: globalConstants.conceptSetSources.repository,
      });
      this.searchConceptsColumns = globalConstants.getIncludedConceptsColumns(sharedState, this, commonUtils, conceptSetService);

      this.searchConceptsOptions = {
        Facets: [{
          'caption': 'Vocabulary',
          'binding': function (o) {
            return o.VOCABULARY_ID;
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
        }],
      };

      // Triggers parallel load of subset of Ancestors only for current page - to display data ASAP
      // while the query for full ancestors list is being executed in background
      // Per: https://github.com/OHDSI/Atlas/pull/614#issuecomment-383050990
      this.includedDrawCallback = conceptSetService.getIncludedConceptSetDrawCallback({ searchConceptsColumns: this.searchConceptsColumns });
    }

    addToConceptSetExpression() {
      const concepts = commonUtils.getSelectedConcepts(this.includedConcepts());
      conceptSetService.addConceptsToConceptSet({
        concepts,
        source: globalConstants.conceptSetSources.repository,
      });
    }

    dispose() {
      this.ancestorsModalIsShown(false)
    }

	}

	return commonUtils.build('included-conceptsets', IncludedConceptsets, view);
});