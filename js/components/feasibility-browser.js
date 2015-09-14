define(['knockout', 'text!./feasibility-browser.html', 'faceted-datatable'], function (ko, view) {
	function feasibilityBrowser(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.currentService = ko.observable();
		self.reference = ko.observableArray();
		self.selected = params.feasibilityId;
		self.loading = ko.observable(false);

		self.currentService.subscribe(function (d) {

			self.loading(true);

			$.ajax({
				url: self.currentService() + 'feasibility',
				method: 'GET',
				success: function (d) {
					self.loading(false);
					self.reference(d);
				}
			});

		});

		self.options = {
			Facets: [
				{
					'caption': 'Last Modified',
					'binding': function (o) {
						var daysSinceModification = (new Date().getTime() - new Date(o.modifiedDate).getTime()) / 1000 / 60 / 60 / 24;
						if (daysSinceModification < 7) {
							return 'This Week';
						} else if (daysSinceModification < 14) {
							return 'Last Week';
						} else {
							return '2+ Weeks Ago';
						}
					}
				},
				{
					'caption': 'Author',
					'binding': function (o) {
						return o.createdBy;
					}
				}
			]
		};

		self.renderCohortDefinitionLink = function (s, p, d) {
			return '<span class="linkish">' + d.name + '</span>';
		}

		self.rowClick = function (d) {
			self.selected(d.id);
		}

		self.columns = [
			{
				title: 'Id',
				data: 'id'
			},
			{
				title: 'Name',
				render: self.renderCohortDefinitionLink
			},
			{
				title: 'Created',
				render: function (s, p, d) {
					return new Date(d.createdDate).toLocaleDateString();
				}
			},
			{
				title: 'Updated',
				render: function (s, p, d) {
					return new Date(d.modifiedDate).toLocaleDateString();
				}
			},
			{
				title: 'Author',
				data: 'createdBy'
			}
		];

	}

	var component = {
		viewModel: feasibilityBrowser,
		template: view
	};

	ko.components.register('feasibility-browser', component);
	return component;
});