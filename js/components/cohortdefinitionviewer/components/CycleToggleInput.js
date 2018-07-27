define(['knockout', 'components/cohortbuilder/components/CycleToggleInput', 'text!./CycleToggleInputTemplate.html'], function (ko, viewModel, template) {
	// reuse CycleToggleInput module from cohortBuilder, and use the read-only view template.
	return {
		viewModel: viewModel,
		template: template
	};
});