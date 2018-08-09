define(['knockout', 'text!./source-manager.html', 'appConfig', 'assets/ohdsi.util', 'webapi/SourceAPI', 'webapi/RoleAPI', 'lodash', 'components/ac-access-denied'],
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
    self.username = ko.observable(data.username || null);
    self.password = ko.observable(data.password || null);
    self.daimons = ko.observableArray(mapDaimons(data.daimons));
    self.keytabName = ko.observable(data.keytabName);
    self.authType = ko.observable(data.authType);
    if (data.keytabName === null){
        self.shouldShowFileInput = ko.observable(true);
    } else {
        self.shouldShowFileInput = ko.observable(false);
    }
    return self;
  }

  function source(params) {
    var self = this;
    var authApi = params.model.authApi;
    self.config = config;
    self.model = params.model;
    self.loading = ko.observable(false);
    self.shouldShowFileInput = ko.observable();
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

    self.krbHostFQDN = ko.computed(() => {

      if (self.selectedSource() != null) {
          var str = self.selectedSource().connectionString();
          str = str.match(/KrbHostFQDN=(.*?);/)[0];
          return str.substring(str.search("=")+1, str.length-1);
      }
    });

    self.krbRealm = ko.computed(() => {

      if (self.selectedSource() != null) {
          var str = self.selectedSource().connectionString();
          str = str.match(/KrbRealm=(.*?);/)[0];
          return str.substring(str.search("=")+1, str.length-1);
      }
    });

    self.showKeytabDiv = ko.computed(() => {
        return self.selectedSource() != null && self.selectedSource().authType() === 'keytab';
    });

    self.showKrbAuth = ko.computed(() => {
        return self.selectedSource() != null && self.selectedSource().connectionString().includes("AuthMech=1");
    });

    self.newSource = function () {
      self.selectedSource(new Source());
      self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedSource()));
    };

    self.removeKeytab = function () {
        self.loading(true);
        sourceApi.removeKeytab(self.selectedSourceId())
            .then(function () {
                self.selectedSource().shouldShowFileInput(true);
                self.loading(false);
            },
                function () {
                self.loading(false);
            });
    };

    var keytab;

      self.uploadFile = function (file) {
          keytab = file;
          self.dirtyFlag().makeDirty();
      };

    self.save = function () {
      var source = {
        name: self.selectedSource().name() || null,
        key: self.selectedSource().key() || null,
        dialect: self.selectedSource().dialect() || null,
        connectionString: self.selectedSource().connectionString() || null,
        authType: self.selectedSource().authType() || "password",
        username: self.selectedSource().username() || null,
        password: self.selectedSource().password() || null,
        daimons: ko.toJS(self.selectedSource().daimons()).filter(function(d){ return d.enabled; }).map(function(d){
          return lodash.omit(d, ['enabled']);
        }),
        keytab: keytab,
      };
      self.loading(true);
      sourceApi.saveSource(self.selectedSourceId(), source)
        .then(sourceApi.initSourcesConfig)
        .then(roleApi.updateRoles)
        .then(function () {
          self.loading(false);
          self.goToConfigure();
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
        .then(roleApi.updateRoles)
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