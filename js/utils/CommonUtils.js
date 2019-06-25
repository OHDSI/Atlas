define([
		'knockout',
		'atlas-state',
		'pages/Page',
		'urijs',
	],
	(
		ko,
		sharedState,
		Page,
		URI,
	) => {

	const build = function (name, viewModelClass, template) {
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

	function getConceptLinkClass(data) {
		var switchContext;
		if (data.STANDARD_CONCEPT === undefined) {
			switchContext = data.concept.STANDARD_CONCEPT;
		} else {
			switchContext = data.STANDARD_CONCEPT;
		}
		switch (switchContext) {
			case 'N':
				return "non-standard";
			case 'C':
				return "classification";
			case 'S':
				return 'standard';
		}

	}

	function contextSensitiveLinkColor(row, data) {
		$('a', row)
			.addClass(getConceptLinkClass(data));
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
		var linkClass = getConceptLinkClass(d);
		return p === 'display'
			? '<a class="' + valid + ' ' + linkClass + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>'
			: d.CONCEPT_NAME;
	}

	function renderBoundLink(s, p, d) {
		return renderLink(s, p, d.concept);
	}

	const renderConceptSelector = function (s, p, d) {
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

    const renderConceptSetCheckbox = function(hasPermissions, field) {
		return hasPermissions()
		  ? `<span data-bind="click: d => $component.toggleCheckbox(d, '${field}'), css: { selected: ${field} }" class="fa fa-check"></span>`
		  : `<span data-bind="css: { selected: ${field}}" class="fa fa-check readonly"></span>`;
	}

	const createConceptSetItem = function (concept) {
		var conceptSetItem = {};
		conceptSetItem.concept = {
			"CONCEPT_ID": concept.CONCEPT_ID,
			"CONCEPT_NAME": concept.CONCEPT_NAME,
			"STANDARD_CONCEPT": concept.STANDARD_CONCEPT,
			"STANDARD_CONCEPT_CAPTION": concept.STANDARD_CONCEPT_CAPTION,
			"INVALID_REASON": concept.INVALID_REASON,
			"INVALID_REASON_CAPTION": concept.INVALID_REASON_CAPTION,
			"CONCEPT_CODE": concept.CONCEPT_CODE,
			"DOMAIN_ID": concept.DOMAIN_ID,
			"VOCABULARY_ID": concept.VOCABULARY_ID,
			"CONCEPT_CLASS_ID": concept.CONCEPT_CLASS_ID
		};
		conceptSetItem.isExcluded = ko.observable(false);
		conceptSetItem.includeDescendants = ko.observable(false);
		conceptSetItem.includeMapped = ko.observable(false);
		return conceptSetItem;
	}

	const syntaxHighlight = function (json) {
		if (typeof json != 'string') {
			json = ko.toJSON(json, undefined, 2);
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

	const getPathwaysUrl = (id, section) => `/pathways/${id}/${section}`;

	async function confirmAndDelete({ loading, remove, redirect, message = 'Are you sure?' } = {}) {
		if (confirm(message)) {
			loading(true);
			await remove();
			loading(false);
			redirect();
		}
	}

	const normalizeUrl = (...parts) => URI(parts.join('/')).normalizePathname().toString();

	const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
	const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

	const toggleConceptSetCheckbox = function(hasPermissions, selectedConcepts, d, field, successFunction) {
		if (hasPermissions()) {
			const concept = selectedConcepts().find(i => !!i.concept && !!d.concept && i.concept.CONCEPT_ID === d.concept.CONCEPT_ID);
			if (!!concept) {
				concept[field](!concept[field]());
				successFunction();
			  }
		}
	}


	return {
		build,
		confirmAndDelete,
		cartesian,
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
		renderConceptSetCheckbox,
		createConceptSetItem,
		syntaxHighlight,
		getPathwaysUrl,
		normalizeUrl,
		toggleConceptSetCheckbox
	};
});