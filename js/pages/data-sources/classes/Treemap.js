define([
	'knockout',
  'pages/data-sources/const',
  'services/http',
  './Report',
], function (
	ko,
  helpers,
  httpService,
  Report
) {
  class TreemapReport extends Report {
    constructor() {
      super();
      this.treeData = ko.observable();
      this.aggProperty = {
        name: '',
        description: '',
      };

      this.chartFormats = {
        treemap: {
          onclick: node => this.currentConcept(node),
          getsizevalue: node => node.num_persons,
          getcolorvalue: node => node.agg_value,
          getcolorrange: () => this.treemapGradient,
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
      };
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
        /*$("#report_table").DataTable({
          order: [1, 'desc'],
          dom: '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
          buttons: ['colvis', 'copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5'],
          autoWidth: false,
          data: tableData,
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
          destroy: true
        });*/

        this.treeData(helpers.buildHierarchyFromJSON(data, threshold, this.aggProperty));
        $('[data-toggle="popover"]').popover();

        return { data };
      }
				
		}

    getData() {
      const response = super.getData();
      response.then((data) => this.parseData(data));

      return response;
    }
  }

  return TreemapReport;
});
