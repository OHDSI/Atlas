define(['knockout', 'text!./source-manager.html', 'appConfig', 'vocabularyprovider', 'ohdsi.util', 'webapi/SourceAPI', 'webapi/RoleAPI', 'lodash', 'atlas-state', 'access-denied'],
  function (ko, view, config, vocabularyProvider, ohdsiUtil, sourceApi, roleApi, lodash, sharedState) {

  var defaultDaimons = {
    CDM: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Vocabulary: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Results: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Evidence: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
  };

  const priotirizableDaimonTypes = ['Vocabulary', 'Results', 'CEM'];

  function Source(data) {

    function mapDaimons(daimons) {
      daimons = daimons || [];
      var defaultKeys = Object.keys(defaultDaimons);
      var keys = daimons.map(function (value) { return value.daimonType; });
      var result = daimons.map(function (value) {
        return {
          ...lodash.omit(value, ['tableQualifier']),
          tableQualifier: ko.observable(value.tableQualifier),
          enabled: ko.observable(true),
      };
      });
      var diff = lodash.difference(defaultKeys, keys).map(function(key){
        return {
          ...defaultDaimons[key],
          daimonType: key,
          enabled: ko.observable(false),
      };
      });
      return lodash.concat(result, diff);
    }

    var self = this;
    var data = data || {};

    self.name = ko.observable(data.sourceName || null);
    self.key = ko.observable(data.sourceKey || null);
    self.dialect = ko.observable(data.sourceDialect || null);
    self.connectionString = ko.observable(data.connectionString || null);
    self.username = ko.observable(data.username || null);
    self.password = ko.observable(data.password || null);
    self.daimons = ko.observableArray(mapDaimons(data.daimons));
    return self;
  }

  function source(params) {
    var self = this;
    var authApi = params.model.authApi;
    self.config = config;
    self.model = params.model;
    self.loading = ko.observable(false);
    self.dirtyFlag = self.model.currentSourceDirtyFlag;

    self.selectedSource = params.model.currentSource;
    self.selectedSourceId = params.model.selectedSourceId;

    self.options = {};

    self.isAuthenticated = authApi.isAuthenticated;
		
	self.hasAccess = ko.pureComputed(function () {
		if (!config.userAuthenticationEnabled) { 
			return false;
		} else {				
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedEditConfiguration()) || !config.userAuthenticationEnabled;
		}
	});

    self.canReadSource = ko.pureComputed(function() {
      return (config.userAuthenticationEnabled && self.isAuthenticated()
        && authApi.isPermittedReadSource(self.selectedSourceId())) || !config.userAuthenticationEnabled
        || !self.selectedSourceId();
    });

    self.isDeletePermitted = ko.pureComputed(function() {
      return (config.userAuthenticationEnabled && self.isAuthenticated() &&
        authApi.isPermittedDeleteSource(self.selectedSource().key())) || !config.userAuthenticationEnabled;
    });

    self.canEdit = ko.pureComputed(function() {
      return (config.userAuthenticationEnabled && self.isAuthenticated() &&
        authApi.isPermittedEditSource(self.selectedSourceId())) || !config.userAuthenticationEnabled;
    });

    self.canSave = ko.pureComputed(function () {
      return (self.selectedSource() && self.selectedSource().name() && self.selectedSource().key()
        && self.selectedSource().connectionString() && self.canEdit());
    });

    self.canDelete = function () {
      return (self.selectedSource() && self.selectedSource().key() && self.isDeletePermitted());
    };

    self.options.dialectOptions = [
      { name: 'PostgreSQL', id: 'postgresql' },
      { name: 'SQL server', id: 'sqlserver' },
      { name: 'Oracle', id: 'oracle' },
      { name: 'Amazon Redshift', id: 'redshift' },
      { name: 'Google BigQuery', id: 'bigquery' },
      { name: 'Impala', id: 'impala' },
      { name: 'Microsoft PDW', id: 'pdw' },
      { name: 'IBM Netezza', id: 'netezza' },
    ];

    self.sourceCaption = ko.computed(function(){
      return (self.model.currentSource() == null || self.model.currentSource().key() == null) ? 'New source' :
        'Source ' + self.model.currentSource().name();
    });

    self.newSource = function () {
      self.selectedSource(new Source());
      self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedSource()));
    };

    self.save = function () {
      var source = {
        name: self.selectedSource().name() || null,
        key: self.selectedSource().key() || null,
        dialect: self.selectedSource().dialect() || null,
        connectionString: self.selectedSource().connectionString() || null,
        username: self.selectedSource().username() || null,
        password: self.selectedSource().password() || null,
        daimons: ko.toJS(self.selectedSource().daimons()).filter(function(d){ return d.enabled; }).map(function(d){
          return lodash.omit(d, ['enabled']);
        }),
      };
      self.loading(true);
      sourceApi.saveSource(self.selectedSourceId(), source)
        .then(sourceApi.initSourcesConfig)
        .then(function (appStatus) {
          sharedState.appInitializationStatus(appStatus);
          return vocabularyProvider.getDomains();
        })
        .then(roleApi.updateRoles)
        .then(function () {
          self.goToConfigure();
        })
        .always(function () { 
          self.loading(false);
          self.selectedSource(null);
          self.selectedSourceId(null);
          self.dirtyFlag().reset();
        });
    };

    self.close = function () {
      if (self.dirtyFlag().isDirty() && !confirm('Source changes are not saved. Would you like to continue?')){
        return;
      }
      self.selectedSource(null);
      self.selectedSourceId(null);
      self.dirtyFlag().reset();
      self.goToConfigure();
    };

    self.hasSelectedPriotirizableDaimons = function() {
        const otherSources = sharedState.sources().filter(s => s.sourceId !== self.selectedSource().sourceId);
        const otherPriotirizableDaimons = lodash.flatten(
            otherSources.map(s => s.daimons.filter(d => priotirizableDaimonTypes.includes(d.daimonType)))
        );
        const currenPriotirizableDaimons = self.selectedSource().daimons().filter(d => priotirizableDaimonTypes.includes(d.daimonType));
        const notSelectedCurrentDaimons = currenPriotirizableDaimons.filter(currentDaimon => {
            // Daimon of the type with higher priority exists
            return  otherPriotirizableDaimons.find(otherDaimon => currentDaimon.daimonType === otherDaimon.daimonType && currentDaimon.priority < otherDaimon.priority);
        });
        return notSelectedCurrentDaimons.length !== currenPriotirizableDaimons.length;
    };

    self.delete = function () {
      if (self.hasSelectedPriotirizableDaimons()) {
          alert('Some daimons of this source were given highest priority and are in use by application. Select new top-priority diamons to delete the source');
          return;
      }
      if (!confirm('Delete source? Warning: deletion can not be undone!')){
        return;
      }
      self.loading(true);
      sourceApi.deleteSource(self.selectedSourceId())
        .then(sourceApi.initSourcesConfig)
        .then(function (appStatus) {
            sharedState.appInitializationStatus(appStatus);
            return roleApi.updateRoles();
        })
        .then(function () {
          self.loading(false);
          self.goToConfigure();
        })
        .catch(self.loading(false));
    };

    self.goToConfigure = function () {
      document.location = '#/configure';
    };

    self.init = function () {
		if (self.hasAccess()) {				
			if (self.selectedSourceId() == null && self.selectedSource() == null) {
				self.newSource();
			} else {
				self.loading(true);
				sourceApi.getSource(self.selectedSourceId())
					.then(function(source){
						self.selectedSource(new Source(source));
						self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedSource()));
						self.loading(false);
					});
			}
		}
    };

    self.init();
    self.dispose = function () {

    };
  }

  var component = {
    viewModel: source,
    template: view,
  };

  ko.components.register('source-manager', component);
  return component;
});