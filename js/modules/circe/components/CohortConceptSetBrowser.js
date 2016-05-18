define(['knockout', 'text!./CohortConceptSetBrowserTemplate.html', 'vocabularyprovider', 'appConfig', 'conceptsetbuilder/InputTypes/ConceptSet', 'databindings'
], function (ko, template, VocabularyProvider, appConfig, ConceptSet) {
	function CohortConcptSetBrowser(params)
	{
		var self = this;
        
		function defaultRepositoryConceptSetSelected(conceptSet) {
		    // Default functionality
		    VocabularyProvider.getConceptSetExpression(conceptSet.id, self.selectedSource().url)
		        .done(function (result) {
		            var newId = self.cohortConceptSets().length > 0 ? Math.max.apply(null, self.cohortConceptSets().map(function (d) {
		                return d.id;
		            })) + 1 : 0;

		            var newConceptSet = new ConceptSet({
		                id: newId,
		                name: conceptSet.name,
		                expression: result
		            });
		            params.$raw.cohortConceptSets().push(newConceptSet);
		            self.criteriaContext() && self.criteriaContext().conceptSetId(newConceptSet.id);
		            self.onActionComplete({
		                action: 'load',
		                status: 'Success'
		            });
		        })
		        .fail(function (err) {
		            console.log(err);
		        });
		}

		function defaultConceptSetSelected(conceptSet) {
			self.criteriaContext() && self.criteriaContext().conceptSetId(conceptSet.id);
			self.onActionComplete({action: 'assign', status: 'Success'});			
		}

		function setDisabledConceptSetButton(action) {
			if (action && action()) {
				return action()
			} else {
				return false;
			}
		}
                
		self.criteriaContext = params.criteriaContext;
		self.cohortConceptSets = params.cohortConceptSets;
		self.onActionComplete = params.onActionComplete;
        self.onRespositoryConceptSetSelected = params.onRespositoryConceptSetSelected || defaultRepositoryConceptSetSelected;
        self.onCohortConceptSetSelected = params.onCohortConceptSetSelected || defaultConceptSetSelected;
        self.disableConceptSetButton = setDisabledConceptSetButton(params.disableConceptSetButton);
        self.buttonActionText = params.buttonActionText || "Add Concept Set";
        self.repositoryConceptSetTableId = params.repositoryConceptSetTableId || "repositoryConceptSetTable";

		self.loading = ko.observable(false);
		self.repositoryConceptSets = ko.observableArray();
		
		self.sources = [];
        
		appConfig.services.forEach(function(service) {
			self.sources.push(service);
		});

        self.loadConceptSetsFromRepository = function(url){
            self.loading(true);

            VocabularyProvider.getConceptSetList(url)
                .done(function (results) {
                    self.repositoryConceptSets(results);
                    self.loading(false);
                })
                .fail(function (err) {
                    console.log(err);
                });
        }

        // See if we can put this at the head and when it doesn't exist
        // make sure we load the repository concept sets first.
        if (self.cohortConceptSets != null) {            
            self.sources.unshift({"name":"Cohort Definition","url":null});
        } else {
            self.loadConceptSetsFromRepository(self.sources[0].url);
        }

        self.selectedSource = ko.observable(self.sources[0]);
		self.sourceSubscription = self.selectedSource.subscribe(function (newSource) {
            if (newSource.url != null)
			{
                self.loadConceptSetsFromRepository(newSource.url)
			}
		});

		// datatable callbacks:
		
		self.selectCohortConceptSet = function(conceptSet)
		{
			console.log(conceptSet);
			self.onCohortConceptSetSelected(conceptSet);
		}

		self.selectRepositoryConceptSet = function (conceptSet, valueAccessor) {
			console.log(conceptSet);
            self.onRespositoryConceptSetSelected(conceptSet, valueAccessor);
        }
		
		self.addConceptSet = function()
		{
			self.onActionComplete({ action: 'add', status: 'Success'});
		}
		
		// dispose subscriptions
		self.dispose = function()
		{
			self.sourceSubscription.dispose();
		}
	}
	
	var component = {
		viewModel: CohortConcptSetBrowser,
		template: template
	};

	return component;
});