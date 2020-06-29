define([
	'knockout',
	'text!./conceptset-editor.html',
	'atlas-state',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/ConceptSet',
	'databindings',
	'bootstrap',
	'faceted-datatable'
], function (
	ko,
	view,
	sharedState,
	Component,
	AutoBind,
	commonUtils,
	conceptSetService,
) {
	class ConceptSetEditor extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.conceptSetName = ko.observable();
			this.conceptSets = params.$raw.conceptSets();
			this.conceptSetId = params.$raw.conceptSetId;
			this.currentConceptSetSource = params.currentConceptSetSource;
			console.log(params);
			this.selectedConcepts = sharedState[`${this.currentConceptSetSource}ConceptSet`].selectedConcepts;
			this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.commonUtils = commonUtils;
			this.columns = [
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

		renderLink(s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		toggleCheckbox(d, field) {
			commonUtils.toggleConceptSetCheckbox(
				this.canEditCurrentConceptSet,
				this.selectedConcepts,
				d,
				field,
				() => conceptSetService.resolveConceptSetExpression({ source: this.currentConceptSetSource }),
			);
		  }

		  renderCheckbox(field) {
			return commonUtils.renderConceptSetCheckbox(this.canEditCurrentConceptSet, field);
		}
	}

	return commonUtils.build('conceptset-editor', ConceptSetEditor, view);
});
