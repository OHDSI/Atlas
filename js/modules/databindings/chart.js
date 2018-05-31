define(['knockout'], (ko) => {
  function draw(
    data,
    dataTransformator = data => data,
    container,
    minHeight,
    format,
    atlaschart
  ) {
    if (container && data()) {
      atlaschart.render(
        dataTransformator(data()),
        container,
        container.getBoundingClientRect().width,
        minHeight,
        format
      );
    }
  }

  ko.bindingHandlers.chart = {
		update: function (element, valueAccessor) {
      const chart = valueAccessor();
			draw(chart.data, chart.prepareData, element, chart.minHeight, chart.format, chart.chart);
		}
	};
});