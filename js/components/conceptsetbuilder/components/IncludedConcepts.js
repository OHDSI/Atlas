define([
	'jquery',
	'knockout',
	'text!./IncludedConcepts.html',
	'services/VocabularyProvider',
	'utils/CommonUtils',
	'utils/Renderers',
	'faceted-datatable'
], function (
		$,
		ko,
		template,
		VocabularyAPI,
		commonUtils,
		renderers,
	) {

	function IncludedConcepts(params) {

		var self = this;

		self.conceptSet = ko.pureComputed(function () {
			return ko.toJS(params.conceptSet().expression);
		});
		self.canEdit = params.canEdit;

		self.isLoading = ko.observable(true);

		self.selectedConcepts = ko.observableArray();


		self.includedConcepts = ko.observableArray();
		if (params.widget)
			params.widget(self);

		self.facetOptions = {
			Facets: [
				{
					'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				},
				{
					'caption': ko.i18n('facets.caption.class', 'Class'),
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				},
				{
					'caption': ko.i18n('facets.caption.domain', 'Domain'),
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
				},
				{
					'caption': ko.i18n('facets.caption.standardConcept', 'Standard Concept'),
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
				},
				{
					'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
				},
				{
					'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT) > 0;
					}
				},
				{
					'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
					}
				}
			]
		};

		self.tableColumns = [
			{
				title: 'Id',
				data: 'CONCEPT_ID'
			},
			{
				title: 'Code',
				data: 'CONCEPT_CODE'
			},
			{
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: commonUtils.renderLink,
			},
			{
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
			},
			{
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			},
			{
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
			},
			{
				title: 'Excluded',
				render: () => renderers.renderCheckbox('isExcluded', context.canEditCurrentConceptSet()),
				orderable: false,
				searchable: false,
				className: 'text-center',
			},
			{
				title: 'Descendants',
				render: () => renderers.renderCheckbox('includeDescendants', context.canEditCurrentConceptSet()),
				orderable: false,
				searchable: false,
				className: 'text-center',
			},
			{
				title: 'Mapped',
				render: () => renderers.renderCheckbox('includeMapped', context.canEditCurrentConceptSet()),
				orderable: false,
				searchable: false,
				className: 'text-center',
			},
		];

		self.contextSensitiveLinkColor = function (row, data) {
			var switchContext;

			if (data.STANDARD_CONCEPT == undefined) {
					switchContext = data.concept.STANDARD_CONCEPT;
			} else {
					switchContext = data.STANDARD_CONCEPT;
			}

			switch (switchContext) {
				case 'N':
					$('a', row).css('color', '#800');
					break;
				case 'C':
					$('a', row).css('color', '#080');
					break;
			}
		}

		// behaviors

		self.refresh = function() {
			self.isLoading(true);
			self.selectedConcepts([]);
			VocabularyAPI.resolveConceptSetExpression(self.conceptSet()).then(function (identifiers) {
				VocabularyAPI.getConceptsById(identifiers).then(({ data: concepts }) => {
					self.includedConcepts(concepts);
				})
				.catch(function (err) {
					console.log("lookupByIds failed: " + err);
				})
				.finally(function () {
					self.isLoading(false);
				});
			})
			.catch(function (err) {
				console.log("resolveConceptSetExpression failed: " + err);
				self.isLoading(false);
			});
		}

		// subscriptions

		self.conceptSetSubscription = self.conceptSet.subscribe(function (newValue){
			self.refresh();
		});

		// dispose

		self.dispose = function() {
			self.conceptSetSubscription.dispose();
			params.widget(null);
		}

		// startup actions
		self.refresh();
	}

	// return compoonent definition
	return {
		viewModel: IncludedConcepts,
		template: template
	};

});