define(['jquery', 'knockout', 'jnj_chart'], function ($, ko, jnjChart) {
	ko.bindingHandlers.d3ChartBinding = {
		init: function (element, valueAccessor) {
			var va = ko.utils.unwrapObservable(valueAccessor());
			var chartType = ko.utils.unwrapObservable(va.chartType);
			var chart = new jnjChart[chartType]();
			if (va.chartObj) {
				va.chartObj(chart);
			}
			return { controlsDescendantBindings: true };
		},
		update: function (element, valueAccessor, allBindings) {
			var va = ko.utils.unwrapObservable(valueAccessor());
			va.domElement(element);
			var chartData = ko.utils.unwrapObservable(va.chartData)||[];
			var chartOptions = ko.utils.unwrapObservable(va.chartOptions)||{};
			var chartResolution = ko.utils.unwrapObservable(va.chartResolution)||{width:460,height:150};
			var chartType = ko.utils.unwrapObservable(va.chartType);

			/* charts should not be assumed to be knockout aware
			 * (most jnj.charts are not), but they need ways to
			 * respond to external events and to trigger external
			 * events. charts should be usable without this binding,
			 * but this binding should allow charts to also be
			 * usable in a natural way from a knockout context.
			 *
			 * actually, the work order only requests that the
			 * chart accept a knockout observable for data
			 */

			if (va.chartObj) {
				//va.chartObj(chart);
			} else {
				//chart.render(chartData, element, chartResolution.width, chartResolution.height, chartOptions);
			}
		}
	};
});
