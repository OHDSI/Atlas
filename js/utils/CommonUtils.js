define([
		'knockout',
		'atlas-state',
		'appConfig',
		'pages/Page',
		'services/MomentAPI',
		'urijs',
	  'const'
	],
	(
		ko,
		sharedState,
		appConfig,
		Page,
		momentApi,
		URI,
		constants
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

	function highlightRow(row, cssClass) {
		$(row).addClass(cssClass);
	}

	function hasCDM(source) {
		return source.daimons.find(daimon => daimon.daimonType == 'CDM') !== undefined;
	}

	function hasResults(source) {
		return source.daimons.find(daimon => daimon.daimonType == 'Results') !== undefined;
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
			const concept = selectedConcepts()[d.idx];
			if (!!concept) {
				concept[field](!concept[field]());
				if (successFunction && typeof successFunction === 'function') {
					successFunction();
				}
			}
		}
	}

	const selectAllFilteredItems = (data, filteredData, value) => {
		const fData = (ko.utils.unwrapObservable(filteredData) || []).map(i => i.id);
		data().forEach(i => {
			if (fData.length === 0) {
				i.selected(value);
			} else {
				if (fData.includes(i.id)) {
					i.selected(value);
				}
			}
		});
	}
	const escapeTooltip = function(tooltipText) {
		return tooltipText.replace(/'/g, "\\'").replace(/"/g, '&quot;');
	}

	const getSelectedConcepts = (conceptList) => {
		return ko.unwrap(conceptList).filter(concept => concept.isSelected()).map(({ isSelected, ...concept }) => ({
			...concept
		}));
	}
	
	const buildConceptSetItems = (concepts, options) => {
		return concepts.map((concept) => ({
			concept: concept,
			...ko.toJS(options)
		}));
	}

	const clearConceptsSelectionState = concepts => ko.unwrap(concepts).forEach(concept => concept.isSelected && concept.isSelected(false));
		
	const getUniqueIdentifier = () => {
		return ([1e7]+1e3+4e3+8e3+1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15 >> c/4).toString(16));
	}
		
	const isNameLengthValid = function(name) {
		return name.length <= constants.maxEntityNameLength;
	}

	const isNameCharactersValid = function(name) {
		const forbiddenSymbols = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
		return !forbiddenSymbols.some(symbol => name.includes(symbol));
	}

	const formatDateForAuthorship = (date, format = momentApi.DESIGN_DATE_TIME_FORMAT) => {
		const d = ko.unwrap(date);
		return d ? momentApi.formatDateTimeWithFormat(d, format) : '';
	}

	const getTableOptions = (variant = 'M') => {
		const { commonDataTableOptions: opts } = appConfig;
		return Object.keys(opts).reduce((p, c) => ({
			...p, 
			[c]: opts[c][variant],
		}), {});
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
		renderLink,
		renderBoundLink,
		renderHierarchyLink,
		syntaxHighlight,
		getPathwaysUrl,
		normalizeUrl,
		toggleConceptSetCheckbox,
		selectAllFilteredItems,
		escapeTooltip,
		highlightRow,
		buildConceptSetItems,
		getSelectedConcepts,
		getUniqueIdentifier,
		clearConceptsSelectionState,
		formatDateForAuthorship,
		isNameCharactersValid,
		isNameLengthValid,
		getTableOptions,
	};
});