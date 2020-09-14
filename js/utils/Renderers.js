define([
	'knockout',
], (
	ko,
) => {

	const renderCheckbox = (field, clickable = true) => {
		return `<span data-bind="${clickable ? `click: function(d) { d.${field}(!d.${field}()); },` : ''} css: { selected: ${field} }" class="fa fa-check"></span>`;
	}

	const renderConceptSetCheckbox = (hasPermissions, field, readonly = false) => {
		return ko.unwrap(hasPermissions) && !readonly
			? `<span data-bind="click: function(d) { d.${field}(!d.${field}()); }, css: { selected: ${field} }" class="fa fa-check"></span>`
			: `<span data-bind="css: { selected: ${field}}" class="fa fa-check readonly"></span>`;
	}

	return {
		renderCheckbox,
		renderConceptSetCheckbox
	};
});