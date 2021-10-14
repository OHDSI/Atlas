define([
	'knockout',
	'text!./reusable-design.html',
	'components/Component',
	'utils/CommonUtils',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'components/conceptset/ConceptSetStore',
	'components/conceptset/utils',
	'components/cohortbuilder/CriteriaGroup',
	'less!./reusable-design.less',
	'databindings'
], function (
	ko,
	view,
	Component,
	commonUtils,
	ConceptSet,
	ConceptSetStore,
	conceptSetUtils,
	CriteriaGroup
) {
	class ReusableEditor extends Component {
		constructor(params) {
			super();
			this.params = params;
			this.design = params.design;
			this.designId = params.designId;
			this.isEditPermitted = params.isEditPermitted;
			this.canEditName = params.isEditPermitted();

			this.showConceptSetBrowser = ko.observable(false);
			this.criteriaContext = ko.observable();
			this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().reusables);
			this.criteriaGroup = ko.observable(this.design().expression);

			this.handleConceptSetImport = (item) => {
				this.criteriaContext(item);
				this.showConceptSetBrowser(true);
			}

			this.handleEditConceptSet = (item, context) => {
				if (item.conceptSetId() == null) {
					return;
				}
				this.loadConceptSet(item.conceptSetId());
			}

			this.loadConceptSet = (conceptSetId) => {
				this.conceptSetStore.current(this.design().conceptSets().find(item => item.id === conceptSetId));
				this.conceptSetStore.isEditable(this.isEditPermitted());
				commonUtils.routeTo(`/reusables/${this.designId()}/conceptsets`);
			}

			this.onConceptSetSelectAction = (result) => {
				this.showConceptSetBrowser(false);
				if (result.action === 'add') {
					const conceptSets = this.design().conceptSets;
					const newId = conceptSetUtils.newConceptSetHandler(conceptSets, this.criteriaContext());
					this.loadConceptSet(newId)
				}

				this.criteriaContext(null);
			}
		}
	}

	return commonUtils.build('reusable-design', ReusableEditor, view);
});
