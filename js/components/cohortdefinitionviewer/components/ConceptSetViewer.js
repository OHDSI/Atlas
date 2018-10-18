define([
	'knockout',
	'text!./ConceptSetViewerTemplate.html',
	'components/Component',
	'less!./ConceptSetViewer.less'
], function (
	ko,
	template,
	Component
) {

	class ConceptSetViewer extends Component {
		constructor(params) {
			super(params);
			this.data = params.conceptSet.expression.items;
			this.columns = [
				{
					title: 'Concept Id',
					data: 'concept.CONCEPT_ID',
					className: this.classes('col-id')
				},
				{
					title: 'Concept Name',
					data: 'concept.CONCEPT_NAME',
					className: this.classes('col-name')
				},
				{
					title: 'Domain',
					data: 'concept.DOMAIN_ID',
					className: this.classes('col-domain')
				},
				{
					title: 'Vocabulary',
					data: 'concept.VOCABULARY_ID',
					className: this.classes('col-vocab')
				},
				{
					title: 'Excluded',
					render: (s, p, d) => d.isExcluded() ? 'YES' : 'NO',
					className: this.classes('col-excluded')
				},
				{
					title: 'Descendants',
					render: (s, p, d) => d.includeDescendants() ? 'YES' : 'NO',
					className: this.classes('col-desc')
				},
				{
					title: 'Mapped',
					render: (s, p, d) => d.includeMapped() ? 'YES' : 'NO',
					className: this.classes('col-mapped')
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