define(
  [
    'knockout',
    'atlascharts',
  ],
  function (ko, atlascharts) {
    function render(element, valueAccessor) {
      const $linechart = $(element);
      const {
        data: lineChartData,
        xLabel,
        yLabel,
        xFormat = val => val,
        yFormat = val => val,
        xScale,
        ticks,
        yTicks,
        tickFormat,
        height: manualHeight,
        showLegend = true,
        getTooltipBuilder,
        yAxisWidth,
        yScale,
      } = valueAccessor();

      const linechart = new atlascharts.line();

      const width = $linechart.width();
      const height = manualHeight || Math.min($linechart.width(), 500);
      const data = lineChartData();
      linechart.render(data, $linechart[0], width, height, {
        xLabel,
        yLabel,
        showLegend,
        ticks,
        yTicks,
        tickFormat,
        xFormat,
        yFormat,
        xScale,
        getTooltipBuilder,
        yAxisWidth,
        yScale: yScale || atlascharts.line.getRelativeY({ data, height }),
      });
    }

    ko.bindingHandlers.lineChart = {
      init: function(element, valueAccessor, allBindings, data, context) {
        const {
          setChartRenderMethod,
        } = valueAccessor();
        if (typeof setChartRenderMethod === 'function') {
          setChartRenderMethod(render.bind(null, element, valueAccessor));
        }
      },
      update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        render(element, valueAccessor);
      }
    };
  }
);
