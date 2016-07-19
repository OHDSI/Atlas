define([
	'jquery',
	'knockout',
	'text!./MappedConcepts.html',
	'vocabularyprovider',
	'faceted-datatable'
], function (
		$,
		ko,
		template,
		VocabularyAPI) {
	
	function MappedConcepts(params) {
		var self = this;
		
		self.conceptSet = ko.pureComputed(function () {
			return ko.toJS(params.conceptSet().expression);	
		});

		self.isLoading = ko.observable(true);
		
		self.selectedConcepts = ko.observableArray();

		self.selectedConceptsIndex = ko.pureComputed(function () {
			var index = {};
			self.selectedConcepts().forEach(function (item) {
				index[item.CONCEPT_ID] = 1;	
			});
			return index;
		});
		
		self.mappedConcepts = ko.observableArray();
		if (params.widget)
			params.widget(self);
		
		self.facetOptions = {
			Facets: [
				{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				},
				{
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				},
				{
					'caption': 'Domain',
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
				},
				{
					'caption': 'Standard Concept',
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
				},
				{
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
				},
				{
					'caption': 'Has Records',
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT.toString().replace(',', '')) > 0;
					}
				},
				{
					'caption': 'Has Descendant Records',
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT.toString().replace(',', '')) > 0;
					}
				}
			]
		};

		self.tableColumns = [
			{
				title: '<i class="fa fa-shopping-cart"></i>',
				render: function (s, p, d) {
					var css = '';
					var icon = 'fa-shopping-cart';

					if (self.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
						css = ' selected';
					}
					return '<i class="fa ' + icon + ' ' + css + '"></i>';
				},
				orderable: false,
				searchable: false
			},
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
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<span class="' + valid + '">' + d.CONCEPT_NAME + '</span>';
				}
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
				title: 'RC',
				data: 'RECORD_COUNT',
				className: 'numeric'
			},
			{
				title: 'DRC',
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			},
			{
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
			}
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
				VocabularyAPI.getMappedConceptsById(identifiers).then(function (concepts) {
					concepts.forEach(function (concept) {
						concept.RECORD_COUNT = 'timeout';
						concept.DESCENDANT_RECORD_COUNT = 'timeout';
					});
					self.mappedConcepts(concepts);
				})
				.fail(function (err) {
					console.log("lookupByIds failed: " + err);
				})
				.always(function () {
					self.isLoading(false);
				});
			})
			.fail(function (err) {
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
		viewModel: MappedConcepts,
		template: template
	};
});