define(['knockout',
				'text!./atlas.cohort-editor.html',
				'appConfig',
				'cohortbuilder/CohortDefinition',
				'cohortbuilder/components',
				'conceptsetbuilder/components',
				'knockout-jqueryui/tabs',
				'cohortdefinitionviewer',
        'cohortconceptselector',
				'databindings'
], function (ko, view, config, CohortDefinition) {
    
	function cohortEditor(params) {
		var self = this;
		
		self.model = params.model;
		self.tabMode = ko.observable('expression');
		self.tabWidget = ko.observable();
		self.cohortExpressionEditor = ko.observable();
		self.modifiedJSON = "";
		self.expressionJSON = ko.pureComputed({
			read: function () {
				return ko.toJSON(self.model.currentCohortDefinition().expression(), function (key, value) {
					if (value === 0 || value) {
						return value;
					} else {
						return
					}
				}, 2);
			},
			write: function (value) {
				self.modifiedJSON = value;
			}
		});

		// model behaviors
		
		self.handleConceptSetSelect = function (item) {
			//alert(item);
            self.model.criteriaContext(item);            
            $('#conceptSetSelectorDialog').modal('show');
		}
        
		self.onAtlasConceptSetSelectAction = function(result) {
				console.log(result);
				$('#conceptSetSelectorDialog').modal('hide');

				if (result.action=='add')
						//self.addConceptSet();
						alert("Add Concept Set Selected");

				self.model.criteriaContext(null);
		}

		self.reload = function () {
			var updatedExpression = JSON.parse(self.modifiedJSON);
			self.model.currentCohortDefinition().expression(new CohortExpression(updatedExpression));
		}

		self.onGenerate = function (generateComponent) {
			var generatePromise = chortDefinitionAPI.generate(self.model.currentCohortDefinition().id(), generateComponent.source.sourceKey);
			generatePromise.then(function (result) {
				pollForInfo();
			});
		}

		self.getExpressionJSON = function () {
			return ko.toJSON(self.model.currentCohortDefinition().Expression, pruneJSON, 2)
		}
	}

	var component = {
		viewModel: cohortEditor,
		template: view
	};

	ko.components.register('atlas.cohort-editor', component);
	return component;
});