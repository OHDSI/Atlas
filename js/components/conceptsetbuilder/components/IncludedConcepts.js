define([
	'jquery',
	'knockout',
	'text!./IncludedConcepts.html',
	'services/VocabularyProvider',
	'utils/CommonUtils',
	'const',
	'atlas-state',
	'faceted-datatable'
], function (
		$,
		ko,
		template,
		VocabularyAPI,
		commonUtils,
		globalConstants,
		sharedState) {

	function IncludedConcepts(params) {

		var self = this;

		self.conceptSet = ko.pureComputed(function () {
			return ko.toJS(params.conceptSet().expression);
		});
		self.canEdit = params.canEdit;

		self.isLoading = ko.observable(true);

		self.selectedConcepts = ko.observableArray();

		self.selectedConceptsIndex = ko.pureComputed(function () {
			var index = {};
			self.selectedConcepts().forEach(function (item) {
				index[item.CONCEPT_ID] = 1;
			});
			return index;
		});

		self.includedConcepts = ko.observableArray();
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
						return parseInt(o.RECORD_COUNT) > 0;
					}
				},
				{
					'caption': 'Has Descendant Records',
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
					}
				}
			]
		};

		self.tableColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit });

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