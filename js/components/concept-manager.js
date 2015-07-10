define(['knockout', 'text!./concept-manager.html'], function (ko, view) {
	function conceptManager(params) {
		var self = this;
		self.model = params.model;
		self.currentConceptId = params.currentConceptId;

		self.currentConceptId.subscribe(function (conceptId) {
			self.loadConcept(conceptId);
		});

		self.loadConcept = function (conceptId) {
			self.model.currentView('loading');

			var conceptPromise = $.ajax({
				url: self.model.vocabularyUrl() + 'concept/' + conceptId,
				method: 'GET',
				contentType: 'application/json',
				success: function (c, status, xhr) {
					var exists = false;
					for (i = 0; i < self.model.recentConcept().length; i++) {
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
					self.model.currentView('concept');
				},
				error: function () {
					alert('An error occurred while attempting to load the concept from your currently configured provider.  Please check the status of your selection from the configuration button in the top right corner.');
				}
			});

			// load related concepts once the concept is loaded
			self.model.loadingRelated(true);
			var relatedPromise = $.Deferred();

			$.when(conceptPromise).done(function () {
				metarchy = {
					parents: ko.observableArray(),
					children: ko.observableArray(),
					synonyms: ko.observableArray()
				};

				$.getJSON(self.model.vocabularyUrl() + 'concept/' + conceptId + '/related', function (related) {
					self.model.relatedConcepts(related);

					var feTemp = new FacetEngine({
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
									for (i = 0; i < o.RELATIONSHIPS.length; i++) {
										values.push(o.RELATIONSHIPS[i].RELATIONSHIP_NAME);
									}
									return values;
								}
							},
							{
								'caption': 'Distance',
								'binding': function (o) {
									values = [];
									for (i = 0; i < o.RELATIONSHIPS.length; i++) {
										if (values.indexOf(o.RELATIONSHIPS[i].RELATIONSHIP_DISTANCE) == -1) {
											values.push(o.RELATIONSHIPS[i].RELATIONSHIP_DISTANCE);
										}
									}
									return values;
								}
							}
						]
					});

					for (c = 0; c < related.length; c++) {
						feTemp.Process(related[c]);
						self.metagorize(metarchy, related[c]);
					}

					self.metarchy = metarchy;

					feTemp.MemberSortFunction = function () {
						return this.ActiveCount;
					};
					feTemp.sortFacetMembers();

					self.model.feRelated(feTemp);
					self.model.relatedConcepts(self.model.feRelated().GetCurrentObjects());
					relatedPromise.resolve();
				});
			});

			$.when(relatedPromise).done(function () {
				self.model.loadingRelated(false);
			});

			// triggers once our async loading of the concept and related concepts is complete
			$.when(conceptPromise).done(function () {
				self.model.currentView('concept');
			});
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
		}

		self.metatrix = {
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
				childRelationships: [],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 999]
		}],
				synonymRelationships: []
			},
			'CPT4.CPT4 Hierarchy': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 999]
		}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 999]
		}]
			},
			'ETC.ETC': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 999]
		}, {
					name: 'Inferred drug class of (OMOP)',
					range: [0, 999]
		}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 999]
		}, {
					name: 'Has ancestor of',
					range: [0, 999]
		}]
			},
			'MedDRA.LLT': {
				childRelationships: [],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 1]
		}, {
					name: 'Is a',
					range: [0, 1]
		}]
			},
			'MedDRA.PT': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 999]
		}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 999]
		}]
			},
			'MedDRA.HLT': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 999]
		}],
				parentRelationships: [{
					name: 'Has ancestor of',
					range: [0, 999]
		}]
			},
			'MedDRA.SOC': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 999]
		}],
				parentRelationships: []
			},
			'MedDRA.HLGT': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 999]
		}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 999]
		}]
			},
			'SNOMED.Clinical Finding': {
				childRelationships: [{
					name: 'Subsumes',
					range: [0, 999]
		}],
				parentRelationships: [{
					name: 'Is a',
					range: [0, 999]
		}, {
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
	}

	var component = {
		viewModel: conceptManager,
		template: view
	};

	ko.components.register('concept-manager', component);
	return component;
});
