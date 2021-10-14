define(function (require) {

	var ko = require('knockout');
	var constants = require('const');
	var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');
	var CriteriaGroup = require('components/cohortbuilder/CriteriaGroup');

	class Reusable {
		constructor(d) {
			let data = d || {};
			Object.assign(this, data);
			this.name = ko.observable(data.name || ko.unwrap(constants.newEntityNames.reusable));
			this.data = JSON.parse(data.data) || {};
			this.conceptSets = ko.observableArray(this.data.conceptSets && this.data.conceptSets.map(function(d) { return new ConceptSet(d) }));
			this.expression = new CriteriaGroup(this.data.expression, this.conceptSets);
			this.description = ko.observable(data.description || null);
			this.tags = ko.observableArray(data.tags);
		}

	}
	return Reusable;
});
