define(
  [
    'knockout',
    'text!./cost-utilization.html',
    'appConfig',
    'atlascharts',
    'd3',
    'd3-scale',
    'webapi/MomentAPI',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/table-baseline-exposure/table-baseline-exposure',
    'less!components/reports/cost-utilization/cost-utilization.less',
  ],
  function (ko, view, appConfig, atlascharts, d3, d3scale, MomentAPI) {

    function testPage(params) {

      this.apply = () => {
        const selectedValuesAgg = this.filterList.reduce(
          (selectedAgg, filterEntry) => {
            selectedAgg[filterEntry.name] = filterEntry.selectedValues();
            return selectedAgg;
          },
          {}
        );
        console.log(selectedValuesAgg);
      };

      this.filterList = [
        {
          type: 'multiselect',
          label: 'Visit Type ',
          name: 'visit_type',
          options: [
            {
              label: 'Visit derived from encounter on medical claim',
              value: 1,
            },
            {
              label: 'Visit derived from encounter on pharmacy claim',
              value: 2,
            },
            {
              label: 'Visit derived from encounter on medical facility claim',
              value: 3,
            },
            {
              label: 'Visit derived from encounter on medical professional claim',
              value: 4,
            }
          ],
          selectedValues: ko.observableArray(),
        },
        {
          type: 'multiselect',
          label: 'Visit Concept',
          name: 'visit_concept',
          options: [
            {
              label: 'Visit derived from encounter on medical claim',
              value: 1,
            },
            {
              label: 'Visit derived from encounter on pharmacy claim',
              value: 2,
            },
            {
              label: 'Visit derived from encounter on medical facility claim',
              value: 3,
            },
            {
              label: 'Visit derived from encounter on medical professional claim',
              value: 4,
            }
          ],
          selectedValues: ko.observableArray(),
        },
        /*{
          type: 'multiselect',
          label: 'Condition concept',
          name: 'condition_concept',
          options: [
            {
              label: 'Visit derived from encounter on medical claim',
              value: 1,
            },
            {
              label: 'Visit derived from encounter on pharmacy claim',
              value: 2,
            },
            {
              label: 'Visit derived from encounter on medical facility claim',
              value: 3,
            },
            {
              label: 'Visit derived from encounter on medical professional claim',
              value: 4,
            }
          ],
          selectedValues: ko.observableArray(),
        },
        {
          type: 'multiselect',
          label: 'Condition type',
          name: 'condition_type',
          options: [
            {
              label: 'Condition tested for by diagnostic procedure',
              value: 1,
            },
            {
              label: 'EHR billing diagnosis',
              value: 2,
            },
            {
              label: 'EHR encounter diagnosis',
              value: 3,
            }
          ],
          selectedValues: ko.observableArray(),
        },*/
      ];
    }

    this.dataList = [
      {
        periodStart: '2017-01-01',
        periodEnd: '2017-01-07',
        personsCount: 55,
        personsPct: '33.7%',
        exposureTotal: 1.0,
        exposurePct: '23.0%',
        exposureAvg: 0.02
      },
      {
        periodStart: '2017-01-08',
        periodEnd: '2017-01-14',
        personsCount: 98,
        personsPct: '60.1%',
        exposureTotal: 1.9,
        exposurePct: '44.1%',
        exposureAvg: 0.02
      },
      {
        periodStart: '2017-01-15',
        periodEnd: '2017-01-21',
        personsCount: 54,
        personsPct: '33.1%',
        exposureTotal: 1.0,
        exposurePct: '22.6%',
        exposureAvg: 0.02
      },
      {
        periodStart: '2017-01-22',
        periodEnd: '2017-01-31',
        personsCount: 32,
        personsPct: '19.6%',
        exposureTotal: 0.4,
        exposurePct: '10.3%',
        exposureAvg: 0.01
      },
    ];

    // Persons / Exposure chart

    this.xFormat = (idx) => {
      if (!this.dataList[idx])
        return;

      const {
        periodStart,
        periodEnd,
      } = this.dataList[idx];

      return MomentAPI.formatDateTime(periodStart, 'D MMM Y') + '\nto\n' + MomentAPI.formatDateTime(periodEnd, 'D MMM Y');
    };

    this.yPercentFormat = (val) => `${val}%`;

    const personsChartData = this.dataList.map((entry, idx) => ({
      id: idx,
      xValue: idx,
      yValue: parseFloat(entry.personsPct),
    }));

    const exposureChartData = this.dataList.map((entry, idx) => ({
      id: idx,
      xValue: idx,
      yValue: parseFloat(entry.exposurePct),
    }));

    this.xScale = d3scale.scaleLinear()
      .domain([
        -1,
        personsChartData.length
      ]);

    this.ticks = exposureChartData.length + /* padding */ 2;

    this.personExposureLinechartData = [
      {
        name: 'Persons',
        values: personsChartData,
      },
      {
        name: 'Exposure',
        values: exposureChartData,
      }
    ];

    // Average chart

    this.averageLinechartData = [
      {
        name: 'Average',
        values: this.dataList.map((entry, idx) => ({
          id: idx,
          xValue: idx,
          yValue: parseFloat(entry.exposureAvg),
        }))
      },
    ];

    ko.bindingHandlers.lineChart = {
      init: function(element, valueAccessor, allBindings, data, context) {

        const $linechart = $(element);

        const linechart = new atlascharts.line();
        const width = $linechart.width();
        const height = Math.min($linechart.width(), 500);

        const {
          data: lineChartData,
          xLabel,
          yLabel,
          xFormat,
          yFormat,
          xScale,
          ticks,
        } = valueAccessor();

        linechart.render(lineChartData, $linechart[0], width, height, {
          xLabel,
          yLabel,
          showLegend: true,
          ticks,
          xFormat,
          yFormat,
          xScale,
        });

        const insertLinebreaks = function (d) {
          const el = d3.select(this);
          const words = el.text().split('\n');
          el.text('');

          for (let i = 0; i < words.length; i++) {
            const tspan = el.append('tspan').text(words[i]);
            if (i > 0)
              tspan.attr('x', 0).attr('dy', '15');
          }
        };

        $linechart.find('g.x.axis g text').each(insertLinebreaks);

        const $svg = $linechart.find('svg');
        const $content = $svg.find('> g');
        const newHeight = $content[0].getBBox().height + 10;
        const viewBox = $svg[0].getAttribute('viewBox').trim().replace(/( |\t|\n)+/g, ' ').split(' ');
        viewBox[viewBox.length - 1] = newHeight;
        $svg[0].setAttribute('viewBox', viewBox.join(' '));
      }
    };

    const component = {
      viewModel: testPage,
      template: view
    };

    ko.components.register('cost-utilization', component);
    return component;
  }
);
