define(
  [
    'knockout',
    'atlascharts',
  ],
  function (ko, atlascharts) {
    const render = (element, valueAccessor) => {
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

    ko.bindingHandlers.lineChart = {
      init: function(element, valueAccessor, allBindings, data, context) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style' && (mutation.oldValue || '').includes('display: none;') && mutation.target.style.display !== 'none') {
              render(element, valueAccessor);
            }
          });
        });
        const config = { attributes: true, attributeOldValue: true };
        observer.observe(element, config);
      },
      update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        render(element, valueAccessor);
      }
    };
  }
);
