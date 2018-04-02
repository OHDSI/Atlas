define(['knockout', 'text!./source-manager.html', 'appConfig', 'ohdsi.util', 'webapi/SourceAPI', 'webapi/RoleAPI', 'lodash', 'access-denied'],
  function (ko, view, config, ohdsiUtil, sourceApi, roleApi, lodash) {

  var defaultDaimons = {
    CDM: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Vocabulary: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Results: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Evidence: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
  };

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
    self.selectedSourceKey = params.model.selectedSourceKey;

    self.options = {};

    self.isAuthenticated = authApi.isAuthenticated;

    self.canReadSource = function() {
      return (config.userAuthenticationEnabled && self.isAuthenticated()
        && authApi.isPermittedReadSource(self.selectedSourceKey())) || !config.userAuthenticationEnabled
        || !self.selectedSourceKey();
    };

    self.isDeletePermitted = function() {
      return (config.userAuthenticationEnabled && self.isAuthenticated() &&
        authApi.isPermittedDeleteSource(self.selectedSource().key())) || !config.userAuthenticationEnabled;
    };

    self.canEdit = function() {
      return (config.userAuthenticationEnabled && self.isAuthenticated() &&
        authApi.isPermittedEditSource(self.selectedSourceKey())) || !config.userAuthenticationEnabled;
    };

    self.canSave = function () {
      console.log('canEdit', self.canEdit());
      return (self.selectedSource() && self.selectedSource().name() && self.selectedSource().key()
        && self.selectedSource().connectionString() && self.canEdit());
    };

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
        daimons: ko.toJS(self.selectedSource().daimons()).filter(function(d){ return d.enabled; }).map(function(d){
          return lodash.omit(d, ['enabled']);
        }),
      };
      sourceApi.saveSource(self.selectedSourceKey(), source)
        .then(function(){
          return sourceApi.initSourcesConfig();
        })
        .then(function(){
          return roleApi.updateRoles();
        })
        .then(function () {
          self.goToConfigure();
        });
    };

    self.close = function () {
      if (self.dirtyFlag().isDirty() && !confirm('Source changes are not saved. Would you like to continue?')){
        return;
      }
      self.selectedSource(null);
      self.selectedSourceKey(null);
      self.dirtyFlag().reset();
      self.goToConfigure();
    };

    self.delete = function () {
      if (!confirm('Delete source? Warning: deletion can not be undone!')){
        return;
      }
      sourceApi.deleteSource(self.selectedSourceKey())
        .then(function () {
          return sourceApi.initSourcesConfig();
        })
        .then(function() {
          return roleApi.updateRoles();
        })
        .then(function () {
          self.goToConfigure();
        });
    };

    self.goToConfigure = function () {
      document.location = '#/configure';
    };

    self.init = function () {
      if (self.selectedSourceKey() == null && self.selectedSource() == null) {
        self.newSource();
      } else {
        self.loading(true);
        sourceApi.getSource(self.selectedSourceKey())
          .then(function(source){
            self.selectedSource(new Source(source));
            self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedSource()));
            self.loading(false);
          });
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