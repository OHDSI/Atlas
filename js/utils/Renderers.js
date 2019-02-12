define(function(){

	function renderCheckbox(field, clickable = true) {
		return `<span data-bind="${clickable ? `click: function(d) { d.${field}(!d.${field}()); },` : '' } css: { selected: ${field} }" class="fa fa-check"></span>`;
	}

	return {
		renderCheckbox,
	};
});