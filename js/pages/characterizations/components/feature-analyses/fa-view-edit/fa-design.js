define([
	'knockout',
	'text!./fa-design.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/Clipboard',
	'components/cohortbuilder/CriteriaGroup',
	'components/cohortbuilder/AdditionalCriteria',
	'components/cohortbuilder/WindowedCriteria',
	'components/cohortbuilder/CriteriaTypes/DemographicCriteria',
	'components/cohortbuilder/const',
	'components/cohortbuilder/utils',
	'components/conceptset/utils',
	'pages/characterizations/const',
	'components/multi-select',
	'../components/aggregate-select',
	'less!./fa-design.less',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	Clipboard,
	CriteriaGroup,
	AdditionalCriteria,
	WindowedCriteria,
	DemographicGriteria,
	cohortbuilderConsts,
	cohortbuilderUtils,
	conceptSetUtils,
	constants,
) {

	class FeatureAnalysisDesign extends AutoBind(Clipboard(Component)){

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
			this.demoCustomSqlAnalysisDesign = constants.demoCustomSqlAnalysisDesign;
			this.loadConceptSet = params.loadConceptSet;
			this.defaultAggregate = params.defaultAggregate;
			this.aggregates = params.aggregates;

			this.conceptSets = ko.pureComputed({
					read: () => params.data() && params.data().conceptSets || [],
					write: (value) => params.data().conceptSets(value),
			});

			this.windowedActions = Object.keys(cohortbuilderConsts.windowedAttributes).map(a => {
				return {...cohortbuilderConsts.windowedAttributes[a], action: this.buildAddCriteriaAction(cohortbuilderConsts.CriteriaTypes[a]) }
			});

			// Concept set import for criteria
			this.criteriaContext = ko.observable();
			this.showConceptSetBrowser = ko.observable();
		}

		getEmptyDemographicCriteria() {
			return {
				name: ko.observable(''),
				criteriaType: 'DemographicCriteria',
				aggregate: ko.observable(ko.unwrap(this.defaultAggregate)),
				expression: ko.observable(new DemographicGriteria()),
			};
		}

		addCriteria() {
			this.data().design([...this.data().design(), this.getEmptyCriteriaFeatureDesign()]);
		}

		buildAddCriteriaAction(type) {
			return () => this.addWindowedCriteria(type);
		}

		addWindowedCriteria(type) {
			const criteria = type === cohortbuilderConsts.CriteriaTypes.addDemographic ? this.getEmptyDemographicCriteria() : this.getEmptyWindowedCriteria(type);
			this.data().design([...this.data().design(), criteria]);
		}

		removeCriteria(index) {
			const criteriaList = this.data().design();
			criteriaList.splice(index, 1);
			this.data().design(criteriaList);
		}

		handleConceptSetImport(item, context, event) {
			this.criteriaContext(item);
			this.showConceptSetBrowser(true);
		}
		
		handleEditConceptSet(item, context) {
			if (item.conceptSetId() == null) {
				return;
			}
			this.loadConceptSet(item.conceptSetId());
		}		

		onRespositoryConceptSetSelected(conceptSet, source) {
			conceptSetUtils.conceptSetSelectionHandler(this.coceptSets(), this.criteriaContext(), conceptSet, source)
				.done(() => this.showConceptSetBrowser(false));
		}
		
		onRespositoryActionComplete(result) {
			this.showConceptSetBrowser(false);
			if (result.action === 'add') {
				const newId = conceptSetUtils.newConceptSetHandler(this.conceptSets(), this.criteriaContext());
				this.loadConceptSet(newId)
			}

			this.criteriaContext(null);
		}	

		copyAnalysisSQLTemplateToClipboard() {
			this.copyToClipboard('#btnCopyAnalysisSQLTemplateClipboard', '#copyAnalysisSQLTemplateMessage');
		}
	}

	return commonUtils.build('feature-analysis-design', FeatureAnalysisDesign, view);
});