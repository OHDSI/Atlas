define(function (require) {

    var ko = require('knockout');
    var ReusablesService = require('services/ReusablesService');
    var ConceptSet = require('components/conceptset/InputTypes/ConceptSet');

    class ReusableParameter {
        constructor(d) {
            let data = d || {};
            Object.assign(this, data);
            this.id = data.id;
            this.name = ko.observable(data.name || 'Parameter ' + data.id);
            this.type = ReusablesService.PARAMETER_TYPE.CONCEPT_SET; // first iteration only supports concept sets as parameters
            this.data = data.data ? new ConceptSet(data.data) : new ConceptSet({id: data.id * -1, name: this.name()});
        }
    }

    return ReusableParameter;
});
