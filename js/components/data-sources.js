define(['knockout', 'text!./data-sources.html', 'd3', 'jnj_chart', 'colorbrewer', 'lodash', 'appConfig', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _, config) {
	function dataSources(params) {
		var self = this;
		self.reports = ko.observableArray([{name: "Visit", path: "visit"}, {name: "Dashboard", path: "dashboard"}]);
		self.currentReport = ko.observable(self.reports()[0]);
		self.model = params.model;
		self.showSelectionArea = params.showSelectionArea == undefined ? true : params.showSelectionArea;
		self.reportTriggerRunSuscription = self.model.reportTriggerRun.subscribe(function (newValue) {
			if (newValue) {
				self.runReport();
			}
		});
		self.formatPercent = d3.format('.2%');
		self.formatFixed = d3.format('.2f');
		self.formatComma = d3.format(',');
		self.treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		self.boxplotWidth = 200;
		self.boxplotHeight = 125;
		self.donutWidth = 500;
		self.donutHeight = 300;

		self.datatables = {};

		self.runReport = function runReport() {
			self.model.loadingReport(true);
			self.model.activeReportDrilldown(false);
			self.model.reportTriggerRun(false);
			var currentReport = self.currentReport();

			switch (currentReport.name) {
				case 'visit':
					$.ajax({
						url: config.services[0].url + self.model.reportSourceKey() + '/cdmresults/visit',
						success: function (data){
							self.model.loadingReport(false);

							var normalizedData = self.normalizeDataframe(self.normalizeArray(data, true));
							data = normalizedData;
							if (!data.empty) {
								var table_data = normalizedData.conceptPath.map(function (d, i) {
									return {
										concept_id: this.conceptId[i],
										visit_type: this.conceptPath[i],
										num_persons: self.formatComma(this.numPersons[i]),
										percent_persons: self.formatPercent(this.percentPersons[i]),
										records_per_person: self.formatFixed(this.recordsPerPerson[i])
									};
								}, data);

								datatable = $('#visit_table').DataTable({
									order: [6, 'desc'],
									dom: 'T<"clear">lfrtip',
									data: table_data,
									"createdRow": function( row, data, dataIndex ) {
										$(row).addClass( 'visit_table_selector' );
									},
									columns: [
										{
											data: 'concept_id'
										},
										{
											data: 'visit_type'
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
											data: 'records_per_person',
											className: 'numeric'
										}
									],
									pageLength: 5,
									lengthChange: false,
									deferRender: true,
									destroy: true
								});

								tree = self.buildHierarchyFromJSON(data, threshold);
								var treemap = new jnj_chart.treemap();
								treemap.render(tree, '#treemap_container', width, height, {
									onclick: function (node) {
										//self.visitDrilldown(node.id, node.name);
									},
									getsizevalue: function (node) {
										return node.num_persons;
									},
									getcolorvalue: function (node) {
										return node.records_per_person;
									},
									getcolorrange: function () {
										return self.treemapGradient;
									},
									getcontent: function (node) {
										var result = '',
											steps = node.path.split('||'),
											i = steps.length - 1;
										result += '<div class="pathleaf">' + steps[i] + '</div>';
										result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
										result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
										result += '<div class="pathleafstat">Records per Person: ' + self.formatFixed(node.records_per_person) + '</div>';
										return result;
									},
									gettitle: function (node) {
										var title = '',
											steps = node.path.split('||');
										for (var i = 0; i < steps.length - 1; i++) {
											title += ' <div class="pathstep">' + Array(i + 1).join('&nbsp;&nbsp') + steps[i] + ' </div>';
										}
										return title;
									}
								});
								$('[data-toggle="popover"]').popover();
							}
						}
					});
					break;
			}

			self.model.loadingReport(false);

		}

	}


	var component = {
		viewModel: dataSources,
		template: view
	};

	ko.components.register('data-sources', component);
	return component;
});