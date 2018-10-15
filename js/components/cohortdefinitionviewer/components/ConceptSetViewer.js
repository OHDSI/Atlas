define(['knockout','text!./ConceptSetViewerTemplate.html'], function (ko, template) {

	class ConceptSetViewer {
		constructor(params) {
			this.data = params.conceptSet.expression.items;
			this.columns = [
				{
					title: 'Concept Id',
					data: 'concept.CONCEPT_ID'
				},
				{
					title: 'Concept Name',
					data: 'concept.CONCEPT_NAME'
				},
				{
					title: 'Domain',
					data: 'concept.DOMAIN_ID'
				},
				{
					title: 'Vocabulary',
					data: 'concept.VOCABULARY_ID'
				},
				{
					title: 'Excluded',
					render: (s, p, d) => d.isExcluded() ? 'YES' : 'NO'
				},
				{
					title: 'Descendants',
					render: (s, p, d) => d.includeDescendants() ? 'YES' : 'NO'
				},
				{
					title: 'Mapped',
					render: (s, p, d) => d.includeMapped() ? 'YES' : 'NO'
				}
			];
		}
	}
	
	// return compoonent definition
	return {
		viewModel: ConceptSetViewer,
		template: template
	};
});