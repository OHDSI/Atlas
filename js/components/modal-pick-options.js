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
        this.options = params.options;
        this.selectedOptions = params.selectedOptions;
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
