define(['knockout', 'text!./concept-manager.html', 'appConfig', 'vocabularyprovider', 'atlas-state', 'faceted-datatable'], function (ko, view, config, vocabAPI, sharedState) {
	function conceptManager(params) {
		var self = this;
		self.model = params.model;
		self.subscriptions = [];

		self.sourceCounts = ko.observableArray();
		self.loadingSourceCounts = ko.observable(false);
		self.loadingRelated = ko.observable(false);

		self.currentConceptId = params.model.currentConceptId;

		self.subscriptions.push(
			self.currentConceptId.subscribe(function (value) {
				if (self.model.currentConceptMode() == 'recordcounts') {
					self.loadRecordCounts();
				}
				self.loadConcept(value);
			})
		);

		self.subscriptions.push(
			self.model.currentConceptMode.subscribe(function (mode) {
				switch (mode) {
					case 'recordcounts':
						self.loadRecordCounts();
						break;
				}
			})
		);

		self.relatedConceptsOptions = {
			Facets: [{
				'caption': 'Vocabulary',
				'binding': function (o) {
					return o.VOCABULARY_ID;
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
				'caption': 'Relationship',
				'binding': function (o) {
					return $.map(o.RELATIONSHIPS, function (val) {
						return val.RELATIONSHIP_NAME
					});
				},
				isArray: true,
			}, {
				'caption': 'Has Records',
				'binding': function (o) {
					return parseInt(o.RECORD_COUNT.toString().replace(',', '')) > 0;
				}
			}, {
				'caption': 'Has Descendant Records',
				'binding': function (o) {
					return parseInt(o.DESCENDANT_RECORD_COUNT.toString().replace(',', '')) > 0;
				}
			}, {
				'caption': 'Distance',
				'binding': function (o) {
					return Math.max.apply(Math, o.RELATIONSHIPS.map(function (d) {
						return d.RELATIONSHIP_DISTANCE;
					}))
				},
			}]
		};

		self.relatedConceptsColumns = [{
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
			title: 'Distance',
			data: function (d) {
				return Math.max.apply(Math, d.RELATIONSHIPS.map(function (o) {
					return o.RELATIONSHIP_DISTANCE;
				}))
			}
		}, {
			title: 'Domain',
			data: 'DOMAIN_ID'
		}, {
			title: 'Vocabulary',
			data: 'VOCABULARY_ID'
		}];

		self.loadRecordCounts = function () {
			self.loadingSourceCounts(true);
			var sources = config.api.sources;

			var allCounts = $.Deferred();
			var totalCounts = 0;
			var completedCounts = 0;
			var sourceData = [];

			for (var i = 0; i < sources.length; i++) {
				if (sources[i].hasResults) {
					totalCounts++;
				}
			};

			for (var i = 0; i < sources.length; i++) {
				if (sources[i].hasResults) {
					var source = sources[i];
					$.ajax({
						url: source.resultsUrl + 'conceptRecordCount',
						method: 'POST',
						source: source,
						contentType: 'application/json',
						data: JSON.stringify([self.currentConceptId()]),
						success: function (data) {
							completedCounts++;
							var recordCountObject = Object.values(data[0])[0];
							if (recordCountObject) {
								sourceData.push({
									sourceName: this.source.sourceName,
									recordCount: recordCountObject[0],
									descendantRecordCount: recordCountObject[1]
								});
							}

							if (completedCounts == totalCounts) {
								allCounts.resolve();
							}
						},
						error: function (data) {
							completedCounts++;

							if (completedCounts == totalCounts) {
								allCounts.resolve();
							}
						}
					});
				}
			}

			$.when(allCounts).done(function () {
				self.loadingSourceCounts(false);
				self.sourceCounts(sourceData);
			});
		}

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

		self.metagorize = function (metarchy, related) {
			var concept = self.model.currentConcept();
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
		self.currentConceptArray = ko.observableArray();

		self.loadConcept = function (conceptId) {
			var conceptPromise = $.ajax({
				url: sharedState.vocabularyUrl() + 'concept/' + conceptId,
				method: 'GET',
				contentType: 'application/json',
				success: function (c, status, xhr) {
					var exists = false;
					for (var i = 0; i < self.model.recentConcept().length; i++) {
						if (self.model.recentConcept()[i].CONCEPT_ID == c.CONCEPT_ID)
							exists = true;
					}
					if (!exists) {
						self.model.recentConcept.unshift(c);
					}
					if (self.model.recentConcept().length > 7) {
						self.model.recentConcept.pop();
					}
					self.model.currentConcept(c);
				}
			});
			// load related concepts once the concept is loaded
			self.loadingRelated(true);
			var relatedPromise = $.Deferred();
			$.when(conceptPromise).done(function () {
				self.metarchy = {
					parents: ko.observableArray(),
					children: ko.observableArray(),
					synonyms: ko.observableArray()
				};
				$.ajax({
					url: sharedState.vocabularyUrl() + 'concept/' + conceptId + '/related',
					method: 'GET',
					contentType: 'application/json',
					success: function (related) {
						for (var i = 0; i < related.length; i++) {
							self.metagorize(self.metarchy, related[i]);
						}
						var densityPromise = vocabAPI.loadDensity(related);
						$.when(densityPromise).done(function () {
							var currentConceptObject = _.find(related, c => c.CONCEPT_ID == self.currentConceptId());
							self.currentConceptArray.push(currentConceptObject);
							self.model.relatedConcepts(related);
							relatedPromise.resolve();
						});
					}
				});
			});
			$.when(relatedPromise).done(function () {
				self.loadingRelated(false);
			});
		};

		self.loadConcept(self.model.currentConceptId());

		self.dispose = function () {
			self.subscriptions.forEach(function (subscription) {
				subscription.dispose();
			});
		};
	}

	var component = {
		viewModel: conceptManager,
		template: view
	};

	ko.components.register('concept-manager', component);
	return component;
});
