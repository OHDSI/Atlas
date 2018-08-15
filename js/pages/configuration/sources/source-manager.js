define([
  'knockout',
  'text!./source-manager.html',
  'appConfig',
  'assets/ohdsi.util',
  'webapi/SourceAPI',
  'services/role',
  'lodash',
  'webapi/AuthAPI',
  'components/ac-access-denied',
  'less!./source-manager.less'
],
  function (
    ko,
    view,
    config,
    ohdsiUtil,
    sourceApi,
    roleService,
    lodash,
    authApi
  ) {

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
    self.username = ko.observable(data.username || null);
    self.password = ko.observable(data.password || null);
    self.daimons = ko.observableArray(mapDaimons(data.daimons));
    self.keytabName = ko.observable(data.keytabName);
    self.krbAuthMethod = ko.observable(data.krbAuthMethod);
    self.krbAdminServer = ko.observable(data.krbAdminServer);

    self.shouldShowFileInput = ko.computed(() => {
        return typeof self.keytabName() !== 'string' || self.keytabName().length === 0;
    });

    return self;
  }

  function source(params) {
    var self = this;
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

      function isNonEmptyImpalaConnectionString() {
          return self.selectedSource() != null && self.selectedSource().dialect() === 'impala' && typeof self.selectedSource().connectionString() === 'string' && self.selectedSource().connectionString().length > 0;
      }

      function impalaConnectionStringIncludes(substr) {
          return isNonEmptyImpalaConnectionString() && self.selectedSource().connectionString().includes(substr);
      }

      self.showKrbAuth = ko.computed(() => {
          return impalaConnectionStringIncludes("AuthMech=1");
      });

      self.showUsernameAuth = ko.computed(() => {
          return impalaConnectionStringIncludes("AuthMech=2");
      });

      self.showUsernamePwdAuth = ko.computed(() => {
          return impalaConnectionStringIncludes("AuthMech=3");
      });

    self.krbHostFQDN = ko.computed(() => {

      if (isNonEmptyImpalaConnectionString()) {
          var str = self.selectedSource().connectionString();
          var strArray = str.match(/KrbHostFQDN=(.*?);/);
          if (strArray != null){
              var matchedStr = strArray[0];
              return matchedStr.substring(matchedStr.search("=") + 1, matchedStr.length - 1);
          } else {
              return "";
          }
      }
      return "";
    });

    self.krbRealm = ko.computed(() => {

        if (isNonEmptyImpalaConnectionString()) {
          var str = self.selectedSource().connectionString();
          var strArray = str.match(/KrbRealm=(.*?);/);
          if (strArray != null){
            var matchedStr = strArray[0];
            return matchedStr.substring(matchedStr.search("=") + 1, matchedStr.length - 1);
          } else {
            return "";
          }
      }
      return "";
    });

    self.showHostWarning  = ko.computed(() => {

      var showWarning = self.showKrbAuth() && self.krbHostFQDN() === "";
      if (showWarning){
          self.dirtyFlag().reset();
      }
        return showWarning;
    });

    self.showRealmWarning = ko.computed(() => {

        var showWarning = self.showKrbAuth() && self.krbRealm() === "";
        if (showWarning){
            self.dirtyFlag().reset();
        }
        return showWarning;
    });

    self.showUserWarning  = ko.computed(() => {

        var showWarning = self.selectedSource() != null && self.selectedSource().username() === "";
        if (showWarning){
            self.dirtyFlag().reset();
        }
        return showWarning;
    });

    self.showKeytabDiv = ko.computed(() => {
        return self.selectedSource() != null && self.selectedSource().krbAuthMethod() === 'keytab';
    });

    self.removeKeytab = function () {
        $('#keytabFile').val(''); // TODO: create "ref" directive
        keytab = null;
        self.selectedSource().keytabName(null);
    };

    let keytab;

      self.uploadFile = function (file) {
          keytab = file;
          self.selectedSource().keytabName(file.name)
      };

    self.save = function () {
      var source = {
        name: self.selectedSource().name() || null,
        key: self.selectedSource().key() || null,
        dialect: self.selectedSource().dialect() || null,
        connectionString: self.selectedSource().connectionString() || null,
        krbAuthMethod: self.selectedSource().krbAuthMethod() || "password",
        krbAdminServer: self.selectedSource().krbAdminServer() || null,
        username: self.selectedSource().username() || null,
        password: self.selectedSource().password() || null,
        daimons: ko.toJS(self.selectedSource().daimons()).filter(function(d){ return d.enabled; }).map(function(d){
          return lodash.omit(d, ['enabled']);
        }),
        keytabName: self.selectedSource().keytabName(),
        keytab: keytab,
      };
      self.loading(true);
      sourceApi.saveSource(self.selectedSourceId(), source)
        .then(() => sourceApi.initSourcesConfig())
        .then(() => {
          roleService.getRoles()
            .then(({ data: roles }) => {
              self.model.roles(roles);
              self.loading(false);
              self.goToConfigure();
            });
        })
        .catch(function () { self.loading(false); });
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

    self.delete = function () {
      if (!confirm('Delete source? Warning: deletion can not be undone!')){
        return;
      }
      self.loading(true);
      sourceApi.deleteSource(self.selectedSourceId())
        .then(sourceApi.initSourcesConfig)
        .then(() => roleService.getRoles())
        .then(({ data: roles }) => {
          self.model.roles(roles);
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
