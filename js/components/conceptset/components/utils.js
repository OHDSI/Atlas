define([
	'knockout',
	'atlas-state',
	'services/ConceptSet',
], function(
	ko,
	sharedState,
	conceptSetService,
){

	const applyFilter = function(data, filter) {
		if (data.filtered.length === 0) {
			delete filter[data.facet.field];
		} else {
			filter[data.facet.field] = data.filtered.map(f => f.key);
		}
	};

	const loadFacets = function(facets, url) {
		const expression = {
			items: sharedState.selectedConcepts(),
		};
		const columns = facets.map(f => ({columnName: f.field, computed: f.computed}));
		return conceptSetService.loadFacets({columns, expression,}, url);
	};

	const getExpression = function(data, filter, facets) {
		const f = filter || {};
		const fa = facets || [];
		const expression = {
			items: sharedState.selectedConcepts(),
		};
		const filters = Object.keys(f).map(key => ({
			columnName: key,
			computed: (fa.find(f => f.field === key) || { computed: false}).computed,
			values: f[key],
		}));
		return ko.toJSON({
			...data,
			expression,
			filters,
		});
	};

	return {
		applyFilter,
		loadFacets,
		getExpression,
	};
});