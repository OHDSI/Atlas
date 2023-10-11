define([
	'knockout',
	'text!./sourcecodes.html',
	'components/Component',
	'./ImportComponent',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'services/VocabularyProvider',
	'less!./sourcecodes.less',
], function(
	ko,
	view,
	Component,
	ImportComponent,
	AutoBind,
	Clipboard,
	commonUtils,
	vocabularyApi,
){

	class SourceCodesImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.isSearching = ko.observable(false);
			this.sourcecodes = ko.observable("");
			this.loadedConcepts = ko.observableArray();
			this.notFoundCodes = ko.observableArray();
			this.appendConcepts = params.appendConcepts;
			this.canAddConcepts = ko.pureComputed(() => this.loadedConcepts().filter(c => c.isSelected()).length > 0 && params.canEdit());
			this.commonUtils = commonUtils;
			this.tableOptions = commonUtils.getTableOptions('M');
			this.doImport = this.doImport.bind(this);

			this.searchColumns = [{
				title: '',
				render: (s, p, d) => {
					return '<span data-bind="click: function(d) { d.isSelected(!d.isSelected()) } ,css: { selected: isSelected} " class="fa fa-check"></span>';
				},
				orderable: false,
				searchable: false,
				renderSelectAll: true,
				selectAll: (data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.loadedConcepts(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
				}
			},{
				title: ko.i18n('columns.id', 'Id'),
				data: 'CONCEPT_ID'
			}, {
				title: ko.i18n('columns.code', 'Code'),
				data: 'CONCEPT_CODE'
			}, {
				title: ko.i18n('columns.name', 'Name'),
				data: 'CONCEPT_NAME',
				render: commonUtils.renderLink,
			}, {
				title: ko.i18n('columns.class', 'Class'),
				data: 'CONCEPT_CLASS_ID'
			}, {
				title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			}, {
				title: ko.i18n('columns.rc', 'RC'),
				data: 'RECORD_COUNT',
				className: 'numeric'
			}, {
				title: ko.i18n('columns.drc', 'DRC'),
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			}, {
				title: ko.i18n('columns.domain', 'Domain'),
				data: 'DOMAIN_ID'
			}, {
				title: ko.i18n('columns.vocabulary', 'Vocabulary'),
				data: 'VOCABULARY_ID'
			}];

			this.searchOptions = {
				Facets: [{
					'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.class', 'Class'),
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.domain', 'Domain'),
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.standardConcept', 'Standard Concept'),
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
				}, {
					'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
				}, {
					'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT) > 0;
					}
				}, {
					'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
					}
				}]
			};
		}

		getSelectedConcepts() {
			return commonUtils.getSelectedConcepts(this.loadedConcepts);
		}

		async runImport(options) {
			this.appendConcepts(this.loadedConcepts().filter(c => c.isSelected()), options);
		}

		async loadConcepts() {
			this.isSearching(true);
			try {
				const codes = this.sourcecodes().match(/[0-9a-zA-Z\.-]+/g);
				const {data} = await vocabularyApi.getConceptsByCode(codes);
				await vocabularyApi.loadDensity(data);
				data.forEach(c => c.isSelected = ko.observable(false));
				this.loadedConcepts(data);
				this.notFoundCodes(codes.filter(code => data.filter(c => c.CONCEPT_CODE === code).length === 0));
			} finally {
				this.isSearching(false);
			}
		}
	}

	return commonUtils.build('conceptset-list-import-sourcecodes', SourceCodesImport, view);
});