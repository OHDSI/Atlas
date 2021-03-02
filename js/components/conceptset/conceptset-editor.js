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
			this.conceptSetItems = params.conceptSetItems;
			this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.commonUtils = commonUtils;
			this.columns = [
				{ title: '', orderable: false, render: () => renderers.renderCheckbox('isSelected', this.canEditCurrentConceptSet()) },
				{ title: ko.i18n('columns.conceptId', 'Concept Id'), data: 'concept.CONCEPT_ID'},
				{ title: ko.i18n('columns.conceptCode', 'Concept Code'), data: 'concept.CONCEPT_CODE'},
				{ title: ko.i18n('columns.conceptName', 'Concept Name'), render: commonUtils.renderBoundLink},
				{ title: ko.i18n('columns.domain', 'Domain'), data: 'concept.DOMAIN_ID' },
				{ title: ko.i18n('columns.standardConceptCode', 'Standard Concept Code'), data: 'concept.STANDARD_CONCEPT', visible:false },
				{ title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'), data: 'concept.STANDARD_CONCEPT_CAPTION' },
				{ title: ko.i18n('columns.exclude', 'Exclude'), class: 'text-center', orderable: false, render: () => this.renderCheckbox('isExcluded') },
				{ title: ko.i18n('columns.descendants', 'Descendants'), class: 'text-center', orderable: false, searchable: false, render: () => this.renderCheckbox('includeDescendants') },
				{ title: ko.i18n('columns.mapped', 'Mapped'), class: 'text-center', orderable: false, searchable: false, render: () => this.renderCheckbox('includeMapped') }
			];

			// header state
			this.conceptsForRemovalLength = ko.pureComputed(() => this.conceptSetItems().filter(row => row.isSelected()).length);
			this.areAllItemsCheckedForRemoval = ko.pureComputed(() => this.conceptsForRemovalLength() === this.conceptSetItems().length);
      this.allExcludedChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.isExcluded()) === undefined;
      });
      this.allDescendantsChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.includeDescendants()) === undefined;
      });
      this.allMappedChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.includeMapped()) === undefined;
      });

			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
		}

		renderCheckbox(field) {
			return renderers.renderConceptSetCheckbox(this.canEditCurrentConceptSet, field);
		}

    toggleExcluded() {
      this.selectAllConceptSetItems('isExcluded', this.allExcludedChecked());
    }

    toggleDescendants() {
      this.selectAllConceptSetItems('includeDescendants', this.allDescendantsChecked());
    }

    toggleMapped() {
      this.selectAllConceptSetItems('includeMapped', this.allMappedChecked());
    }

    toggleSelectedItemsForRemoval() {
        const areAllItemsCheckedForRemoval = this.areAllItemsCheckedForRemoval();
        this.conceptSetItems().forEach(item => item.isSelected(!areAllItemsCheckedForRemoval));
		}

    selectAllConceptSetItems(key, areAllSelected) {
      if (!this.canEditCurrentConceptSet()) {
        return;
      }
      this.conceptSetItems().forEach(conceptSetItem => {
        conceptSetItem[key](!areAllSelected);
      })
    }

	}

	return commonUtils.build('conceptset-editor', ConceptSetEditor, view);
});
