define([
  'knockout',
  'text!./source-manager.html',
  'components/Component',
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
], (
  ko,
  view,
  Component,
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
  constants,
) => {
  const defaultDaimons = {
    CDM: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Vocabulary: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Results: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    CEM: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    CEMResults: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
    Temp: { tableQualifier: '', enabled: false, priority: 0, sourceDaimonId: null },
  };

  class Source {
    constructor(data = {}) {
      const {
        sourceName = 'New Source',
        sourceKey = null,
        sourceDialect = null,
        connectionString = null,
        username = null,
        password = null,
        daimons = [],
        keytabName = null,
        krbAuthMethod = null,
        krbAdminServer = null,
        sourceId = null,
      } = data;

      this.name = ko.observable(sourceName);
      this.key = ko.observable(sourceKey);
      this.dialect = ko.observable(sourceDialect);
      this.connectionString = ko.observable(connectionString);
      this.username = ko.observable(username);
      this.password = ko.observable(password);
      this.daimons = ko.observableArray(this.mapDaimons(daimons));
      this.keytabName = ko.observable(keytabName);
      this.krbAuthMethod = ko.observable(krbAuthMethod);
      this.krbAdminServer = ko.observable(krbAdminServer);
      this.sourceId = ko.observable(sourceId);
    }

    mapDaimons(daimons = []) {
      const defaultKeys = Object.keys(defaultDaimons);
      const keys = daimons.map(({ diamonType }) => diamonType);
      const result = daimons.map(({ tableQuailifier, ...rest }) => ({
        tableQuailifier: ko.observable(tableQuailifier),
        enabled: ko.observable(true),
        ...rest,
      }));
      const diff = lodash.difference(defaultKeys, keys).map(key => ({
        ...defaultDaimons[key],
        daimonType: key,
        enabled: ko.observable(false),
      }));

      return lodash.concat(result, diff);
    }
  }

  class SourceManager extends AutoBind(Component) {
    constructor(params) {
      super(params);
      this.config = config;
      this.model = params.model;
      this.loading = ko.observable(false);
      this.dirtyFlag = sharedState.ConfigurationSource.dirtyFlag;
      this.selectedSource = sharedState.ConfigurationSource.current;
      this.selectedSourceId = sharedState.ConfigurationSource.selectedId;
      this.options = {};
      this.isAuthenticated = authApi.isAuthenticated;

      this.hasAccess = ko.pureComputed(() => {
        if (!config.userAuthenticationEnabled) {
          return false;
        }
        return this.isAuthenticated() && authApi.isPermittedEditConfiguration();
      });

      this.canReadSource = ko.pureComputed(() => authApi.isPermittedReadSource(this.selectedSourceId()) || !this.selectedSourceId());
      this.isDeletePermitted = ko.pureComputed(() => authApi.isPermittedDeleteSource(this.selectedSource().key()));
      this.canEdit = ko.pureComputed(() =>  authApi.isPermittedEditSource(this.selectedSourceId()));
      this.isNameCorrect = ko.computed(() => this.selectedSource() && this.selectedSource().name());
      this.canSave = ko.pureComputed(() => {
        return (
          this.isNameCorrect() &&
          this.selectedSource().key() &&
          this.selectedSource().connectionString() &&
          this.canEdit()
        );
      });
      this.canDelete = ko.pureComputed(() => this.selectedSource() && this.selectedSource().key() && this.isDeletePermitted());
      this.canEditKey = ko.pureComputed(() => !this.selectedSourceId());

      this.options.dialectOptions = [
        { name: 'PostgreSQL', id: 'postgresql' },
        { name: 'SQL server', id: 'sql server' },
        { name: 'Oracle', id: 'oracle' },
        { name: 'Amazon Redshift', id: 'redshift' },
        { name: 'Google BigQuery', id: 'bigquery' },
        { name: 'Impala', id: 'impala' },
        { name: 'Microsoft PDW', id: 'pdw' },
        { name: 'IBM Netezza', id: 'netezza' },
      ];

      this.sourceCaption = ko.computed(() => {
        return !this.model.currentSource() || !this.model.currentSource().key()
          ? 'New source'
          : `Source ${this.model.currentSource().name()}`;
      });
      this.isKrbAuth = ko.computed(() =>  this.impalaConnectionStringIncludes('AuthMech=1'));
      this.krbRealm = ko.computed(() => this.getKrbString(/KrbRealm=(.*?);/));
      this.krbHostFQDN = ko.computed(() => this.getKrbString(/KrbHostFQDN=(.*?);/));

      this.init();

      this.fieldsVisibility = {
        username: ko.computed(() => !this.isImpalaDS() || this.isKrbAuth()),
        password: ko.computed(() => !this.isImpalaDS()),
        krbAuthSettings: this.isKrbAuth,
        showKeytab: ko.computed(() => this.isKrbAuth() && this.selectedSource().krbAuthMethod() === 'keytab'),
        krbFileInput: ko.computed(() => {
          return (
            this.isKrbAuth() &&
            (typeof this.selectedSource().keytabName() !== 'string' ||
            this.selectedSource().keytabName().length === 0)
          );
        }),
        // warnings
        hostWarning: ko.computed(() => {
          const showWarning = this.isKrbAuth() && this.krbHostFQDN() === '';
          showWarning && this.dirtyFlag().reset();
          return showWarning;
        }),
        realmWarning: ko.computed(() => {
          const showWarning = this.isKrbAuth() && this.krbRealm() === '';
          showWarning && this.dirtyFlag().reset();
          return showWarning;
        }),
        userWarning: ko.computed(() => {
          const showWarning = this.selectedSource() != null && this.selectedSource().username() === '';
          showWarning && this.dirtyFlag().reset();
          return showWarning;
        }),
      };
    }

    getKrbString(regex) {
      if (this.isImpalaDS() && this.isNonEmptyConnectionString()) {
        const str = this.selectedSource().connectionString();
        const strArray = str.match(regex);
        if (!!strArray  && Array.isArray(strArray)) {
          const matchedStr = strArray[0];
          return matchedStr.substring( matchedStr.search('=') + 1, matchedStr.length - 1);
        }
        return '';
      }
      return '';
    }

    newSource() {
      this.selectedSource(new Source());
      this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedSource()));
    }

    isImpalaDS() {
      return this.selectedSource() && this.selectedSource().dialect() === 'impala';
    }

    isNonEmptyConnectionString() {
      return (
        this.selectedSource() != null &&
        typeof this.selectedSource().connectionString() === 'string' &&
        this.selectedSource().connectionString().length > 0
      );
    }

    impalaConnectionStringIncludes(substr) {
      return (
        this.isImpalaDS() &&
        this.isNonEmptyConnectionString() &&
        this.selectedSource()
          .connectionString()
          .includes(substr)
      );
    }

    removeKeytab() {
      $('#keytabFile').val(''); // TODO: create "ref" directive
      this.keytab = null;
      this.selectedSource().keytabName(null);
    }

    uploadFile(file) {
      this.keytab = file;
      this.selectedSource().keytabName(file.name);
    }

    getSource() {
      return {
        name: this.selectedSource().name() || null,
        key: this.selectedSource().key() || null,
        dialect: this.selectedSource().dialect() || null,
        connectionString: this.selectedSource().connectionString() || null,
        krbAuthMethod: this.selectedSource().krbAuthMethod() || 'password',
        krbAdminServer: this.selectedSource().krbAdminServer() || null,
        username: this.selectedSource().username() || null,
        password: this.selectedSource().password() || null,
        daimons: ko
          .toJS(this.selectedSource().daimons())
          .filter(({ enabled }) => enabled)
          .map(({ enabled, ...rest }) => rest),
        keytabName: this.selectedSource().keytabName(),
        keytab: this.keytab,
      };
    }

    async save() {
      const source = this.getSource();
      this.loading(true);
      try {
        await sourceApi.saveSource(this.selectedSourceId(), source);
        const appStatus = await sourceApi.initSourcesConfig();
        sharedState.appInitializationStatus(appStatus);
        await vocabularyProvider.getDomains();
        const roles = await roleService.getList();
        sharedState.roles(roles);
        this.goToConfigure();
      } catch ({ data }) {
        this.loading(false);
        const message = !!data && !!data.payload && !!data.payload.message ? data.payload.message : 'Please contact your administrator to resolve this issue.';
        alert(message);
      }
    }

    close() {
      if (this.dirtyFlag().isDirty() && !confirm('Source changes are not saved. Would you like to continue?')) {
        return true;
      }
      this.selectedSource(null);
      this.selectedSourceId(null);
      this.dirtyFlag().reset();
      this.goToConfigure();
    }

    hasSelectedPriotirizableDaimons() {
      const otherSources = sharedState
        .sources()
        .filter(s => s.sourceId !== this.selectedSource().sourceId);
      const otherPriotirizableDaimons = lodash.flatten(
        otherSources.map(s =>
          s.daimons.filter(d =>
            constants.priotirizableDaimonTypes.includes(d.daimonType) &&
            d.sourceDaimonId,
          ),
        ),
      );
      const currenPriotirizableDaimons = this.selectedSource()
        .daimons()
        .filter(d => constants.priotirizableDaimonTypes.includes(d.daimonType) && d.sourceDaimonId);
      const notSelectedCurrentDaimons = currenPriotirizableDaimons.filter(currentDaimon => {
        // Daimon of the type with higher priority exists
        return otherPriotirizableDaimons.find(
          otherDaimon =>
            currentDaimon.daimonType === otherDaimon.daimonType &&
            currentDaimon.priority < otherDaimon.priority,
        );
      });
      return notSelectedCurrentDaimons.length !== currenPriotirizableDaimons.length;
    }

    async delete() {
      if (this.hasSelectedPriotirizableDaimons()) {
        alert('Some daimons of this source were given highest priority and are in use by application. Select new top-priority daimons to delete the source');
        return true;
      }
      if (!confirm('Delete source? Warning: deletion can not be undone!')) {
        return true;
      }

      this.loading(true);

      try {
        await sourceApi.deleteSource(this.selectedSourceId());
        const appStatus = await sourceApi.initSourcesConfig();
        sharedState.appInitializationStatus(appStatus);
        const roles = await roleService.getList();
        sharedState.roles(roles);
        this.goToConfigure();
      } catch (e) {
        console.log(e);
      } finally {
        this.loading(false);
      }
    }

    goToConfigure() {
      commonUtils.routeTo('/configure');
    }

    async init() {
      if (this.hasAccess()) {
        if (!!this.selectedSourceId()) {
          this.loading(true);
          try {
            const source = await sourceApi.getSource(this.selectedSourceId());
            this.selectedSource(new Source(source));
            this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedSource()));
          } catch (e) {
            console.error(e);
          } finally {
            this.loading(false);
          }
        } else {
          this.newSource();
        }
      }
    }
  }

  return commonUtils.build('source-manager', SourceManager, view);
});
