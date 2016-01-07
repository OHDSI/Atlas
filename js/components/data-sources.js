/**
 * Created by juh7007 on 1/7/2016.
 */
define(['knockout', 'text!./data-sources.html', 'knockout.dataTables.binding','faceted-datatable'], function (ko, view) {
    function dataSources(params) {
        var self = this;
        self.model = params.model;
		self.cohortDefinitionId = ko.observable();

    }

    var component = {
        viewModel: dataSources,
        template: view
    };

    ko.components.register('data-sources', component);
    return component;
});
