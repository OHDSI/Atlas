define(['knockout', 'text!./conceptset-manager.html', 'appConfig', 'knockout.dataTables.binding', 'bootstrap', 'faceted-datatable', 'databindings'], function (ko, view, config) {
	function conceptsetManager(params) {
		var self = this;
		self.model = params.model;
		self.conceptSetName = ko.observable();
		self.conceptSets = ko.observableArray();
		self.defaultConceptSetName = "New Concept Set";

		self.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		self.saveClick = function () {
			self.saveConceptSet();
		}

		self.routeTo = function (mode) {
			if (self.model.currentConceptSet() == undefined) {
				document.location = '#/conceptset/0/' + mode;
			} else {
				document.location = '#/conceptset/' + self.model.currentConceptSet().id + '/' + mode;
			}
		}

		self.closeConceptSet = function () {
			if (self.model.currentConceptSetDirtyFlag.isDirty() && !confirm("Your concept set changes are not saved. Would you like to continue?")) {
				return;
			} else {
				pageModel.clearConceptSet();
				document.location = "#/conceptsets";
			}
		};

		self.conceptSetNameChanged = self.model.currentConceptSet().name.subscribe(function (newValue) {
			if ($.trim(newValue) == self.defaultConceptSetName) {
				$("#txtConceptSetName").css({
					'background-color': '#FF0000'
				});
			} else {
				$("#txtConceptSetName").css({
					'background-color': ''
				});
			}
		});

		self.saveConceptSet = function () {
			var conceptSet = {};
			var abortSave = false;

			// Do not allow someone to save a concept set with the default name of "New Concept Set
			if (self.model.currentConceptSet() && self.model.currentConceptSet().name() == self.defaultConceptSetName) {
				self.raiseConceptSetNameProblem('Please provide a different name for your concept set');
				return;
			}

			if (self.model.currentConceptSet() == undefined) {
				conceptSet.name = self.conceptSetName();
			} else {
				conceptSet = self.model.currentConceptSet();
			}

			// Next check to see that a concept set with this name does not already exist
			// in the database. Also pass the conceptSetId so we can make sure that the
			// current concept set is excluded in this check.
			var conceptSetId = conceptSet.id;
			var urlEncoded = encodeURI(config.services[0].url + 'conceptset/' + conceptSetId + '/' + conceptSet.name() + "/exists");
			var existanceCheckPromise = $.ajax({
				url: urlEncoded,
				method: 'GET',
				contentType: 'application/json',
				success: function (results) {
					if (results.length > 0) {
						self.raiseConceptSetNameProblem('A concept set with this name already exists. Please choose a different name.');
						abortSave = true;
					}
				},
				error: function () {
					alert('An error occurred while attempting to load the concept from your currently configured provider.  Please check the status of your selection from the configuration button in the top right corner.');
				}
			});

			$.when(existanceCheckPromise).done(function () {
				if (abortSave) {
					return;
				}

				var conceptSetItems = [];

				for (var i = 0; i < self.model.selectedConcepts().length; i++) {
					var item = self.model.selectedConcepts()[i];
					conceptSetItems.push({
						conceptId: item.concept.CONCEPT_ID,
						isExcluded: +item.isExcluded(),
						includeDescendants: +item.includeDescendants(),
						includeMapped: +item.includeMapped()
					});
				}

				var json = ko.toJSON(conceptSet);

				$.ajax({
					method: 'POST',
					url: config.services[0].url + 'conceptset/',
					contentType: 'application/json',
					data: json,
					dataType: 'json',
					success: function (data) {

						$.ajax({
							method: 'POST',
							url: config.services[0].url + 'conceptset/' + data.id + '/items',
							data: JSON.stringify(conceptSetItems),
							dataType: 'json',
							contentType: 'application/json',
							success: function (itemSave) {
								$('#conceptSetSaveDialog').modal('hide');
								document.location = '#/conceptset/' + data.id + '/details';
								self.model.currentConceptSetDirtyFlag.reset();
							}
						});
					}
				});

			});
		}

		self.raiseConceptSetNameProblem = function (msg) {
			self.model.currentConceptSet().name.valueHasMutated();
			alert(msg);
			$("#txtConceptSetName").select().focus();
		}
        
        self.exportCSV = function() {
            window.open(config.services[0].url + 'conceptset/' + self.model.currentConceptSet().id + '/export');
        }
	}

	var component = {
		viewModel: conceptsetManager,
		template: view
	};

	ko.components.register('conceptset-manager', component);
	return component;
});