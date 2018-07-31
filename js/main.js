const bustCache = (() => {
	const key = 'bustCache';
	let hash = localStorage.getItem(key) || (localStorage[key] = Math.random().toString(36).substring(7));
	return '_=' + hash;
})();

const localRefs = {
  "configuration": "components/configuration",
  "source-manager": "components/source-manager",
  "concept-manager": "components/concept-manager",
  "conceptset-browser": "components/conceptset/conceptset-browser",
  "conceptset-editor": "components/conceptset/conceptset-editor",
  "conceptset-manager": "components/conceptset/conceptset-manager",
  "conceptset-modal": "components/conceptsetmodal/conceptSetSaveModal",
  "conceptset-list-modal": "components/conceptset/conceptset-list-modal",
  "cohort-comparison-manager": "components/cohort-comparison-manager",
  "job-manager": "components/job-manager",
  "cohort-comparison-browser": "components/cohort-comparison-browser",
  "cohort-comparison-print-friendly": "components/cohort-comparison-print-friendly",
  "cohort-comparison-r-code": "components/cohort-comparison-r-code",
  "cohort-comparison-multi-r-code": "components/cohort-comparison-multi-r-code",
  "user-bar": "components/user-bar",
  "ir-manager": "components/ir-manager",
  "ir-browser": "components/ir-browser",
  "faceted-datatable": "components/faceted-datatable",
  "profile-manager": "components/profile/profile-manager",
  "explore-cohort": "components/explore-cohort",
  "r-manager": "components/r-manager",
  "negative-controls": "components/negative-controls",
  "home": "components/home",
  "welcome": "components/welcome",
  "forbidden": "components/ac-forbidden",
  "unauthenticated": "components/ac-unauthenticated",
  "roles": "components/roles",
  "role-details": "components/role-details",
  "loading": "components/loading",
  "atlas-state": "components/atlas-state",
  "plp-manager": "components/plp-manager",
  "plp-inspector": "components/plp-inspector",
  "plp-browser": "components/plp-browser",
  "plp-roc": "components/plp-roc",
  "plp-calibration": "components/plp-calibration",
  "plp-spec-editor": "components/plp-spec-editor",
  "plp-r-code": "components/plp-r-code",
  "plp-print-friendly": "components/plp-print-friendly",
  "feedback": "components/feedback",
  "conceptsetbuilder": "modules/conceptsetbuilder",
  "conceptpicker": "modules/conceptpicker",
  "webapi": "modules/WebAPIProvider",
  "vocabularyprovider": "modules/WebAPIProvider/VocabularyProvider",
  "css": "plugins/css.min",
};

require(['./settings'], (settings) => {
  const bundledRefs = {};
  Object.keys(settings.paths).forEach((name) => {
    bundledRefs[name] = 'assets/bundle/bundle';
  })

  requirejs.config({
    ...settings,
    urlArgs: bustCache,
    deps: ['css!styles/jquery.dataTables.min',
      'css!styles/jquery.dataTables.colVis.css'
    ],
    paths: {
      ...localRefs,
      ...bundledRefs,
    },
  });

  require(['bootstrap'], function () { // bootstrap must come first
      $.fn.bstooltip = $.fn.tooltip;
    require([
      'knockout',
      'app',
      'appConfig',
      'webapi/AuthAPI',
      'webapi/SourceAPI',
      'assets/ohdsi.util',
      'lscache',
      'atlas-state',
      'vocabularyprovider',
      'services/http',
      'webapi/ExecutionAPI',
      'databindings',
      'director',
      'localStorageExtender',
      'jquery.ui.autocomplete.scroll',
      'loading',
      'user-bar',
      'welcome',
    ],
      function (
        ko,
        app,
        config,
        authApi,
        sourceApi,
        util,
        lscache,
        sharedState,
        vocabAPI,
        httpService,
        executionAPI
      ) {
      var pageModel = new app();
      window.pageModel = pageModel;

      ko.applyBindings(pageModel, document.getElementsByTagName('html')[0]);
      httpService.setUnauthorizedHandler(() => authApi.resetAuthParams());
      httpService.setUserTokenGetter(() => authApi.getAuthorizationHeader());

      // establish base priorities for daimons
      var evidencePriority = 0;
      var vocabularyPriority = 0;
      var densityPriority = 0;

      // initialize all service information asynchronously
      var serviceCacheKey = 'ATLAS|' + config.api.url;
      cachedService = lscache.get(serviceCacheKey);

      if (cachedService && cachedService.sources) {
        console.log('cached service');
        config.api = cachedService;

        for (var s = 0; s < cachedService.sources.length; s++) {
          var source = cachedService.sources[s];

          for (var d = 0; d < source.daimons.length; d++) {
            var daimon = source.daimons[d];

            if (daimon.daimonType == 'Vocabulary') {
              if (daimon.priority >= vocabularyPriority) {
                vocabularyPriority = daimon.priority;
                sharedState.vocabularyUrl(source.vocabularyUrl);
              }
            }

            if (daimon.daimonType == 'Evidence') {
              if (daimon.priority >= evidencePriority) {
                evidencePriority = daimon.priority;
                sharedState.evidenceUrl(source.evidenceUrl);
              }
            }

            if (daimon.daimonType == 'Results') {
              if (daimon.priority >= densityPriority) {
                densityPriority = daimon.priority;
                sharedState.resultsUrl(source.resultsUrl);
              }
            }
          }
        }
      } else {
        sharedState.sources([]);

        if (authApi.isAuthenticated()) {
          sourceApi.initSourcesConfig();
        } else {
          var wasInitialized = false;
          authApi.isAuthenticated.subscribe(function(isAuthed) {
            if (isAuthed && !wasInitialized) {
              sourceApi.initSourcesConfig();
              wasInitialized = true;
            }
          });
        }
      }


      config.api.isExecutionEngineAvailable = ko.observable(false);
      authApi.isAuthenticated.subscribe(executionAPI.checkExecutionEngineStatus);
      executionAPI.checkExecutionEngineStatus(authApi.isAuthenticated());


      $.when.apply($, pageModel.initPromises).done(function () {
        pageModel.initComplete();
      });

      pageModel.currentView.subscribe(function (newView) {
        switch (newView) {
          case 'reports':
            $.ajax({
              url: config.api.url + 'cohortdefinition',
              method: 'GET',
              contentType: 'application/json',
              success: function (cohortDefinitions) {
                pageModel.cohortDefinitions(cohortDefinitions);
              }
            });
            break;
        }
      });

      pageModel.loadAncestors = function(ancestors, descendants) {
        return $.ajax({
          url: sharedState.vocabularyUrl() + 'lookup/identifiers/ancestors',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            ancestors: ancestors,
            descendants: descendants
          })
        });
      };
      
      pageModel.loadAndApplyAncestors = function(data) {
        const selectedConceptIds = sharedState.selectedConcepts().filter(v => !v.isExcluded()).map(v => v.concept.CONCEPT_ID);
        const ids = [];
        $.each(data, (i, element ) => {
          if (_.isEmpty(element.ANCESTORS) && sharedState.selectedConceptsIndex[element.CONCEPT_ID] !== 1) {
            ids.push(element.CONCEPT_ID);
          }
        });
        let resultPromise = $.Deferred();
        if (!_.isEmpty(selectedConceptIds) && !_.isEmpty(ids)) {
          pageModel.loadAncestors(selectedConceptIds, ids).then(ancestors => {
            const map = pageModel.includedConceptsMap();
            $.each(data, (j, line) => {
              const ancArray = ancestors[line.CONCEPT_ID];
              if (!_.isEmpty(ancArray) && _.isEmpty(line.ANCESTORS)) {
                line.ANCESTORS = ancArray.map(conceptId => map[conceptId]);
              }
            });
            resultPromise.resolve();
          });
        } else {
          resultPromise.resolve();
        }
        return resultPromise;
      };
      
      pageModel.loadIncluded = function (identifiers) {
        pageModel.loadingIncluded(true);
        var includedPromise = $.Deferred();

        $.ajax({
          url: sharedState.vocabularyUrl() + 'lookup/identifiers',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(identifiers ||pageModel.conceptSetInclusionIdentifiers()),
          success: function (data) {
            var densityPromise = vocabAPI.loadDensity(data);

            $.when(densityPromise)
              .done(function () {
                pageModel.includedConcepts(data.map(v => Object.assign(v, {ANCESTORS: []})));
                includedPromise.resolve();
                pageModel.loadAndApplyAncestors(pageModel.includedConcepts());
                pageModel.loadingIncluded(false);
                const map = data.reduce((result, item) => {
                  result[item.CONCEPT_ID] = item;
                  return result;
                }, {});
                pageModel.includedConceptsMap(map);
              });
          }
        });

        return includedPromise;
      }
      
      pageModel.loadSourcecodes = function () {
        pageModel.loadingSourcecodes(true);

        // load mapped
        var identifiers = [];
        var concepts = pageModel.includedConcepts();
        for (var i = 0; i < concepts.length; i++) {
          identifiers.push(concepts[i].CONCEPT_ID);
        }

        return $.ajax({
          url: sharedState.vocabularyUrl() + 'lookup/mapped',
          method: 'POST',
          data: JSON.stringify(identifiers),
          contentType: 'application/json',
          success: function (sourcecodes) {
            pageModel.includedSourcecodes(sourcecodes);
            pageModel.loadingSourcecodes(false);
          }
        });
      }

      function loadIncluded() {
        var promise;
        if (pageModel.includedConcepts().length == 0) {
          promise = pageModel.loadIncluded();
        } else {
          promise = $.Deferred();
          promise.resolve();
        }
        return promise;
      }

      pageModel.currentConceptSetMode.subscribe(function (newMode) {
        switch (newMode) {
          case 'included':
            loadIncluded();
            break;
          case 'sourcecodes':
            loadIncluded()
              .then(function () {
                if (pageModel.includedSourcecodes().length === 0) {
                  pageModel.loadSourcecodes();
                }
              });
            break;
        }
      });

      // handle select all
      $(document)
        .on('click', 'th i.fa.fa-shopping-cart', function () {
          if (pageModel.currentConceptSet() == undefined) {
            var newConceptSet = {
              name: ko.observable("New Concept Set"),
              id: 0
            }
            pageModel.currentConceptSet(newConceptSet);
          }

          var table = $(this)
            .closest('.dataTable')
            .DataTable();
          var concepts = table.rows({
              search: 'applied'
            })
            .data();
          var selectedConcepts = sharedState.selectedConcepts();

          for (var i = 0; i < concepts.length; i++) {
            var concept = concepts[i];
            if (sharedState.selectedConceptsIndex[concept.CONCEPT_ID]) {
              // ignore if already selected
            } else {
              var conceptSetItem = pageModel.createConceptSetItem(concept);
              sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
              selectedConcepts.push(conceptSetItem)
            }
          }
          sharedState.selectedConcepts(selectedConcepts);
          ko.contextFor(this)
            .$component.reference.valueHasMutated();
        });

      // handling concept set selections
      $(document)
        .on('click', 'td i.fa.fa-shopping-cart, .asset-heading i.fa.fa-shopping-cart', function () {
          if (pageModel.currentConceptSet() == undefined) {
            var newConceptSet = {
              name: ko.observable("New Concept Set"),
              id: 0
            }
            pageModel.currentConceptSet({
              name: ko.observable('New Concept Set'),
              id: 0
            });
            pageModel.currentConceptSetSource('repository');
          }

          $(this)
            .toggleClass('selected');
          var concept = ko.contextFor(this)
            .$data;

          if ($(this)
            .hasClass('selected')) {
            var conceptSetItem = pageModel.createConceptSetItem(concept);
            sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
            sharedState.selectedConcepts.push(conceptSetItem);
          } else {
            delete sharedState.selectedConceptsIndex[concept.CONCEPT_ID];
            sharedState.selectedConcepts.remove(function (i) {
              return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
            });
          }

          // If we are updating a concept set that is part of a cohort definition
          // then we need to notify any dependent observables about this change in the concept set
          if (pageModel.currentCohortDefinition() && pageModel.currentConceptSetSource() === "cohort") {
            var conceptSet = pageModel.currentCohortDefinition()
              .expression()
              .ConceptSets()
              .find(function (item) {
                return item.id === pageModel.currentConceptSet().id;
              });
            if (!$(this).hasClass("selected")) {
              conceptSet.expression.items.remove(function (i) {
                return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
              });
            }
            conceptSet.expression.items.valueHasMutated();
            pageModel.resolveConceptSetExpressionSimple(ko.toJSON(conceptSet.expression))
              .then(pageModel.loadIncluded)
              .then(pageModel.loadSourcecodes);
          }
        });

      // concept set selector handling
      $(document)
        .on('click', '.conceptSetTable i.fa.fa-shopping-cart', function () {
          $(this)
            .toggleClass('selected');
          var conceptSetItem = ko.contextFor(this)
            .$data;

          delete sharedState.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID];
          sharedState.selectedConcepts.remove(function (i) {
            return i.concept.CONCEPT_ID == conceptSetItem.concept.CONCEPT_ID;
          });

          pageModel.resolveConceptSetExpression();
        });

      $(window)
        .bind('beforeunload', function () {
          if (pageModel.hasUnsavedChanges())
            return "Changes will be lost if you do not save.";
        });
    });
  });
});