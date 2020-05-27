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
					title: ko.i18n('columns.conceptId', 'Concept Id'),
					data: 'concept.CONCEPT_ID',
					className: this.classes('col-id')
				},
				{
					title: ko.i18n('columns.conceptName', 'Concept Name'),
					data: 'concept.CONCEPT_NAME',
					className: this.classes('col-name')
				},
				{
					title: ko.i18n('columns.domain', 'Domain'),
					data: 'concept.DOMAIN_ID',
					className: this.classes('col-domain')
				},
				{
					title: ko.i18n('columns.vocabulary', 'Vocabulary'),
					data: 'concept.VOCABULARY_ID',
					className: this.classes('col-vocab')
				},
				{
					title: ko.i18n('columns.excluded', 'Excluded'),
					render: (s, p, d) => d.isExcluded() ? 'YES' : 'NO',
					className: this.classes('col-excluded')
				},
				{
					title: ko.i18n('columns.descendants', 'Descendants'),
					render: (s, p, d) => d.includeDescendants() ? 'YES' : 'NO',
					className: this.classes('col-desc')
				},
				{
					title: ko.i18n('columns.mapped', 'Mapped'),
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