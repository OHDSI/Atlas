define([
    'knockout',
    'text!./reusable-concept-sets.html',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'components/conceptset/ConceptSetStore',
    'components/conceptset/conceptset-list'
],function(
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
    ConceptSetStore
){

    class ReusableConceptSets extends AutoBind(Component) {

        constructor(params) {
            super(params);
            this.design = params.design;
            this.designId = params.designId;
            this.isEditPermitted = params.isEditPermitted || (() => false);
            this.conceptSets = this.design().conceptSets;
            this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().reusables);
        }
    }

    return commonUtils.build('reusable-concept-sets', ReusableConceptSets, view);

});