define(function(){

	function renderCheckbox(field) {
		return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } , css: { selected: ' + field + '}" class="fa fa-check"></span>';
	}

	return {
		renderCheckbox,
	};
});