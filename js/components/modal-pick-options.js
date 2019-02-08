define([
    'knockout',
    'text!./modal-pick-options.html',
    'utils/BemHelper',
    'less!./modal-pick-options.less'
], function (ko, view, BemHelper) {

    const componentName = 'modal-pick-options';

    function ModalPickOptions(params) {
        this.showModal = params.showModal;
        this.title = params.title;
        // options object looks like:
        // {
        //     section1: { title:'Section One Title', options: array, selectedOptions: observableArray }
        //     section2: { title:'Second Section Title', options: array, selectedOptions: observableArray }
        // }
        this.options = params.options;
        this.submit = params.submit;
        this.submitLabel = params.submitLabel;

        const bemHelper = new BemHelper(componentName);
        this.classes = bemHelper.run.bind(bemHelper);
    }

    var component = {
        viewModel: ModalPickOptions,
        template: view
    };

    ko.components.register(componentName, component);
    return component;
});