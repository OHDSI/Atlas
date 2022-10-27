define(['knockout',
		'text!./users-import.html',
		'appConfig',
		'atlas-state',
		'services/AuthAPI',
		'services/User',
		'services/role',
		'utils/AutoBind',
		'components/Component',
		'utils/CommonUtils',
		'utils/Renderers',
		'./const',
		'./services/JobService',
		'services/Poll',
		'./components/step-header',
		'./components/ldap-groups',
		'./components/atlas-roles',
		'./components/role-group-mapping',
		'components/ac-access-denied',
		'less!./users-import.less',
		'components/modal',
		'components/heading'
	],
	function (
		ko,
		view,
		config,
		sharedState,
		authApi,
		userService,
		roleService,
		AutoBind,
		Component,
		commonUtils,
		renderers,
		Const,
		jobService,
		{PollService},
	) {

		class UsersImport extends AutoBind(Component) {

			get transitions() {
				return {
					'providers': {next: Const.WIZARD_STEPS.MAPPING,},
					'mapping': {prev: Const.WIZARD_STEPS.PROVIDERS, next: Const.WIZARD_STEPS.IMPORT, handler: this.testConnection,},
					'import' : {prev: Const.WIZARD_STEPS.MAPPING, next: Const.WIZARD_STEPS.FINISH, handler: () => { this.saveMapping(); this.findUsers(); return true; },},
					'finish' : {handler: this.startImport, enabled: this.isImportEnabled },
				};
			}

			constructor(params) {
				super(params);
				this.dtApi = ko.observable();
				this.config = config;
				this.loading = ko.observable();
				this.providers = ko.observable();
				this.isAuthenticated = authApi.isAuthenticated;
				this.canImport = ko.pureComputed(() => this.isAuthenticated() && authApi.isPermittedImportUsers());
				this.hasMultipleProviders = ko.pureComputed(() => this.providers() && !!this.providers().ldapUrl && !!this.providers().adUrl);
				this.hasMultipleProviders.subscribe((newValue) => {
					this.wizardStep(newValue ? this.WIZARD_STEPS.PROVIDERS : this.WIZARD_STEPS.MAPPING);
					this.importProvider(!!this.providers().adUrl ? Const.PROVIDERS.ACTIVE_DIRECTORY : Const.PROVIDERS.LDAP);
				});
				this.WIZARD_STEPS = Const.WIZARD_STEPS;
				this.wizardStep = ko.observable();
				this.hasPrevious = ko.computed(() => !!this.getStep('prev'));
				this.hasNext = ko.computed(() => !!this.getStep());
				this.stepMessage = ko.observable('User import from directory has started...');
				this.isLastStep = () => this.getStep() === Const.WIZARD_STEPS.FINISH;
				this.getNextClasses = () => ['btn', 'btn-sm', this.isLastStep() ? 'btn-success' : 'btn-primary'];
				this.nextTitle = ko.computed(() => this.isLastStep()
						? ko.i18n('configuration.userImport.wizard.buttons.startImport', 'Start import')()
						: ko.i18n('configuration.userImport.wizard.buttons.next', 'Next')());
				this.nextClasses = ko.computed(() => this.classes({ extra: this.getNextClasses(), }));
				// form inputs
				this.importProvider = ko.observable(Const.PROVIDERS.ACTIVE_DIRECTORY);
				this.roles = sharedState.roles;
				this.rolesMapping = ko.observableArray();
				this.selectedRole = ko.observable();
				this.selectedUser = ko.observable();
				this.selectedRoles = ko.observable();
				this.ldapGroups = ko.observableArray();
				this.usersList = ko.observableArray();
				this.linkClasses = this.classes('link');
				this.connectionCheck = ko.observable();
				this.infoMessageClass = ko.computed(() => {
					const modifier = this.connectionCheck() ? String(this.connectionCheck().state).toLowerCase() : '';
					return this.classes('info-message', modifier);
				});
				this.preventNext = false;
				this.isShowLoginHelp = ko.observable();
				this.isShowUsernameHelp = ko.observable();

				this.importProvider.subscribe(() => {
					this.rolesMapping().forEach(row => row.groups = ko.observableArray());
					this.usersList.removeAll();
				});

				this.connectionCheck.subscribe(() => {
					if (this.connectionCheck() && this.connectionCheck().state === 'SUCCESS') {
						this.loadMapping();
						if (!this.preventNext) {
							this.wizardStep(Const.WIZARD_STEPS.MAPPING);
						}
					}
				});

				this.isSearchGroupDialog = ko.observable();
				this.isAtlasRolesDialog = ko.observable();
				this.pollId = null;
				this.tableOptions = commonUtils.getTableOptions('L');
				this.init();
			}


			getStep(dir) {
				const direction = dir || 'next';
				const vertex = this.transitions[this.wizardStep()] || {};
				const value = vertex[direction];
				return (typeof value === 'function') ? value() : value;
			}

			nextStep() {
				const next = this.getStep();
				this.preventNext = false;
				if (next) {
					const handler = this.transitions[next].handler;
					const handlerType = typeof handler;
					if (handlerType !== 'function' || (handlerType === 'function' && handler())) {
						this.wizardStep(next);
					}
				}
			}

			prevStep() {
				const prev = this.getStep('prev');
				if (prev) {
					this.wizardStep(prev);
				}
			}

			isImportEnabled() {
				return this.usersList() && this.usersList().some(u => !!u.included());
			}

			testConnection() {
				userService.testConnection(this.importProvider())
					.then((data) => this.connectionCheck(data))
					.catch(this.connectionCheck({state: 'FAILED', message: ko.i18n('configuration.userImport.wizard.provider.connection.failed', 'Connection failed. Please see server logs for details.')}));
			}

			testConnectionClick() {
				this.preventNext = true;
				this.testConnection();
			}

			startPolling(jobId) {
				this.pollId = PollService.add({
					callback: () => this.updateJobStatus(jobId),
					interval: config.pollInterval,
				});
			};

			stopPolling() {
					PollService.stop(this.pollId);
			};

			async updateJobStatus(jobId) {
				const data = await jobService.getJob(jobId);
				if (data.closed) {
					this.loading(false);
					userService.getUsers().then(data => sharedState.users(data));
					this.stopPolling();
					this.stepMessage('User import from directory has finished...');
				}
			}

			startImport() {
				if (!this.isImportEnabled()) {
					return false;
				}
				this.loading(true);
				const users = this.usersList()
					.filter(u => !!u.included())
					.map(u => ({
							login: u.login, displayName: u.displayName, roles: u.roles(),
					}));
				userService.importUsers(users, this.importProvider()).then(job => {
					this.startPolling(job.id);
				});
				return true;
			}

			findUsers() {
				this.loading(true);
				const mapping = {
					provider: this.importProvider(),
					roleGroups: this.rolesMapping().map(m => ({
						role: {
							id: m.id,
							role: m.role,
						},
						groups: m.groups,
					})),
				};
				userService.searchUsers(this.importProvider(), mapping)
					.then(users => this.usersList(users.map(user => ({
							...user,
							roles: ko.observableArray(user.roles),
							included: ko.observable(),
						})))
					).finally(() => this.loading(false));
				return true;
			}

			saveMapping() {
				if (this.rolesMapping()) {
					const mapping = {
						provider: this.importProvider(),
						roleGroups: jobService.mapRoleGroups(this.rolesMapping()),
					};
					userService.saveMapping(this.importProvider(), mapping);
				}
			}

			loadMapping() {
				userService.getMapping(this.importProvider()).then(mapping => {
					const roles = this.rolesMapping();
					roles.forEach(role => {
						const mapped = mapping.roleGroups.find(m => m.role.id === role.id);
						role.groups(mapped ? mapped.groups : []);
					});
				});
				return true;
			}

			onRolesRowClick(data) {
				this.selectedRole(data);
				this.isSearchGroupDialog(true);
			}

			onUsersRowClick(data) {
				this.selectedUser(data);
				this.selectedRoles(this.roles().filter(role => !role.defaultImported).map(r => ({
					...r,
					selected: ko.observable(data.roles().find(role => role.role === r.role)),
				})));
				this.isAtlasRolesDialog(true);
			}

			renderGroups(data, type, row) {
				return (row || []).groups().map(group => group.displayName).sort().join(", ");
			}

			renderRoles(data, type, row) {
				const label = (row && row.roles && row.roles().length > 0) ? row.roles().map(role => role.role).sort().join(", ") : 'No roles';
				return '<span data-bind="click: function(d){ $component.onUsersRowClick(d) }, css: $component.linkClasses">' + label + '</span>';
			}

			renderStatus(data, type, row) {
				const status = Const.IMPORT_STATUS[row.status];
				return status || Const.IMPORT_STATUS.UNKNOWN;
			}

			renderCheckbox(field) {
				return renderers.renderCheckbox(field);
			}

			checkAll() {
				this.toggleAll(true);
			}

			uncheckAll() {
				this.toggleAll(false);
			}

			toggleAll(select) {
				if (this.usersList()) {
					this.usersList().forEach(user => user.included(select));
				}
			}

			closeGroupModal() {
				this.isSearchGroupDialog(false);
			}

			closeRolesModal() {
				this.isAtlasRolesDialog(false);
			}

			setGroupMapping() {
				const selectedGroups = this.ldapGroups().filter(g => g.included()).map(g => {
					delete g.included;
					return g;
				});
				this.selectedRole().groups(selectedGroups);
				this.closeGroupModal();
			}

			setRoles() {
				if (this.selectedUser()) {
					this.selectedUser().roles(this.selectedRoles().filter(r => r.selected()).map(r => ({
						role: r.role,
						id: r.id,
					})));
					this.usersList.valueHasMutated();
				}
				this.closeRolesModal();
			}

			showUsernameHelp() {
				this.isShowUsernameHelp(true);
			}

			showLoginHelp() {
				this.isShowLoginHelp(true);
			}

			init() {
				this.loading(true);
				userService.getAuthenticationProviders().then(providers => {
					this.providers(providers);
				}).finally(() => this.loading(false));
				roleService.updateRoles().then(() => {
					const mapping = this.roles().filter(role => !role.defaultImported).map(role => (
						{
							...role,
							groups: ko.observableArray(),
						}
					));
					this.rolesMapping(mapping);
				});
			}
		}

		commonUtils.build('users-import', UsersImport, view);
	});