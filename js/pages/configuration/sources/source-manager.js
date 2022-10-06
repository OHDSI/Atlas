define([
  'knockout',
  'text!./source-manager.html',
  'pages/Page',
  'utils/AutoBind',
  'utils/CommonUtils',
  'appConfig',
  'services/Vocabulary',
  'assets/ohdsi.util',
  'services/SourceAPI',
  'services/role',
  'lodash',
  'services/AuthAPI',
  'atlas-state',
  'pages/configuration/const',
  'components/ac-access-denied',
  'less!./source-manager.less',
  'components/heading',
],
  function (
    ko,
    view,
    Page,
    AutoBind,
    commonUtils,
    config,
    vocabularyProvider,
    ohdsiUtil,
    sourceApi,
    roleService,
    lodash,
    authApi,
    sharedState,
    constants
  ) {


  //todo yar should we translate daimons?
  var defaultDaimons = {
    CDM: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Vocabulary: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Results: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    CEM: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    CEMResults: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Temp: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
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

    this.sourceId = ko.observable(data.sourceId || 0);
    this.name = ko.observable(data.sourceName || ko.unwrap(ko.i18n('configuration.newSource', 'New Source')));
    this.key = ko.observable(data.sourceKey || null);
    this.dialect = ko.observable(data.sourceDialect || null);
    this.connectionString = ko.observable(data.connectionString || null);
    this.username = ko.observable(data.username || null);
    this.password = ko.observable(data.password || null);
    this.daimons = ko.observableArray(mapDaimons(data.daimons));
    this.keyfileName = ko.observable(data.keyfileName);
    this.krbAuthMethod = ko.observable(data.krbAuthMethod);
    this.krbAdminServer = ko.observable(data.krbAdminServer);

    return this;
  }

  class SourceManager extends AutoBind(Page) {
    constructor(params) {
      super(params);
      this.config = config;
      this.roles = sharedState.roles;
      this.loading = ko.observable(false);
      this.dirtyFlag = sharedState.ConfigurationSource.dirtyFlag;
      this.selectedSource = sharedState.ConfigurationSource.current;
      this.selectedSourceId = sharedState.ConfigurationSource.selectedId;
      this.options = {};
      this.isAuthenticated = authApi.isAuthenticated;
      this.roles = sharedState.roles;
      this.appInitializationStatus = sharedState.appInitializationStatus;

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
        return authApi.isPermittedDeleteSource(this.selectedSource() && this.selectedSource().key());
      });

      this.canEdit = ko.pureComputed(() => {
        return authApi.isPermittedEditSource(this.selectedSourceId());
      });

      this.isNameCorrect = ko.computed(() => {
          return this.selectedSource() && this.selectedSource().name();
      });
      this.isNew = ko.pureComputed(() => {
        return parseInt(this.selectedSourceId()) === 0;
      })
      this.canSave = ko.pureComputed(() => {
        return (
          this.isNameCorrect()
          && this.selectedSource().key()
          && this.selectedSource().connectionString()
          && this.canEdit()
        );
      });

      this.canDelete = () => {
        return (
          this.selectedSource()
          && !this.isNew()
          && this.selectedSource().key()
          && this.isDeletePermitted()
        );
      };

      this.canEditKey = ko.pureComputed(this.isNew);



      this.options.dialectOptions = [
        { id: 'postgresql', name: ko.i18n('configuration.viewEdit.dialect.options.postgresql', 'PostgreSQL') },
        { id: 'sql server', name: ko.i18n('configuration.viewEdit.dialect.options.sqlserver', 'SQL server') },
        { id: 'oracle', name: ko.i18n('configuration.viewEdit.dialect.options.oracle', 'Oracle') },
        { id: 'redshift', name: ko.i18n('configuration.viewEdit.dialect.options.redshift', 'Amazon Redshift') },
        { id: 'bigquery', name: ko.i18n('configuration.viewEdit.dialect.options.bigquery', 'Google BigQuery') },
        { id: 'impala', name: ko.i18n('configuration.viewEdit.dialect.options.impala', 'Impala') },
        { id: 'pdw', name: ko.i18n('configuration.viewEdit.dialect.options.pdw', 'Microsoft PDW') },
        { id: 'netezza', name: ko.i18n('configuration.viewEdit.dialect.options.netezza', 'IBM Netezza') },
        { id: 'hive', name: ko.i18n('configuration.viewEdit.dialect.options.hive', 'Hive LLAP')},
        { id: 'spark', name: ko.i18n('configuration.viewEdit.dialect.options.spark', 'Spark')},
        { id: 'snowflake', name: ko.i18n('configuration.viewEdit.dialect.options.snowflake', 'Snowflake')},
        { id: 'synapse', name: ko.i18n('configuration.viewEdit.dialect.options.synapse', 'Azure Synapse') },
      ];

      this.sourceCaption = ko.computed(() => {
        return (this.selectedSource() == null || this.selectedSource().key() == null) ? ko.i18n('const.newEntityNames.source', 'New Source') : ko.i18nformat('configuration.viewEdit.source.title', 'Source <%=name%>', {name: this.selectedSource().name()});
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

      this.fieldsVisibility = {
        username: ko.computed(() => !this.supportsKeyfileAuth() || this.isKrbAuth()),
        password: ko.computed(() => !this.supportsKeyfileAuth()),
        krbAuthSettings: ko.computed(() => this.isKrbAuth()),
        krbFileInput: ko.computed(() => {
          return this.isKrbAuth() && (typeof this.selectedSource().keyfileName() !== 'string' || this.selectedSource().keyfileName().length === 0);
        }),
        showKrbKeyfile: ko.computed(() => this.isImpalaDS() && this.selectedSource().krbAuthMethod() === 'keytab'),
        bigQueryAuthSettings: ko.computed(() => this.isBigQueryDS()),
        bqFileInput: ko.computed(() => {
          return this.isBigQueryDS() && (typeof this.selectedSource().keyfileName() !== 'string' || this.selectedSource().keyfileName().length === 0);
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

    supportsKeyfileAuth() {
      return this.isImpalaDS() || this.isBigQueryDS();
    }

    isImpalaDS() {
      return this.selectedSource() && this.selectedSource().dialect() === 'impala';
    }

    isBigQueryDS() {
      return this.selectedSource() && this.selectedSource().dialect() === 'bigquery';
    }

    isNonEmptyConnectionString() {
      return this.selectedSource() != null && typeof this.selectedSource().connectionString() === 'string' && this.selectedSource().connectionString().length > 0;
    }

    impalaConnectionStringIncludes(substr) {
      return this.isImpalaDS() && this.isNonEmptyConnectionString() && this.selectedSource().connectionString().includes(substr);
    }

    removeKeyfile() {
      $('#keyfile').val(''); // TODO: create "ref" directive
      this.keyfile = null;
      this.selectedSource().keyfileName(null);
    }

    uploadFile(file) {
      this.keyfile = file;
      this.selectedSource().keyfileName(file.name)
    }

    async save() {
      const source = {
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
        keyfileName: this.selectedSource().keyfileName(),
        keyfile: this.keyfile,
      };
      try {
        this.loading(true);
        const sourceId = this.isNew() ? null : this.selectedSourceId();
        await sourceApi.saveSource(sourceId, source);
        const appStatus = await sourceApi.initSourcesConfig();
        this.appInitializationStatus(appStatus);
        await vocabularyProvider.getDomains();
        const roles = await roleService.getList();
        this.roles(roles);
        this.goToConfigure();
      } catch ({ data = {} }) {
        this.loading(false);
        const {
          payload: {
            message = ko.unwrap(ko.i18n('configuration.viewEdit.source.alerts.save.errorMessage', 'Please contact your administrator to resolve this issue.'))
          } = {}
        } = data;
        alert(ko.unwrap(ko.i18nformat('configuration.viewEdit.source.alerts.save.error', 'The Source was not saved. <%= message %>', {message: message})));
      }
    }

    close() {

      if (this.dirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('configuration.viewEdit.source.confirms.close', 'Source changes are not saved. Would you like to continue?')))) {
        return;
      }
      this.goToConfigure();
    }

    hasSelectedPriotirizableDaimons() {
		const otherSources = sharedState.sources().filter(s => s.sourceId !== this.selectedSource().sourceId);
		const otherPriotirizableDaimons = lodash.flatten(
			otherSources.map(s => s.daimons.filter(d => constants.priotirizableDaimonTypes.includes(d.daimonType) && d.sourceDaimonId))
		);
		const currenPriotirizableDaimons = this.selectedSource().daimons().filter(d => constants.priotirizableDaimonTypes.includes(d.daimonType) && d.sourceDaimonId);
		const notSelectedCurrentDaimons = currenPriotirizableDaimons.filter(currentDaimon => {
			// Daimon of the type with higher priority exists
			return  otherPriotirizableDaimons.find(otherDaimon => currentDaimon.daimonType === otherDaimon.daimonType && currentDaimon.priority < otherDaimon.priority);
		});
		return notSelectedCurrentDaimons.length !== currenPriotirizableDaimons.length;
    }

    async delete() {
      if (this.hasSelectedPriotirizableDaimons()) {
        alert(ko.unwrap(ko.i18n('configuration.viewEdit.source.alerts.delete.hasSelectedPriotirizableDaimons', 'Some daimons of this source were given highest priority and are in use by application. Select new top-priority diamons to delete the source.')));
        return;
      }

      if (!confirm(ko.unwrap(ko.i18n('configuration.viewEdit.source.confirms.delete', 'Delete source? Warning: deletion can not be undone!')))) {
        return;
      }
      try {
        this.loading(true);
        await sourceApi.deleteSource(this.selectedSourceId());
        const appStatus = await sourceApi.initSourcesConfig();
        this.appInitializationStatus(appStatus);
        const roles = await roleService.getList();
        this.roles(roles);
        this.goToConfigure();
      } catch (err) {
        console.error(err);
      } finally {
        this.loading(false);
      }
    }

    goToConfigure() {
      this.selectedSource(null);
      this.selectedSourceId(null);
      this.dirtyFlag().reset();
      commonUtils.routeTo('/configure');
    }

    onRouterParamsChanged(params = {}) {
      const selectedSourceId = parseInt(this.selectedSourceId());
      if (this.isNew() && !this.dirtyFlag().isDirty()) {
        this.newSource();
      } else if (selectedSourceId > 0 && selectedSourceId !== (this.selectedSource() && this.selectedSource().sourceId())) {
        this.onSourceSelected();
      }
    }

    async onSourceSelected() {
      if (this.hasAccess()) {
        try {
          this.loading(true);
          const source = await sourceApi.getSource(this.selectedSourceId());
          this.selectedSource(new Source(source));
          this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedSource()));
        } catch (e) {
          console.error(e);
          alert(ko.unwrap(ko.i18nformat('configuration.viewEdit.source.alerts.sourceSelectedError', 'An error occurred while attempting to get a source with id=<%=selectedSourceId%>.', {selectedSourceId: this.selectedSourceId()})));
          commonUtils.routeTo('/configure');
        } finally {
          this.loading(false);
        }
      }
    }
  }

  return commonUtils.build('source-manager', SourceManager, view);
});
