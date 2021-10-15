define(function (require) {

	var ko = require('knockout');
	var constants = require('const');
	var ReusableParameter = require('./ReusableParameter');
	var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');
	var CriteriaGroup = require('components/cohortbuilder/CriteriaGroup');

	class Reusable {
		constructor(d) {
			let data = d || {};
			Object.assign(this, data);
			this.name = ko.observable(data.name || ko.unwrap(constants.newEntityNames.reusable));
			this.description = ko.observable(data.description || null);
			this.data = data.data ? JSON.parse(data.data) : {};
			this.parameters = ko.observableArray(this.data.parameters && this.data.parameters.map((p) => new ReusableParameter(p)));
			this.conceptSets = ko.observableArray(this.data.conceptSets && this.data.conceptSets.map((d) => new ConceptSet(d)));
			this.expression = new CriteriaGroup(this.data.expression, this.conceptSets);
			this.tags = ko.observableArray(data.tags);
		}
	}

	return Reusable;
});
