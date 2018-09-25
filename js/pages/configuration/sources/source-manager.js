define([
  'knockout',
  'text!./source-manager.html',
  'providers/Component',
  'providers/AutoBind',
  'utils/CommonUtils',
  'appConfig',
  'assets/ohdsi.util',
  'webapi/SourceAPI',
  'services/RoleService',
  'lodash',
  'webapi/AuthAPI',
  'components/ac-access-denied',
  'less!./source-manager.less',
  'components/heading',
],
  function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
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

    var data = data || {};

    this.name = ko.observable(data.sourceName || null);
    this.key = ko.observable(data.sourceKey || null);
    this.dialect = ko.observable(data.sourceDialect || null);
    this.connectionString = ko.observable(data.connectionString || null);
    this.username = ko.observable(data.username || null);
    this.password = ko.observable(data.password || null);
    this.daimons = ko.observableArray(mapDaimons(data.daimons));
    this.keytabName = ko.observable(data.keytabName);
    this.krbAuthMethod = ko.observable(data.krbAuthMethod);
    this.krbAdminServer = ko.observable(data.krbAdminServer);

    return this;
  }

  class SourceManager extends AutoBind(Component) {
    constructor(params) {
      super(params);
      this.config = config;
      this.model = params.model;
      this.loading = ko.observable(false);
      this.dirtyFlag = this.model.currentSourceDirtyFlag;
      this.selectedSource = params.model.currentSource;
      this.selectedSourceId = params.model.selectedSourceId;
      this.options = {};
      this.isAuthenticated = authApi.isAuthenticated;

      this.hasAccess = ko.pureComputed(() => {
        if (!config.userAuthenticationEnabled) {
          return false;
        } else {
          return this.isAuthenticated() && authApi.isPermittedEditConfiguration();
        }
      });

      this.canReadSource = ko.pureComputed(() => {
        return authApi.isPermittedReadSource(this.selectedSourceId()) || !this.selectedSourceId();
      });

      this.isDeletePermitted = ko.pureComputed(() => {
        return authApi.isPermittedDeleteSource(this.selectedSource().key());
      });

      this.canEdit = ko.pureComputed(() => {
        return authApi.isPermittedEditSource(this.selectedSourceId());
      });

      this.canSave = ko.pureComputed(() => {
        return (
          this.selectedSource()
          && this.selectedSource().name()
          && this.selectedSource().key()
          && this.selectedSource().connectionString()
          && this.canEdit()
        );
      });

      this.canDelete = () => {
        return (
          this.selectedSource()
          && this.selectedSource().key()
          && this.isDeletePermitted()
        );
      };

      this.canEditKey = ko.pureComputed(() => {
        return !this.selectedSourceId();
      });

      this.options.dialectOptions = [
        { name: 'PostgreSQL', id: 'postgresql' },
        { name: 'SQL server', id: 'sqlserver' },
        { name: 'Oracle', id: 'oracle' },
        { name: 'Amazon Redshift', id: 'redshift' },
        { name: 'Google BigQuery', id: 'bigquery' },
        { name: 'Impala', id: 'impala' },
        { name: 'Microsoft PDW', id: 'pdw' },
        { name: 'IBM Netezza', id: 'netezza' },
      ];

      this.sourceCaption = ko.computed(() => {
        return (this.model.currentSource() == null || this.model.currentSource().key() == null) ? 'New source' :
          'Source ' + this.model.currentSource().name();
      });
      this.isKrbAuth = ko.computed(() => {
          return this.impalaConnectionStringIncludes("AuthMech=1");
      });
        
      this.krbHostFQDN = ko.computed(() => {

        if (this.isImpalaDS() && this.isNonEmptyConnectionString()) {
            var str = this.selectedSource().connectionString();
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

      this.krbRealm = ko.computed(() => {

          if (this.isImpalaDS() && this.isNonEmptyConnectionString()) {
            var str = this.selectedSource().connectionString();
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
      this.init();

      this.fieldsVisibility = {
        username: ko.computed(() => !this.isImpalaDS() || this.isKrbAuth()),
        password: ko.computed(() => !this.isImpalaDS()),
        krbAuthSettings: this.isKrbAuth,
        showKeytab: ko.computed(() => {
          return this.isKrbAuth() && this.selectedSource().krbAuthMethod() === 'keytab';
        }),
        krbFileInput: ko.computed(() => {
          return this.isKrbAuth() && (typeof this.selectedSource().keytabName() !== 'string' || this.selectedSource().keytabName().length === 0);
        }),
        // warnings
        hostWarning: ko.computed(() => {
          var showWarning = this.isKrbAuth() && this.krbHostFQDN() === "";
          if (showWarning){
              this.dirtyFlag().reset();
          }
          return showWarning;
        }),
        realmWarning: ko.computed(() => {
          var showWarning = this.isKrbAuth() && this.krbRealm() === "";
          if (showWarning) {
              this.dirtyFlag().reset();
          }
          return showWarning;
        }),
        userWarning: ko.computed(() => {
          var showWarning = this.selectedSource() != null && this.selectedSource().username() === "";
          if (showWarning) {
              this.dirtyFlag().reset();
          }
          return showWarning;
        }),
      };
    }

    newSource() {
      this.selectedSource(new Source());
      this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedSource()));
    }

    isImpalaDS() {
      return this.selectedSource() && this.selectedSource().dialect() === 'impala';
    }

    isNonEmptyConnectionString() {
      return this.selectedSource() != null && typeof this.selectedSource().connectionString() === 'string' && this.selectedSource().connectionString().length > 0;
    }

    impalaConnectionStringIncludes(substr) {
      return this.isImpalaDS() && this.isNonEmptyConnectionString() && this.selectedSource().connectionString().includes(substr);
    }

    removeKeytab() {
      $('#keytabFile').val(''); // TODO: create "ref" directive
      this.keytab = null;
      this.selectedSource().keytabName(null);
    }

    uploadFile(file) {
      this.keytab = file;
      this.selectedSource().keytabName(file.name)
    }

    async save() {
      var source = {
        name: this.selectedSource().name() || null,
        key: this.selectedSource().key() || null,
        dialect: this.selectedSource().dialect() || null,
        connectionString: this.selectedSource().connectionString() || null,
        krbAuthMethod: this.selectedSource().krbAuthMethod() || "password",
        krbAdminServer: this.selectedSource().krbAdminServer() || null,
        username: this.selectedSource().username() || null,
        password: this.selectedSource().password() || null,
        daimons: ko.toJS(this.selectedSource().daimons()).filter(function(d) { return d.enabled; }).map(function(d) {
          return lodash.omit(d, ['enabled']);
        }),
        keytabName: this.selectedSource().keytabName(),
        keytab: this.keytab,
      };
      this.loading(true);
      try {
        await sourceApi.saveSource(this.selectedSourceId(), source);
        await sourceApi.initSourcesConfig();
        const roles = await roleService.find();
        this.model.roles(roles);
        this.loading(false);
        this.goToConfigure();
      } catch(er) {
        console.error('Error updating role', er);
        this.loading(false);
      }
    }

    close() {
      if (this.dirtyFlag().isDirty() && !confirm('Source changes are not saved. Would you like to continue?')) {
        return;
      }
      this.selectedSource(null);
      this.selectedSourceId(null);
      this.dirtyFlag().reset();
      this.goToConfigure();
    }

    async delete() {
      if (!confirm('Delete source? Warning: deletion can not be undone!')) {
        return;
      }
      this.loading(true);
      try {
        await sourceApi.deleteSource(this.selectedSourceId())
        await sourceApi.initSourcesConfig();
        const roles = await roleService.find();
        this.model.roles(roles);
        this.loading(false);
        this.goToConfigure();
      } catch(er) {
        console.error('Error deleting source', er);        
        this.loading(false);
      }
    }

    goToConfigure() {
      document.location = '#/configure';
    }

    init() {
      if (this.hasAccess()) {
        if (this.selectedSourceId() == null && this.selectedSource() == null) {
          this.newSource();
        } else {
          this.loading(true);
          sourceApi.getSource(this.selectedSourceId())
            .then((source) => {
              this.selectedSource(new Source(source));
              this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedSource()));
              this.loading(false);
            });
        }
      }
    }
    
  }

  return commonUtils.build('source-manager', SourceManager, view);
});
