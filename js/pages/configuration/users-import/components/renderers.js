define(['require'], function(require){

	function renderCheckbox(field) {
		return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } , css: { selected: ' + field + '}" class="fa fa-check"></span>';
	}

	return {
		renderCheckbox,
	};
});