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
			this.loading = ko.pureComputed(() => {
				return sharedState.loadingSourcecodes() || sharedState.loadingIncluded();
      });
      this.showAncestorsModal = conceptSetService.getAncestorsModalHandler({
        sharedState: sharedState,
        ancestors: this.ancestors,
        ancestorsModalIsShown: this.ancestorsModalIsShown,
      });
      this.searchConceptsColumns = [{
        render: function (s, p, d) {
          var css = '';
          var icon = 'fa-shopping-cart';
          if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
            css = ' selected';
          }
          return '<i class="fa ' + icon + ' ' + css + '"></i>';
        },
        orderable: false,
        searchable: false
      }, {
        data: 'CONCEPT_ID'
      }, {
        data: 'CONCEPT_CODE'
      }, {
        data: 'CONCEPT_NAME',
        render: commonUtils.renderLink,
      }, {
        data: 'CONCEPT_CLASS_ID'
      }, {
        data: 'STANDARD_CONCEPT_CAPTION',
        visible: false
      }, {
        data: 'RECORD_COUNT',
        className: 'numeric'
      }, {
        data: 'DESCENDANT_RECORD_COUNT',
        className: 'numeric'
      }, {
        data: 'DOMAIN_ID'
      }, {
        data: 'VOCABULARY_ID'
      }, {
        data: 'ANCESTORS',
        render: conceptSetService.getAncestorsRenderFunction()
      }];

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
        }]
      };

      // Triggers parallel load of subset of Ancestors only for current page - to display data ASAP
      // while the query for full ancestors list is being executed in background
      // Per: https://github.com/OHDSI/Atlas/pull/614#issuecomment-383050990
      this.includedDrawCallback = conceptSetService.getIncludedConceptSetDrawCallback({ searchConceptsColumns: this.searchConceptsColumns });
    }

    dispose() {
      this.ancestorsModalIsShown(false)
    }

	}

	return commonUtils.build('included-conceptsets', IncludedConceptsets, view);
});