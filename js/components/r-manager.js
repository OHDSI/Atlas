define(['knockout', 'text!./r-manager.html'], function (ko, view) {
	function rManager(params) {
		var self = this;
		self.model = params.model;
		self.nodes = ko.observableArray();
		self.rsbInfo = ko.observable();
		self.rserviPools = ko.observable();

		self.options = {
			Facets: [
				{
					'caption': 'State',
					'binding': function (o) {
						return o.state;
					}
				}
			]
		};

		self.columns = [
			{
				title: 'Id',
				data: 'id'
			},
			{
				title: 'State',
				data: 'state'
			},
			{
				title: 'Created',
				render: function (s, p, d) {
					var date = new Date(d.creation_time);
					return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
				}
			},
			{
				title: 'Lent Count',
				data: 'lent_count'
			}
		];

		self.loadNodes = function () {
			$.ajax({
				url: 'http://hixbeta.jnj.com:8081/rpooli/api/v1/nodes',
				method: 'GET',
				success: function (response) {
					self.nodes(response.nodes);
				}
			});
		}

		self.loadSystemInfo = function () {
			$.ajax({
				url: 'http://hixbeta.jnj.com:8081/rsb/api/rest/system/info',
				method: 'GET',
				headers: {
					'Accept': 'application/vnd.rsb+json'
				},
				success: function (response) {
					self.rsbInfo(response.nodeInformation);
				}
			});
		}

		/*
		$.ajax({
			url: 'http://hixbeta.jnj.com:8081/rsb/api/rest/admin/system/rservi_pools',
			method: 'GET',
			headers: {
				'Accept' : 'application/vnd.rsb+json'
			},
			success: function (response) {
				self.rserviPools(response);
			}
		});
		*/

		self.loadNodes();
		self.loadSystemInfo();
	}

	var component = {
		viewModel: rManager,
		template: view
	};

	ko.components.register('r-manager', component);
	return component;
});
