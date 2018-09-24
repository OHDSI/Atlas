define(
	(require, factory) => {
		const ko = require('knockout');
		const sharedState = require('atlas-state');
		const Page = require('providers/Page');
		
		const build = function(name, viewModelClass, template) {
			const component = {
				viewModel: {
					createViewModel: (params, info) => {
						const vm = new viewModelClass(params, info);
						if (vm instanceof Page) {
							vm.onPageCreated();
						}

						return vm;
					},
				},
				template,
			};
			viewModelClass.prototype.componentName = name;
		
			ko.components.register(name, component);
			return component;
		};

        const routeTo = function (path) {
            document.location = '#' + path;
        };

		// service methods for model

		function hasRelationship(concept, relationships) {
			for (var r = 0; r < concept.RELATIONSHIPS.length; r++) {
				for (var i = 0; i < relationships.length; i++) {
					if (concept.RELATIONSHIPS[r].RELATIONSHIP_NAME == relationships[i].name) {
						if (concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE >= relationships[i].range[0] && concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE <= relationships[i].range[1]) {
							if (relationships[i].vocabulary) {
								for (var v = 0; v < relationships[i].vocabulary.length; v++) {
									if (relationships[i].vocabulary[v] == concept.VOCABULARY_ID) {
										return true;
									}
								}
							} else {
								return true;
							}
						}
					}
				}
			}
			return false;
		}

		function contextSensitiveLinkColor (row, data) {
			var switchContext;
			if (data.STANDARD_CONCEPT == undefined) {
				switchContext = data.concept.STANDARD_CONCEPT;
			} else {
				switchContext = data.STANDARD_CONCEPT;
			}
			switch (switchContext) {
				case 'N':
					$('a', row)
						.css('color', '#a71a19');
					break;
				case 'C':
					$('a', row)
						.css('color', '#a335ee');
					break;
			}
		}

		function hasCDM(source) {
			return source.daimons.find(daimon => daimon.daimonType == 'CDM') !== undefined;
		}

		function hasResults(source) {
			return source.daimons.find(daimon => daimon.daimonType == 'Results') !== undefined;
		}

		function renderConceptSetItemSelector(s, p, d) {
			let css = '';
			let tag = 'i';
			if (sharedState.selectedConceptsIndex[d.concept.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			if (!this.canEditCurrentConceptSet()) {
				css += ' readonly';
				tag = 'span'; // to avoid call to 'click' event handler which is bound to <i> tag
			}
			return '<' + tag + ' class="fa fa-shopping-cart' + css + '"></' + tag + '>';
		}

		function renderLink(s, p, d) {
			var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
			return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
		}

		function renderBoundLink(s, p, d) {
			return '<a href=\"#/concept/' + d.concept.CONCEPT_ID + '\">' + d.concept.CONCEPT_NAME + '</a>';
		}

		const renderConceptSelector = function(s, p, d) {
			var css = '';
			var icon = 'fa-shopping-cart';
			if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa ' + icon + ' ' + css + '"></i>';
		}

		const renderHierarchyLink = function (d) {
			var valid = d.INVALID_REASON_CAPTION == 'Invalid' || d.STANDARD_CONCEPT != 'S' ? 'invalid' : '';
			return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
		}

		const createConceptSetItem = function (concept) {
			var conceptSetItem = {};
			conceptSetItem.concept = concept;
			conceptSetItem.isExcluded = ko.observable(false);
			conceptSetItem.includeDescendants = ko.observable(false);
			conceptSetItem.includeMapped = ko.observable(false);
			return conceptSetItem;
		}

		const syntaxHighlight = function (json) {
			if (typeof json != 'string') {
				json = JSON.stringify(json, undefined, 2);
			}
			json = json.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
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
		}

		return {
			build,
            routeTo,
			hasRelationship,
			contextSensitiveLinkColor,
			hasCDM,
			hasResults,
			renderConceptSetItemSelector,
			renderLink,
			renderBoundLink,
			renderConceptSelector,
			renderHierarchyLink,
			createConceptSetItem,
			syntaxHighlight,
		};
	}
);