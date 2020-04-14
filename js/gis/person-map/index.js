define(['./component.js'], (component) => {
	document.dispatchEvent(new CustomEvent('registerAtlasPlugin', { detail: {
		type: component.element.TYPE,
		plugin: {
			title: component.element.TITLE,
			html: `<${component.name} data-bind="attr: { 'data-personid': $data.personId, 'data-sourcekey': $data.sourceKey, 'data-startdate': $data.startDate, 'data-enddate': $data.endDate }"></${component.name}>`
		}
	}}));
});