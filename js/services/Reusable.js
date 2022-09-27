define(function (require) {

    var ko = require('knockout');
    var constants = require('const');
    var ReusableParameter = require('../pages/reusables/ReusableParameter');
    var ConceptSet = require('components/conceptset/InputTypes/ConceptSet');
    var CriteriaGroup = require('components/cohortbuilder/CriteriaGroup');
    var PrimaryCriteria = require('components/cohortbuilder/PrimaryCriteria');
    var CriteriaTypes = require('components/cohortbuilder/CriteriaTypes');

    class Reusable {
        constructor(d) {
            let data = d || {};
            Object.assign(this, data);
            this.name = ko.observable(data.name || ko.unwrap(constants.newEntityNames.reusable));
            this.description = ko.observable(data.description || null);
            this.data = data.data ? JSON.parse(data.data) : {};
            this.type = ko.observable(this.data.type || 'CRITERIA_GROUP');
            this.parameters = ko.observableArray(this.data.parameters && this.data.parameters.map((p) => new ReusableParameter(p)));
            this.conceptSets = ko.observableArray(this.data.conceptSets && this.data.conceptSets.map((d) => new ConceptSet(d)));

            // default type
            this.criteriaGroupExpression = new CriteriaGroup(this.data.criteriaGroupExpression ? this.data.criteriaGroupExpression : this.data.expression,
                this.conceptSets);

            this.initialEventExpression = new PrimaryCriteria(this.data.initialEventExpression, this.conceptSets);

            this.censoringEventExpression = ko.observableArray(this.data.censoringEventExpression && this.data.censoringEventExpression.map(criteria =>
                CriteriaTypes.GetCriteriaFromObject(criteria, this.conceptSets)
            ));


            this.tags = ko.observableArray(data.tags);
        }
    }

    return Reusable;
});
