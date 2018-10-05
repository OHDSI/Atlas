define([
	'knockout',
	'text!./included-conceptsets.html',
	'providers/Component',
  'utils/CommonUtils',
  'atlas-state',
	'services/ConceptSet',
  './included-conceptsets-badge'
], function (
	ko,
	view,
	Component,
  commonUtils,
  sharedState,
  conceptSetService,
) {
	class IncludedConceptsets extends Component {
		constructor(params) {
			super(params);
      this.model = params.model;
      this.ancestorsModalIsShown = ko.observable(false);
      this.ancestors = ko.observableArray([]);		
      this.showAncestorsModal = conceptSetService.getAncestorsModalHandler({
        model: params.model,
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
        render: function (s, p, d) {
          var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
          return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
        }
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
      this.includedDrawCallback = conceptSetService.getIncludedConceptSetDrawCallback(this);

      // on activate
      this.model.loadIncluded();
    }

	}

	return commonUtils.build('included-conceptsets', IncludedConceptsets, view);
});