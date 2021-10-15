define(function (require) {

    var ko = require('knockout');
    var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');

    class ReusableParameter {
        constructor(d) {
            let data = d || {};
            Object.assign(this, data);
            this.name = ko.observable(data.name || ko.unwrap(constants.newEntityNames.reusable));
            this.type = 'CONCEPT_SET';
            this.data = new ConceptSet({id: -1, name: 'Parameter 1'});
        }
    }

    return ReusableParameter;
});
