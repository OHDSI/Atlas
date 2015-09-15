define([
	'jquery',
	'knockout',
	'jnj_chart',
	'd3',
	'bootstrap',
	'facets',
	'knockout-persist'
], function ($, ko, jnj_chart, d3) {
	var appModel = function () {
		var self = this;
		$.support.cors = true;
		$('#querytext').focus();

		self.appInitializationFailed = ko.observable(false);
		self.initPromises = [];

		self.applicationStatus = ko.observable('initializing');
		self.minibar = ko.observable(false);

		// change timeouts after code complete
		self.initComplete = function () {
			self.router.init('/');
			self.applicationStatus('running');
			setTimeout(function () {
				$('#splash').hide();
			}, 0);

			setTimeout(function () {
				$('#wrapperLeftMenu').fadeIn();
				$('#wrapperMainWindow').fadeIn();
			}, 10);
		}

		self.loadConcept = function (conceptId) {
			self.currentView('loading');

			var conceptPromise = $.ajax({
				url: self.vocabularyUrl() + 'concept/' + conceptId,
				method: 'GET',
				contentType: 'application/json',
				success: function (c, status, xhr) {
					var exists = false;
					for (var i = 0; i < self.recentConcept().length; i++) {
						if (self.recentConcept()[i].CONCEPT_ID == c.CONCEPT_ID)
							exists = true;
					}
					if (!exists) {
						self.recentConcept.unshift(c);
					}
					if (self.recentConcept().length > 7) {
						self.recentConcept.pop();
					}

					self.currentConcept(c);
					self.currentView('concept');
				},
				error: function () {
					alert('An error occurred while attempting to load the concept from your currently configured provider.  Please check the status of your selection from the configuration button in the top right corner.');
				}
			});

			// load related concepts once the concept is loaded
			self.loadingRelated(true);
			self.loadingSourcecodes(true);
			var relatedPromise = $.Deferred();
			var sourcecodesPromise = $.Deferred();

			$.when(conceptPromise).done(function () {
				self.metarchy = {
					parents: ko.observableArray(),
					children: ko.observableArray(),
					synonyms: ko.observableArray()
				};

				// load mapped 
				var identifiers = [];
				identifiers.push(conceptId);
				$.ajax({
					url: self.vocabularyUrl() + 'lookup/mapped',
					method: 'POST',
					data: JSON.stringify(identifiers),
					contentType: 'application/json',
					success: function (sourcecodes) {
						self.relatedSourcecodes(sourcecodes);
						sourcecodesPromise.resolve();
						self.loadingSourcecodes(false);
					}
				});

				$.ajax({
					url: self.vocabularyUrl() + 'concept/' + conceptId + '/related',
					method: 'GET',
					contentType: 'application/json',
					success: function (related) {
						for (var i = 0; i < related.length; i++) {
							self.metagorize(self.metarchy, related[i]);
						}
						var densityPromise = self.loadDensity(related);

						$.when(densityPromise).done(function () {
							self.relatedConcepts(related);
							relatedPromise.resolve();
						});
					}
				});

			});

			$.when(relatedPromise).done(function () {
				self.loadingRelated(false);
			});

			// triggers once our async loading of the concept and related concepts is complete
			$.when(conceptPromise).done(function () {
				self.currentView('concept');
			});
		}

		self.metagorize = function (metarchy, related) {
			var concept = self.currentConcept();
			var key = concept.VOCABULARY_ID + '.' + concept.CONCEPT_CLASS_ID;
			if (self.metatrix[key] != undefined) {
				var meta = self.metatrix[key];
				if (self.hasRelationship(related, meta.childRelationships)) {
					metarchy.children.push(related);
				}
				if (self.hasRelationship(related, meta.parentRelationships)) {
					metarchy.parents.push(related);
				}
			}
		}

		self.searchConceptsOptions = {
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
					'caption': 'Has Data',
					'binding': function (o) {
						return o.DENSITY > 0;
					}
						}
					]
		};

		self.relatedConceptsOptions = {
			Facets: [
				{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
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
					'caption': 'Relationship',
					'binding': function (o) {
						values = [];
						for (var i = 0; i < o.RELATIONSHIPS.length; i++) {
							values.push(o.RELATIONSHIPS[i].RELATIONSHIP_NAME);
						}
						return values;
					}
				},
				{
					'caption': 'Has Data',
					'binding': function (o) {
						return o.DENSITY > 0;
					}
				},
				{
					'caption': 'Distance',
					'binding': function (o) {
						values = [];
						for (var i = 0; i < o.RELATIONSHIPS.length; i++) {
							if (values.indexOf(o.RELATIONSHIPS[i].RELATIONSHIP_DISTANCE) == -1) {
								values.push(o.RELATIONSHIPS[i].RELATIONSHIP_DISTANCE);
							}
						}
						return values;
					}
							}
						]
		};

		self.searchConceptsColumns = [
			{
				title: '',
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
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				},
				width: '50%'
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
				title: 'Record Count',
				data: 'DENSITY',
				className: 'numeric'
			},
			{
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
				data: 'VOCABULARY_ID',
				width: '100px'
			}
		];

		self.relatedConceptsColumns = [
			{
				title: '',
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
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
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
				title: 'Record Count',
				data: 'DENSITY',
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

		self.relatedSourcecodesColumns = [
			{
				title: '',
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
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
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
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
				data: 'VOCABULARY_ID',
				width: '100px'
			}
		];

		self.relatedSourcecodesOptions = {
			Facets: [
				{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				},
				{
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
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
				}
			]
		};

		self.metatrix = {
			'ICD9CM.5-dig billing code': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 1]
				}]
			},
			'ICD9CM.4-dig nonbill code': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 1]
				}, {
					name: 'Non-standard to Standard map (OMOP)',
					range: [0, 1]
				}]
			},
			'ICD9CM.3-dig nonbill code': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Non-standard to Standard map (OMOP)',
					range: [0, 999]
				}]
			},
			'RxNorm.Ingredient': {
				childRelationships: [{
					name: 'Ingredient of (RxNorm)',
					range: [0, 999]
				}],
				parentRelationships: [{
					name: 'Has inferred drug class (OMOP)',
					range: [0, 999]
				}]
			},
			'RxNorm.Brand Name': {
				childRelationships: [{
					name: 'Ingredient of (RxNorm)',
					range: [0, 999]
				}],
				parentRelationships: [{
					name: 'Tradename of (RxNorm)',
					range: [0, 999]
				}]
			},
			'RxNorm.Branded Drug': {
				childRelationships: [{
					name: 'Consists of (RxNorm)',
					range: [0, 999]
				}],
				parentRelationships: [{
					name: 'Has ingredient (RxNorm)',
					range: [0, 999]
				}, {
					name: 'RxNorm to ATC (RxNorm)',
					range: [0, 999]
				}, {
					name: 'RxNorm to ETC (FDB)',
					range: [0, 999]
				}]
			},
			'RxNorm.Clinical Drug Comp': {
				childRelationships: [],
				parentRelationships: [{
					name: 'Has precise ingredient (RxNorm)',
					range: [0, 999]
				}, {
					name: 'Has ingredient (RxNorm)',
					range: [0, 999]
				}]
			},
			'CPT4.CPT4': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'CPT4.CPT4 Hierarchy': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'ETC.ETC': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.LLT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.PT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.HLT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.SOC': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'MedDRA.HLGT': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'SNOMED.Clinical Finding': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			},
			'SNOMED.Procedure': {
				childRelationships: [{
					name: 'Has descendant of',
					range: [0, 1]
				}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
				}]
			}
		};

		self.hasRelationship = function (concept, relationships) {
			for (var r = 0; r < concept.RELATIONSHIPS.length; r++) {
				for (var i = 0; i < relationships.length; i++) {
					if (concept.RELATIONSHIPS[r].RELATIONSHIP_NAME == relationships[i].name) {
						if (concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE >= relationships[i].range[0] && concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE <= relationships[i].range[1]) {
							return true;
						}
					}
				}
			}
			return false;
		}

		self.meetsRequirements = function (concept, requirements) {
			var passCount = 0;

			for (var r = 0; r < requirements.length; r++) {
				for (var f = 0; f < this.fe.Facets.length; f++) {
					if (this.fe.Facets[f].caption == requirements[r].c) {
						for (var m = 0; m < this.fe.Facets[f].Members.length; m++) {
							if (this.fe.Facets[f].Members[m].Name == requirements[r].n) {
								passCount++;
							}
						}
					}
				}
			}

			if (filters.length == requirements.length) {
				return true;
			} else {
				return false;
			}
		}

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

		self.hasCDM = function (source) {
			for (var d = 0; d < source.daimons.length; d++) {
				if (source.daimons[d].daimonType == 'CDM') {
					return true;
				}
			}
			return false;
		}

		self.hasResults = function (source) {
			for (var d = 0; d < source.daimons.length; d++) {
				if (source.daimons[d].daimonType == 'Results') {
					return true;
				}
			}
			return false;
		}

		self.renderConceptSetItemSelector = function (s, p, d) {
			var css = '';
			if (pageModel.selectedConceptsIndex[d.concept.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa fa-shopping-cart' + css + '"></i>';
		}

		self.renderLink = function (s, p, d) {
			var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
			return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
		}

		self.renderBoundLink = function (s, p, d) {
			return '<a href=\"#/concept/' + d.concept.CONCEPT_ID + '\">' + d.concept.CONCEPT_NAME + '</a>';
		}

		self.resolveConceptSetExpression = function () {
			self.resolvingConceptSetExpression(true);
			
			var conceptSetExpression = '{"items" :' + ko.toJSON(self.selectedConcepts()) + '}';
			var highlightedJson = self.syntaxHighlight(conceptSetExpression);
			self.currentConceptSetExpressionJson(highlightedJson);

			$.ajax({
				url: self.vocabularyUrl() + 'resolveConceptSetExpression',
				data: conceptSetExpression,
				method: 'POST',
				contentType: 'application/json',
				success: function (info) {
					var identifiers = info;
					self.resolvingSourcecodes(true);
					$.ajax({
						url: self.vocabularyUrl() + 'lookup/mapped',
						data: JSON.stringify(identifiers),
						method: 'POST',
						contentType: 'application/json',
						success: function (sourcecodes) {
							self.sourcecodeInclusionCount(sourcecodes.length);
							self.includedSourcecodes(sourcecodes);
							self.resolvingSourcecodes(false);
						}
					});

					self.conceptSetInclusionIdentifiers(info);
					self.currentIncludedConceptIdentifierList(info.join(','));
					self.conceptSetInclusionCount(info.length);
					self.resolvingConceptSetExpression(false);
				},
				error: function (err) {
					self.currentView('configure');
					self.resolvingConceptSetExpression(false);
				}
			});
		};

		self.renderCheckbox = function (field) {
			return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); pageModel.resolveConceptSetExpression(); } ,css: { selected: ' + field + '} " class="glyphicon glyphicon-ok"></span>';
		}

		self.loadingSourcecodes = ko.observable(false);
		self.loadingRelated = ko.observable(false);
		self.loadingEvidence = ko.observable(false);
		self.loadingReport = ko.observable(false);
		self.loadingReportDrilldown = ko.observable(false);

		self.activeReportDrilldown = ko.observable(false);

		self.cohortAnalyses = ko.observableArray();
		self.currentReport = ko.observable();
		self.reports = ko.observableArray([
			'Person',
			'Cohort Specific',
			'Condition Eras',
			'Conditions by Index',
			'Drugs by Index',
			'Procedures by Index',
			'Observation Periods',
			'Condition',
			'Drug Eras',
			'Drug Exposure',
			'Procedure',
			'Death'
		]);

		self.getSourceInfo = function (source) {
			var info = pageModel.currentCohortDefinitionInfo();
			for (var i = 0; i < info.length; i++) {
				if (info[i].id.sourceId == source.sourceId) {
					return info[i];
				}
			}
		}

		self.getCohortCount = function (source) {
			var sourceKey = source.sourceKey;
			var cohortDefinitionId = pageModel.currentCohortDefinition().id;
			return $.ajax(pageModel.services()[0].url + sourceKey + '/cohortresults/' + cohortDefinitionId + '/distinctPersonCount', {});
		}

		self.getCompletedAnalyses = function (source) {
			var cohortDefinitionId = pageModel.currentCohortDefinition().id;

			$.ajax(pageModel.services()[0].url + source.sourceKey + '/cohortresults/' + cohortDefinitionId + '/analyses', {
				success: function (analyses) {
					sourceAnalysesStatus = {};

					// initialize cohort analyses status
					for (var i = 0; i < pageModel.cohortAnalyses().length; i++) {
						sourceAnalysesStatus[pageModel.cohortAnalyses()[i].name] = 0;
					}

					// capture statistics on the number of each analysis type that was completed
					for (var a = 0; a < analyses.length; a++) {
						var analysisType = pageModel.analysisLookup[analyses[a]];
						sourceAnalysesStatus[analysisType] = sourceAnalysesStatus[analysisType] + 1;
					}
					sourceAnalysesStatus.ready = true;
					pageModel.sourceAnalysesStatus[source.sourceKey](sourceAnalysesStatus);
				}
			});
		}

		self.loadConceptSet = function (conceptSetId) {
			$('body').removeClass('modal-open');
			
			self.currentView('loading');

			self.currentConceptSet(null);
			self.selectedConcepts([]);
			self.selectedConceptsIndex = {};
			
			$.ajax({
				url: self.services()[0].url + 'conceptset/' + conceptSetId,
				method: 'GET',
				contentType: 'application/json',
				success: function (conceptset) {
					$.ajax({
						url: self.services()[0].url + 'conceptset/' + conceptSetId + '/expression',
						method: 'GET',
						contentType: 'application/json',
						success: function (expression) {
							for (var i = 0; i < expression.items.length; i++) {
								var conceptSetItem = expression.items[i];
								conceptSetItem.isExcluded = ko.observable(conceptSetItem.isExcluded);
								conceptSetItem.includeDescendants = ko.observable(conceptSetItem.includeDescendants);
								conceptSetItem.includeMapped = ko.observable(conceptSetItem.includeMapped);
								self.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID] = 1;								
								self.selectedConcepts.push(conceptSetItem);
							}

							self.analyzeSelectedConcepts();							
							pageModel.currentConceptSetMode('details');
							pageModel.currentView('conceptset');
							pageModel.currentConceptSet(conceptset);
						}
					});
				}
			});
		}

		self.loadCohortDefinition = function (cohortDefinitionId) {
			self.currentView('loading');

			var definitionPromise = $.ajax({
				url: self.services()[0].url + 'cohortdefinition/' + cohortDefinitionId,
				method: 'GET',
				contentType: 'application/json',
				success: function (cohortDefinition) {
					self.currentCohortDefinition(cohortDefinition);
				}
			});

			var infoPromise = $.ajax({
				url: self.services()[0].url + 'cohortdefinition/' + cohortDefinitionId + '/info',
				method: 'GET',
				contentType: 'application/json',
				success: function (generationInfo) {
					self.currentCohortDefinitionInfo(generationInfo);
				}
			});

			$.when(infoPromise, definitionPromise).done(function (ip, dp) {
				// now that we have required information lets compile them into data objects for our view
				var cdmSources = self.services()[0].sources.filter(self.hasCDM);
				var results = [];

				for (var s = 0; s < cdmSources.length; s++) {
					var source = cdmSources[s];

					self.sourceAnalysesStatus[source.sourceKey] = ko.observable({
						ready: false,
						checking: false
					});

					var sourceInfo = self.getSourceInfo(source);
					var cdsi = {};
					cdsi.name = cdmSources[s].sourceName;

					if (sourceInfo != null) {
						cdsi.isValid = sourceInfo.isValid;
						cdsi.status = sourceInfo.status;
						var date = new Date(sourceInfo.startTime);
						cdsi.startTime = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
						cdsi.executionDuration = (sourceInfo.executionDuration / 1000) + 's'
						cdsi.distinctPeople = self.asyncComputed(self.getCohortCount, this, source);
					} else {
						cdsi.isValid = false;
						cdsi.status = 'n/a';
						cdsi.startTime = 'n/a';
						cdsi.executionDuration = 'n/a';
						cdsi.distinctPeople = 'n/a';
					}

					results.push(cdsi);
				}

				self.cohortDefinitionSourceInfo(results);

				// load universe of analyses
				var analysesPromise = $.ajax({
					url: self.services()[0].url + 'cohortanalysis/',
					method: 'GET',
					contentType: 'application/json',
					success: function (analyses) {
						var index = {};
						var nestedAnalyses = [];

						for (var a = 0; a < analyses.length; a++) {
							var analysis = analyses[a];

							if (index[analysis.analysisType] == undefined) {
								var analysisType = {
									name: analysis.analysisType,
									analyses: []
								};
								nestedAnalyses.push(analysisType);
								index[analysis.analysisType] = nestedAnalyses.indexOf(analysisType);
							}
							self.analysisLookup[analysis.analysisId] = analysis.analysisType;
							nestedAnalyses[index[analysis.analysisType]].analyses.push(analysis);
						}

						self.cohortAnalyses(nestedAnalyses);

						// obtain completed result status for each source
						for (var s = 0; s < cdmSources.length; s++) {
							var source = cdmSources[s];
							var info = self.getSourceInfo(source);
							if (info) {
								var sourceAnalysesStatus = {};
								sourceAnalysesStatus.checking = true;
								self.sourceAnalysesStatus[source.sourceKey](sourceAnalysesStatus);
								self.getCompletedAnalyses(source);
							}
						}
					}
				});

				self.currentView('cohortdefinition');
			});
		}

		self.asyncComputed = function (evaluator, owner, args) {
			var result = ko.observable('<i class="fa fa-refresh fa-spin"></i>');

			ko.computed(function () {
				evaluator.call(owner, args).done(result);
			});

			return result;
		}

		self.loadDensity = function (results) {
			var densityPromise = $.Deferred();

			// nothing to look up
			if (results.length == 0) {
				densityPromise.resolve();
				return densityPromise;
			}

			var searchResultIdentifiers = [];
			for (c = 0; c < results.length; c++) {
				searchResultIdentifiers.push(results[c].CONCEPT_ID);
			}

			var densityIndex = {};

			$.ajax({
				url: self.resultsUrl() + 'conceptDensity',
				method: 'POST',
				contentType: 'application/json',
				timeout: 10000,
				data: JSON.stringify(searchResultIdentifiers),
				success: function (entries) {
					for (var e = 0; e < entries.length; e++) {
						densityIndex[entries[e].key] = entries[e].value;
					}

					for (var c = 0; c < results.length; c++) {
						var concept = results[c];
						if (densityIndex[concept.CONCEPT_ID] != undefined) {
							concept.DENSITY = densityIndex[concept.CONCEPT_ID];
						} else {
							concept.DENSITY = 0;
						}
					}

					densityPromise.resolve();
				},
				error: function (error) {
					for (var c = 0; c < results.length; c++) {
						var concept = results[c];
						concept.DENSITY = 'timeout';
					}
					densityPromise.resolve();
				}
			});

			return densityPromise;
		}

		self.reportCohortDefinitionId = ko.observable();
		self.reportReportName = ko.observable();
		self.reportSourceKey = ko.observable();
		self.reportValid = ko.computed(function () {
			return (self.reportReportName() != undefined && self.reportSourceKey() != undefined && self.reportCohortDefinitionId() != undefined && !self.loadingReport() && !self.loadingReportDrilldown());
		}, this);
		self.jobs = ko.observableArray();
		self.sourceAnalysesStatus = {};
		self.analysisLookup = {};
		self.cohortDefinitionSourceInfo = ko.observableArray();
		self.recentSearch = ko.observableArray(null);
		self.recentConcept = ko.observableArray(null);
		self.currentSearch = ko.observable();
		self.currentView = ko.observable('splash');
		self.conceptSetInclusionIdentifiers = ko.observableArray();
		self.currentConceptSetExpressionJson = ko.observable();
		self.currentConceptIdentifierList = ko.observable();
		self.currentConceptSet = ko.observable();
		self.currentIncludedConceptIdentifierList = ko.observable();
		self.searchResultsConcepts = ko.observableArray();
		self.relatedConcepts = ko.observableArray();
		self.relatedSourcecodes = ko.observableArray();
		self.importedConcepts = ko.observableArray();
		self.includedConcepts = ko.observableArray();
		self.denseSiblings = ko.observableArray();
		self.includedSourcecodes = ko.observableArray();
		self.cohortDefinitions = ko.observableArray();
		self.currentCohortDefinition = ko.observable();
		self.currentCohortDefinitionInfo = ko.observable();
		self.feasibilityId = ko.observable();
		self.resolvingConceptSetExpression = ko.observable();
		self.resolvingSourcecodes = ko.observable();
		self.evidence = ko.observableArray();
		self.services = ko.observableArray([
			/*
			{
				name: 'HixBeta Multihomed',
				url: 'http://hixbeta.jnj.com:8081/WebAPI/'
			},
			*/
			{
				name: 'Local',
				url: 'http://localhost:8080/WebAPI/'
			},
			{
				name: 'OHDSI Public',
				url: 'http://api.ohdsi.org/WebAPI/'
			}
		]);
		self.initializationErrors = 0;
		self.vocabularyUrl = ko.observable();
		self.evidenceUrl = ko.observable();
		self.resultsUrl = ko.observable();
		self.currentConcept = ko.observable();
		self.currentConceptId = ko.observable();
		self.currentConceptMode = ko.observable('details');
		self.currentConceptMode.subscribe(function (newMode) {
			switch (newMode) {
			case 'evidence':
				// load evidence
				self.loadingEvidence(true);
				var evidencePromise = $.ajax({
					url: self.evidenceUrl() + self.currentConcept().CONCEPT_ID,
					method: 'GET',
					contentType: 'application/json',
					success: function (evidence) {
						self.evidence(evidence);
						self.loadingEvidence(false);

						var evidenceData = [];
						var evidenceSource = {
							name: 'source',
							values: []
						};
						evidenceData.push(evidenceSource);
						var evidenceCount = 0;
						for (var i = 0; i < evidence.length; i++) {
							if (evidence[i].evidenceType == 'MEDLINE_MeSH_CR') {
								var e = {
									evidenceType: evidence[i].evidenceType,
									label: evidence[i].drugName,
									xValue: evidenceCount++,
									yValue: evidence[i].value
								};
								evidenceSource.values.push(e);
							}
						}

						var scatter = new jnj_chart.scatterplot();
						scatter.render(evidenceData, "#conceptEvidenceScatter", 460, 150, {
							yFormat: d3.format('0'),
							xValue: "xValue",
							yValue: "yValue",
							xLabel: "Drugs",
							yLabel: "Raw Value",
							seriesName: "evidenceType",
							showLegend: false,
							tooltips: [{
								label: 'Drug',
								accessor: function (o) {
									return o.label;
								}
						}, {
								label: 'Raw Value',
								accessor: function (o) {
									return o.yValue;
								}
						}],
							colors: d3.scale.category10(),
							showXAxis: false
						});
					},
					error: function () {
						self.loadingEvidence(false);
					}
				});
				break;
			}
		});

		self.renderCurrentConceptSelector = function () {
			var css = '';
			if (self.selectedConceptsIndex[self.currentConcept().CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa fa-shopping-cart' + css + '"></i>';
		};

		self.renderConceptSelector = function (s, p, d) {
			var css = '';
			var icon = 'fa-shopping-cart';

			if (self.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa ' + icon + ' ' + css + '"></i>';
		}

		self.currentConceptSetMode = ko.observable('details');
		self.currentImportMode = ko.observable('identifiers');
		self.feRelated = ko.observable();
		self.feSearch = ko.observable();
		self.metarchy = {};
		self.selectedConcepts = ko.observableArray(null); //.extend({ persist: 'atlas.selectedConcepts' });
		self.selectedConceptsWarnings = ko.observableArray();
		self.checkCurrentSource = function (source) {
			return source.url == self.curentVocabularyUrl();
		};

		self.clearConceptSet = function () {
			self.currentConceptSet(null);
			self.selectedConcepts([]);
			self.selectedConceptsIndex = {};
			self.analyzeSelectedConcepts();
			self.resolveConceptSetExpression();
			document.location = '#/conceptset';
		}

		self.renderHierarchyLink = function (d) {
			var valid = d.INVALID_REASON_CAPTION == 'Invalid' || d.STANDARD_CONCEPT != 'S' ? 'invalid' : '';
			return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
		};
		self.loadJobs = function () {
			$.ajax({
				url: self.services()[0].url + 'job/execution?comprehensivePage=true',
				method: 'GET',
				contentType: 'application/json',
				success: function (jobs) {
					for (var j = 0; j < jobs.content.length; j++) {
						var startDate = new Date(jobs.content[j].startDate);
						jobs.content[j].startDate = startDate.toLocaleDateString() + ' ' + startDate.toLocaleTimeString();

						var endDate = new Date(jobs.content[j].endDate);
						jobs.content[j].endDate = endDate.toLocaleDateString() + ' ' + endDate.toLocaleTimeString();

						if (jobs.content[j].jobParameters.jobName == undefined) {
							jobs.content[j].jobParameters.jobName = 'n/a';
						}
					}
					self.jobs(jobs.content);
					self.currentView('jobs');
				}
			});
		};
		self.analyzeSelectedConcepts = function () {
			self.selectedConceptsWarnings.removeAll();
			var domains = [];
			var standards = [];
			var includeNonStandard = false;

			for (var i = 0; i < self.selectedConcepts().length; i++) {
				var domain = self.selectedConcepts()[i].concept.DOMAIN_ID;
				var standard = self.selectedConcepts()[i].concept.STANDARD_CONCEPT_CAPTION;

				if (standard != 'Standard') {
					includeNonStandard = true;
				}

				var index;

				index = $.inArray(domain, domains);
				if (index < 0) {
					domains.push(domain);
				}

				index = $.inArray(standard, standards);
				if (index < 0) {
					standards.push(standard);
				}

			}

			if (domains.length > 1) {
				self.selectedConceptsWarnings.push('Your saved concepts come from multiple Domains (' + domains.join(', ') + ').  A useful set of concepts will typically all come from the same Domain.');
			}

			if (standards.length > 1) {
				self.selectedConceptsWarnings.push('Your saved concepts include different standard concept types (' + standards.join(', ') + ').  A useful set of concepts will typically all be of the same standard concept type.');
			}

			if (includeNonStandard) {
				self.selectedConceptsWarnings.push('Your saved concepts include Non-Standard or Classification concepts.  Typically concept sets should only include Standard concepts unless advanced use of this concept set is planned.');
			}
		};
		self.selectedConceptsIndex = {};
		self.createConceptSetItem = function (concept) {
			var conceptSetItem = {};

			conceptSetItem.concept = concept;
			conceptSetItem.isExcluded = ko.observable(false);
			conceptSetItem.includeDescendants = ko.observable(false);
			conceptSetItem.includeMapped = ko.observable(false);
			return conceptSetItem;
		};
		self.conceptSetInclusionCount = ko.observable(0);
		self.sourcecodeInclusionCount = ko.observable(0);

		self.syntaxHighlight = function (json) {
			if (typeof json != 'string') {
				json = JSON.stringify(json, undefined, 2);
			}
			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			});
		};

		self.updateSearchFilters = function () {
			$(event.target).toggleClass('selected');

			var filters = [];
			$('#wrapperSearchResultsFilter .facetMemberName.selected').each(function (i, d) {
				filters.push(d.id);
			});
			self.feSearch().SetFilter(filters);
			// update filter data binding
			self.feSearch(self.feSearch());
			// update table data binding
			self.searchResultsConcepts(self.feSearch().GetCurrentObjects());
		};

		self.selectConcept = function (concept) {
			document.location = '#/concept/' + concept.CONCEPT_ID;
		};
	}
	return appModel;
});