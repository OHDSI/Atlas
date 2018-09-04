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
      this.searchConceptsColumns = [{
        title: '<i class="fa fa-shopping-cart"></i>',
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
        title: 'Id',
        data: 'CONCEPT_ID'
      }, {
        title: 'Code',
        data: 'CONCEPT_CODE'
      }, {
        title: 'Name',
        data: 'CONCEPT_NAME',
        render: function (s, p, d) {
          var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
          return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
        }
      }, {
        title: 'Class',
        data: 'CONCEPT_CLASS_ID'
      }, {
        title: 'Standard Concept Caption',
        data: 'STANDARD_CONCEPT_CAPTION',
        visible: false
      }, {
        title: 'RC',
        data: 'RECORD_COUNT',
        className: 'numeric'
      }, {
        title: 'DRC',
        data: 'DESCENDANT_RECORD_COUNT',
        className: 'numeric'
      }, {
        title: 'Domain',
        data: 'DOMAIN_ID'
      }, {
        title: 'Vocabulary',
        data: 'VOCABULARY_ID'
      }, {
        title: 'Ancestors',
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