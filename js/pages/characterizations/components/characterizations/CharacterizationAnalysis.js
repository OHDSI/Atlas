define(function(require, exports){

	const ko = require('knockout');
	const ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');
	const CriteriaGroup = require('components/cohortbuilder/CriteriaGroup');

	class CharacterizationAnalysis {
		constructor(design) {
			let data = design || {};

			Object.assign(this, data);
			this.name = ko.observable(data.name || 'New Characterization');
			this.cohorts = ko.observableArray(data.cohorts);
			this.featureAnalyses = ko.observableArray(data.featureAnalyses);
			this.parameters = ko.observableArray(data.parameters);
			this.strataConceptSets = ko.observableArray((data.strataConceptSets && data.strataConceptSets.map(cs => new ConceptSet(cs))) || []);
			this.strataOnly = ko.observable(data.strataOnly);
			this.stratas = ko.observableArray((data.stratas && data.stratas.map(s => ({
				id: ko.observable(s.id),
				name: ko.observable(s.name),
				criteria: ko.observable(new CriteriaGroup(s.criteria, this.strataConceptSets)),
			}))) || []);
		}
	}

	return CharacterizationAnalysis;

});