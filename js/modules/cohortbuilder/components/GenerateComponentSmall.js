define(['knockout', 'circe/components/GenerateComponent', 'text!./GenerateComponentSmallTemplate.html'], function (ko, generateComponent, template) {
	
	// return compoonent definition
	return {
		viewModel: generateComponent.viewModel,
		template: template
	};
});