define([
	'knockout',
	'text!./conceptset-editor.html',
	'atlas-state',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/Renderers',
	'services/ConceptSet',
	'databindings',
	'bootstrap',
	'faceted-datatable',
	'components/conceptLegend/concept-legend',
], function (
	ko,
	view,
	sharedState,
	Component,
	AutoBind,
	commonUtils,
	renderers,
	conceptSetService,
) {
	class ConceptSetEditor extends AutoBind(Component) {
		constructor(params) {
			super(params);
			//this.conceptSetName = ko.observable();
			this.conceptSetItems = params.conceptSetItems;
			//this.conceptSetId = params.$raw.conceptSetId;
			//this.currentConceptSetSource = params.currentConceptSetSource;
			//this.selectedConcepts = sharedState[`${this.currentConceptSetSource}ConceptSet`].selectedConcepts;
			this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.commonUtils = commonUtils;
			this.columns = [
				{ title: '', orderable: false, render: () => renderers.renderCheckbox('isSelected', this.canEditCurrentConceptSet()) },
				{ title: 'Concept Id', data: 'concept.CONCEPT_ID'},
				{ title: 'Concept Code', data: 'concept.CONCEPT_CODE'},
				{ title: 'Concept Name', render: commonUtils.renderBoundLink},
				{ title: 'Domain', data: 'concept.DOMAIN_ID' },
				{ title: 'Standard Concept Code', data: 'concept.STANDARD_CONCEPT', visible:false },
				{ title: 'Standard Concept Caption', data: 'concept.STANDARD_CONCEPT_CAPTION' },
				{ title: 'Exclude', class:'text-center', orderable:false,render: () => this.renderCheckbox('isExcluded') },
				{ title: 'Descendants', class:'text-center', orderable:false, searchable:false, render: () => this.renderCheckbox('includeDescendants') },
				{ title: 'Mapped', class:'text-center', orderable:false, searchable:false, render: () => this.renderCheckbox('includeMapped') }
]
		}

		renderCheckbox(field) {
			return renderers.renderConceptSetCheckbox(this.canEditCurrentConceptSet, field);
		}
	}

	return commonUtils.build('conceptset-editor', ConceptSetEditor, view);
});
