define([
  'knockout',
	'utils/ChartUtils',
  'const',
  'services/http',
  './Report',
  'text!components/charts/datatableTemplate.html',
  'faceted-datatable'
], function (
  ko,
  ChartUtils,
  constants,
  httpService,
  Report,
  datatableTemplate
) {
  class TreemapReport extends Report {
    // abstract, no need to define component name here

    constructor(params) {
      super(params);
      this.treeData = ko.observable();
      this.tableData = ko.observable();
      this.currentConcept = ko.observable();

      this.aggProperty = {
        name: '',
        description: '',
      };
      this.byFrequency = false;
      this.byUnit = false;
      this.byType = false;
      this.byValueAsConcept = false;
      this.byOperator = false;
      this.byQualifier = false;

      this.chartFormats = {
        treemap: {
          useTip: true,
          minimumArea: 50,
          onclick: node => this.currentConcept(node),
          getsizevalue: node => node.num_persons,
          getcolorvalue: node => node.agg_value,
          getcolorrange: () => constants.treemapGradient,
          getcontent: (node) => {
            const steps = node.path.split('||');
            const i = steps.length - 1;
            return `<div class="pathleaf">${steps[i]}</div>
            <div class="pathleafstat">Prevalence: ${ChartUtils.formatPercent(node.percent_persons)}</div>
            <div class="pathleafstat">Number of People: ${ChartUtils.formatComma(node.num_persons)}</div>
            <div class="pathleafstat">${this.aggProperty.description}: ${ChartUtils.formatFixed(node.agg_value)}</div>
            `;
          },
          gettitle: (node) => {
            let title = '';
            const steps = node.path.split('||');
            for (let i = 0; i < steps.length - 1; i++) {
              title += ' <div class="pathstep">' + Array(i + 1).join('&nbsp;&nbsp') + steps[i] + ' </div>';
            }
            return title;
          }
        },
        table: {
          order: [2, 'desc'],
          dom: datatableTemplate,
          buttons: ['colvis', 'copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5'],
          autoWidth: false,
          createdRow: function (row) {
            $(row).addClass('table_selector');
          },
          columns: [{
              data: 'concept_id'
            },
            {
              data: 'name'
            },
            {
              data: 'num_persons',
              className: 'numeric',
              orderSequence: ['desc','asc']
            },
            {
              data: 'percent_persons',
              className: 'numeric',
              orderSequence: ['desc','asc']
            },
            {
              data: 'agg_value',
              className: 'numeric',
              orderSequence: ['desc','asc']
            }
          ],
          pageLength: 15,
          lengthChange: false,
          deferRender: true,
          destroy: true,
        },
      };
      // to pass down to drilldown
      this.currentReport = params.report;
      this.getData()
        .then(() => {
          // in order to get jquery working, we should set isLoading here instead of .finally block
          this.context.loadingReport(false);
          this.isLoading(false);      
        });
    }
    
    selectTab(tab) {
      
    }

    parseData({ data }) {			
      const normalizedData = ChartUtils.normalizeDataframe(ChartUtils.normalizeArray(data, true));

      if (!normalizedData.empty) {
        const tableData = normalizedData.conceptPath.map((d, i) => {
          const pathParts = d.split('||');
          return {
            concept_id: normalizedData.conceptId[i],
            name: pathParts[pathParts.length - 1],
            num_persons: ChartUtils.formatComma(normalizedData.numPersons[i]),
            percent_persons: ChartUtils.formatPercent(normalizedData.percentPersons[i]),
            agg_value: ChartUtils.formatFixed(normalizedData[this.aggProperty.name][i])
          };
        });
        this.tableData(tableData);
        this.treeData(normalizedData);
        
        return { data };
      }
      
    }
    
    getData() {
      const response = super.getData();
      response
        .then((data) => this.parseData(data));

      return response;
    }

  }

  return TreemapReport;
});
