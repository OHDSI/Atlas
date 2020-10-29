define([
	'knockout',
	'text!./aggregate-select.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'lodash',
	'../../../services/FeatureAnalysisService',
	'../const',
	'less!./aggregate-select.less',
], function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	lodash,
	FeatureAnalysisService,
	consts,
) {

	const CriteriaDomains = [
		{
			type: 'Measurement',
			domains: ['MEASUREMENT']
		},
		{
			type: 'DrugEra',
			domains: ['DRUG_ERA']
		},
		{
			type: 'DrugExposure',
			domains: ['DRUG']
		},
		{
			type: 'VisitOccurrence',
			domains: ['VISIT']
		},
        {
            type: 'ProcedureOccurrence',
            domains: ['PROCEDURE']
        },
        {
            type: 'Observation',
            domains: ['OBSERVATION']
        },
        {
            type: 'ConditionEra',
            domains: ['CONDITION_ERA']
        },
			{
					type: 'ConditionOccurrence',
					domains: ['CONDITION']
			}
	];

	class AggregateSelector extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.criteria = params.criteria;
			this.aggregate = params.currentAggregate || ko.observable();
			this.aggregates = ko.computed(() => ((params.aggregates && params.aggregates()) || [])
				.filter(a => a.value === consts.ANY_DOMAIN || this.criteria.criteriaType === "DemographicCriteria"
					|| this.getCriteriaDomains(this.criteria).find(d => d === a.value)));
			this.domains = params.domains;
		}

		selectAggregate(item) {
			this.aggregate(item);
		}

		getCriteriaDomains(criteria) {
			if (criteria.criteriaType === 'WindowedCriteria') {
				return CriteriaDomains.filter(d => criteria.expression().Criteria.hasOwnProperty(d.type)).flatMap(d => d.domains) || [];
			}
			return [];
		}
	}

	return commonUtils.build('aggregate-select', AggregateSelector, view);
});