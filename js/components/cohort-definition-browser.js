define(['knockout', 'text!./cohort-definition-browser.html', 'appConfig', 'faceted-datatable'], function (ko, view, config) {
	function cohortDefinitionBrowser(params) {
		var self = this;
		self.currentService = ko.observable();
		self.reference = ko.observableArray();
		self.selected = params.cohortDefinitionSelected;
		self.loading = ko.observable(false);
		self.config = config;

		self.currentService.subscribe(function (d) {
			self.loading(true);

			$.ajax({
				url: self.currentService() + 'cohortdefinition',
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
		viewModel: cohortDefinitionBrowser,
		template: view
	};

	ko.components.register('cohort-definition-browser', component);
	return component;
});
