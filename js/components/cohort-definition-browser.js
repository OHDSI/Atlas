define(['knockout', 'text!./cohort-definition-browser.html', 'appConfig', 'webapi/AuthAPI', 'moment', 'faceted-datatable'], function (ko, view, config, authApi, moment) {
	function cohortDefinitionBrowser(params) {
		var self = this;
		self.reference = ko.observableArray();
		self.selected = params.cohortDefinitionSelected;
		self.loading = ko.observable(false);
		self.config = config;

		self.loading(true);

		$.ajax({
			url: config.api.url + 'cohortdefinition',
			method: 'GET',
			error: authApi.handleAccessDenied,
			success: function (d) {
				self.reference(d);
			},
			complete: function () {
				self.loading(false);
			}
		});


		self.options = {
			Facets: [{
					'caption': 'Last Modified',
					'binding': function (o) {
						var createDate = new Date(o.createdDate);
						var modDate = new Date(o.modifiedDate);
						var dateForCompare = (createDate > modDate) ? createDate : modDate;
						var daysSinceModification = (new Date()
							.getTime() - dateForCompare.getTime()) / 1000 / 60 / 60 / 24;
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

		self.columns = [{
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
					return new moment(d.createdDate, "YYYY-MM-DD HH:mm")
						.format('YYYY-MM-DD hh:mm:ss a');
				}
			},
			{
				title: 'Updated',
				render: function (s, p, d) {
					var dateToFormat = d.modifiedDate || d.createdDate
					return new moment(dateToFormat, "YYYY-MM-DD HH:mm")
						.format('YYYY-MM-DD hh:mm:ss a');
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
