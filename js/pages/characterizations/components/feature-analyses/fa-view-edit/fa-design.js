define([
	'knockout',
	'text!./fa-design.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'components/cohortbuilder/CriteriaGroup',
	'components/cohortbuilder/AdditionalCriteria',
	'components/cohortbuilder/WindowedCriteria',
	'components/cohortbuilder/CriteriaTypes/DemographicCriteria',
	'components/cohortbuilder/const',
	'components/cohortbuilder/utils',
	'../../../utils',
	'components/multi-select',
	'less!./fa-design.less',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	CriteriaGroup,
	AdditionalCriteria,
	WindowedCriteria,
	DemographicGriteria,
	cohortbuilderConsts,
	cohortbuilderUtils,
	utils,
) {

	class FeatureAnalysisDesign extends AutoBind(Component){

		constructor(params) {
			super(params);
			this.data = params.data;
			this.featureId = params.featureId;
			this.dataDirtyFlag = params.dataDirtyFlag;
			this.canEdit = params.canEdit;
			this.domains = params.domains;
			this.featureTypes = params.featureTypes;
			this.statTypeOptions = params.statTypeOptions;
			this.setType = params.setType;
			this.getEmptyCriteriaFeatureDesign = params.getEmptyCriteriaFeatureDesign;
			this.getEmptyWindowedCriteria = params.getEmptyWindowedCriteria;
			this.formatCriteriaOption = cohortbuilderUtils.formatDropDownOption;

			// Concept set import for criteria
			this.criteriaContext = ko.observable();
			this.showConceptSetBrowser = ko.observable();
		}

		getEmptyDemographicCriteria() {
			return {
				name: ko.observable(''),
				criteriaType: 'DemographicCriteria',
				expression: ko.observable(new DemographicGriteria()),
			};
		}

		addCriteria() {
			this.data().design([...this.data().design(), this.getEmptyCriteriaFeatureDesign()]);
		}

		addWindowedCriteria(type) {
			const criteria = type === cohortbuilderConsts.CriteriaTypes.DEMOGRAPHIC ? this.getEmptyDemographicCriteria() : this.getEmptyWindowedCriteria(type);
			this.data().design([...this.data().design(), criteria]);
		}

		removeCriteria(index) {
			const criteriaList = this.data().design();
			criteriaList.splice(index, 1);
			this.data().design(criteriaList);
		}

		handleConceptSetImport(criteriaIdx, item) {
			this.criteriaContext({...item, criteriaIdx});
			this.showConceptSetBrowser(true);
		}

		onRespositoryConceptSetSelected(conceptSet, source) {
			utils.conceptSetSelectionHandler(this.data().conceptSets, this.criteriaContext(), conceptSet, source)
				.done(() => this.showConceptSetBrowser(false));
		}
	}

	return commonUtils.build('feature-analysis-design', FeatureAnalysisDesign, view);
});