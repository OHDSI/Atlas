define(['knockout'], (ko) => {
  function draw(
    data,
    container,
    minHeight,
    format,
    renderer
  ) {
    if (container && data) {
      renderer.render(
        data,
        container,
        container.getBoundingClientRect().width,
        Math.max(container.getBoundingClientRect().height, minHeight),
        format
      );
    }
  }

  ko.bindingHandlers.chart = {
		update: function (element, valueAccessor) {
      const chart = valueAccessor();
      try {

        let format = {};

        if (chart.format) {
            for (let [key, value] of Object.entries(chart.format)) {
                format[`${key}`] = (typeof value === "function") ? ko.unwrap(value) : value;
            }
        }

        draw(chart.data(), element, chart.minHeight, format, chart.renderer);

      } catch(er) {
        console.error('Error when rendering chart', er);
        draw(null, element, chart.minHeight, chart.format, chart.renderer);
      }
		}
	};
});