define(['jquery', 'knockout', 'jnj_chart'], function ($, ko, jnjChart) {
	ko.bindingHandlers.d3ChartBinding = {
		init: function (element, valueAccessor) {
			return { controlsDescendantBindings: true };
		},
		update: function (element, valueAccessor, allBindings) {
			var va = ko.utils.unwrapObservable(valueAccessor());
			var chartData = ko.utils.unwrapObservable(va.processedData)||[];
			var chartOptions = ko.utils.unwrapObservable(va.chartOptions)||{};
			var chartResolution = ko.utils.unwrapObservable(va.chartResolution)||{width:460,height:150};
			var chartType = ko.utils.unwrapObservable(va.chartType);
			var chart = new jnjChart[chartType]();
			chart.render(chartData, element, chartResolution.width, chartResolution.height, chartOptions);
		}
	};
	console.log('d3ChartBinding');
});
