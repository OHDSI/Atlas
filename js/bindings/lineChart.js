define(
  [
    'knockout',
    'atlascharts',
  ],
  function (ko, atlascharts) {
    // Bindings

    ko.bindingHandlers.lineChart = {
      init: function(element, valueAccessor, allBindings, data, context) {

        setTimeout(() => {
          const $linechart = $(element);

          const {
            data: lineChartData,
            xLabel,
            yLabel,
            xFormat = val => val,
            yFormat = val => val,
            xScale,
            ticks,
            tickFormat,
            height: manualHeight,
            showLegend = true,
          } = valueAccessor();

          const linechart = new atlascharts.line();
          const width = $linechart.width();
          const height = manualHeight || Math.min($linechart.width(), 500);

          const render = () => {

            linechart.render(lineChartData(), $linechart[0], width, height, {
              xLabel,
              yLabel,
              showLegend,
              ticks,
              tickFormat,
              xFormat,
              yFormat,
              xScale,
            });
          };

          lineChartData.subscribe(render);

          render();
        });
      }
    };
  }
);
