define(['knockout'], (ko) => {
  function draw(
    data,
    container,
    minHeight,
    format,
    atlaschart
  ) {
    if (container && data) {
      atlaschart.render(
        data,
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
			draw(chart.data(), element, chart.minHeight, chart.format, chart.chart);
		}
	};
});