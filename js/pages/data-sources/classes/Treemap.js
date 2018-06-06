define([
  'knockout',
  'const',
  'services/http',
  './Report',
  'text!components/charts/datatableTemplate.html'
], function (
  ko,
  helpers,
  httpService,
  Report,
  datatableTemplate
) {
  class TreemapReport extends Report {
    constructor() {
      super();
      this.treeData = ko.observable();
      this.currentConcept = ko.observable();

      this.aggProperty = {
        name: '',
        description: '',
      };
      this.byFrequency = false;
      this.byUnit = false;
      this.byType = false;

      this.chartFormats = {
        treemap: {
          useTip: true,
          minimumArea: 50,
          onclick: node => this.currentConcept(node),
          getsizevalue: node => node.num_persons,
          getcolorvalue: node => node.agg_value,
          getcolorrange: () => helpers.treemapGradient,
          getcontent: (node) => {
            const steps = node.path.split('||');
            const i = steps.length - 1;
            return `<div class="pathleaf">${steps[i]}</div>
            <div class="pathleafstat">Prevalence: ${helpers.formatPercent(node.percent_persons)}</div>
            <div class="pathleafstat">Number of People: ${helpers.formatComma(node.num_persons)}</div>
            <div class="pathleafstat">${this.aggProperty.description}: ${helpers.formatFixed(node.agg_value)}</div>
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
          order: [1, 'desc'],
          dom: datatableTemplate,
          buttons: ['colvis', 'copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5'],
          autoWidth: false,
          data: null,
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
              className: 'numeric'
            },
            {
              data: 'percent_persons',
              className: 'numeric'
            },
            {
              data: 'agg_value',
              className: 'numeric'
            }
          ],
          pageLength: 15,
          lengthChange: false,
          deferRender: true,
          destroy: true,
        },
      };
    }
    
    selectTab(tab) {
      
    }

    onReportTableRowClick(report, context, event) {
      var dataTable = $("#report_table").DataTable();
      var rowIndex = event.target._DT_CellIndex.row;
      var concept = dataTable.row(rowIndex).data();

      report.currentConcept(concept);
    }

    parseData({ data }) {			
      const normalizedData = helpers.normalizeDataframe(helpers.normalizeArray(data, true));

      if (!normalizedData.empty) {
        const tableData = normalizedData.conceptPath.map((d, i) => {
          const pathParts = d.split('||');
          return {
            concept_id: normalizedData.conceptId[i],
            name: pathParts[pathParts.length - 1],
            num_persons: helpers.formatComma(normalizedData.numPersons[i]),
            percent_persons: helpers.formatPercent(normalizedData.percentPersons[i]),
            agg_value: helpers.formatFixed(normalizedData[this.aggProperty.name][i])
          };
        });
        this.chartFormats.table.data = tableData;
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

    render(params) {
      super.render(params);
      // to pass down to drilldown
      this.currentReport = params.report;
      return this.getData()
        .then(() => {
          // in order to get jquery working, we should set isLoading here instead of .finally block
          this.context.loadingReport(false);
          this.isLoading(false);
          $("#report_table").DataTable(this.chartFormats.table);
          $('[data-toggle="popover"]').popover();        
        });
    }
  }

  return TreemapReport;
});
