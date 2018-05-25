define([
	'knockout',
	'atlas-state',
	'text!./vocabulary.html',
	'appConfig',
	'webapi/AuthAPI',
	'providers/Component',
	'components/tabs',
  'components/tab',
  'components/panel',
  'faceted-datatable',
	'less!./vocabulary.less',
], function (
	ko,
	sharedState,
	view,
	config,
	authApi,
	Component
) {
	class Vocabulary extends Component {
		constructor() {
			super();
			this.name = 'vocabulary';
      this.view = view;
      this.currentSearch = ko.observable('');
      this.loading = ko.observable(false);
      this.canSearch = ko.observable(true);
      this.showAdvanced = ko.observable(false);
      this.domains = ko.observableArray([{ DOMAIN_ID: 1, DOMAIN_NAME: 'test' }]);
      this.vocabularies = ko.observableArray([{ VOCABULARY_ID: 1, VOCABULARY_NAME: 'test' }]);
      this.concepts = ko.observableArray([]);
      this.searchExecuted = ko.observable(false);
      this.searchConceptsColumns = ko.observableArray([]);
      this.searchConceptsOptions = ko.observable();
      this.contextSensitiveLinkColor = ko.observable();

      this.search = this.search.bind(this);
      this.clearAllAdvanced = this.clearAllAdvanced.bind(this); 
      this.toggleAdvanced = this.toggleAdvanced.bind(this);      
    }
    
    search() {
      if (this.currentSearch().length) {
        this.searchExecuted(true);
      }
    }

    clearAllAdvanced() {

    }

    toggleAdvanced() {
      this.showAdvanced(!this.showAdvanced());
    }

		render(params) {
      super.render(params);
			return this;
		}
	}

	const component = new Vocabulary();
	return component.build();
});
