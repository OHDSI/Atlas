define(['knockout', 'text!./conceptset-browser.html', 'appConfig', 'webapi/AuthAPI', 'bootstrap', 'circe', ], function (ko, view, config, authApi) {
	function conceptsetBrowser(params) {
		var self = this;
		self.model = params.model;
		self.mode = ko.observable("add");
		self.toggleText = ko.observable("Export Mode");
		self.exportTable = null;
		self.exportRowCount = ko.observable(0);
		self.exportConceptSets = [];

		self.isAuthenticated = authApi.isAuthenticated;
		self.canReadConceptsets = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadConceptsets()) || !config.userAuthenticationEnabled;
		});

		self.onRespositoryConceptSetSelected = function (conceptSet) {
			window.location.href = "#/conceptset/" + conceptSet.id + '/details';
		}

		self.onConceptSetBrowserAction = function (result) {
			// Inspect the result to see what type of action was taken. For now
			// we're handling the 'add' action
			if (result.action == 'add') {
				self.newConceptSet();
			}
		}

		self.onExportAction = function (result) {
			if (result.action == 'add') {
				// Get the items we'd like to export from the table
				var itemsForExport = $('#exportConceptSetTable').DataTable().rows('.selected').data();
				var conceptSetIds = $.map(itemsForExport, function (obj) {
					return obj.id
				}).join('%2B'); // + encoded
				if (conceptSetIds.length > 0) {
					window.open(config.api.url + 'conceptset/exportlist?conceptsets=' + conceptSetIds);
				}
			}
		}

		self.toggle = function () {
			if (self.mode() == "add") {
				self.mode("export");
				self.toggleText("Browse/Add Concept Sets");
			} else {
				self.mode("add");
				self.toggleText("Export Mode");
			}
		}

		self.exportOnConceptSetSelected = function (conceptSet, valueAccessor) {
			$(valueAccessor.currentTarget).toggleClass('selected');
			if (self.exportTable == null) {
				self.exportTable = $(valueAccessor.currentTarget.parentElement.parentElement).DataTable();
			}
			self.exportRowCount(self.exportTable.rows('.selected').data().length);
		}

		self.newConceptSet = function () {
			if (pageModel.currentConceptSet() == undefined) {
				pageModel.currentConceptSetSource('repository');
				document.location = '#/conceptset/0/details';
			}
		}

		self.canCreateConceptSet = ko.pureComputed(function () {
			return ((authApi.isAuthenticated() && authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
		});
	}

	var component = {
		viewModel: conceptsetBrowser,
		template: view
	};

	ko.components.register('conceptset-browser', component);
	return component;
});