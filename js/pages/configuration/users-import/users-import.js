define(['knockout',
		'text!./users-import.html',
		'appConfig',
		'atlas-state',
		'webapi/AuthAPI',
		'services/UserService',
		'providers/Component',
		'utils/CommonUtils',
		'./components/renderers',
		'./const',
		'./components/step-header',
		'./components/ldap-groups',
		'./components/atlas-roles',
		'components/ac-access-denied',
		'less!./users-import.less',
	],
	function (
		ko, 
		view, 
		config,
		sharedState,
		authApi, 
		usersApi,
		Component,
		commonUtils,
		renderers,
		Const) {

		class UsersImport extends Component{

			get transitions() {
				return {
					'providers': {next: Const.WIZARD_STEPS.MAPPING,},
					'mapping': {prev: Const.WIZARD_STEPS.PROVIDERS, next: Const.WIZARD_STEPS.IMPORT, handler: this.loadMapping,},
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
				this.isLastStep = () => this.getStep() === Const.WIZARD_STEPS.FINISH;
				this.getNextClasses = () => ['btn', 'btn-sm', this.isLastStep() ? 'btn-success' : 'btn-primary'];
				this.nextTitle = ko.computed(() => this.isLastStep() ? 'Start import' : 'Next' );
				this.nextClasses = ko.computed(() => this.classes({ extra: this.getNextClasses(), }));
				// form inputs
				this.importProvider = ko.observable(Const.PROVIDERS.ACTIVE_DIRECTORY);
				this.updateRoles = params.model.updateRoles;
				this.roles = sharedState.roles;
				this.rolesMapping = ko.observableArray();
				this.selectedRole = ko.observable();
				this.selectedUser = ko.observable();
				this.selectedRoles = ko.observable();
				this.ldapGroups = ko.observableArray();
				this.usersList = ko.observableArray();
				this.linkClasses = this.classes('link');

				this.importProvider.subscribe(() => {
					this.rolesMapping().forEach(row => row.groups = ko.observableArray());
					this.usersList.removeAll();
				});

				this.isSearchGroupDialog = ko.observable();
				this.isAtlasRolesDialog = ko.observable();
				//bindings
				this.init = this.init.bind(this);
				this.getStep = this.getStep.bind(this);
				this.nextStep = this.nextStep.bind(this);
				this.prevStep = this.prevStep.bind(this);
				this.onRolesRowClick = this.onRolesRowClick.bind(this);
				this.onUsersRowClick = this.onUsersRowClick.bind(this);
				this.closeGroupModal = this.closeGroupModal.bind(this);
				this.closeRolesModal = this.closeRolesModal.bind(this);
				this.setGroupMapping = this.setGroupMapping.bind(this);
				this.findUsers = this.findUsers.bind(this);
				this.renderGroups = this.renderGroups.bind(this);
				this.renderRoles = this.renderRoles.bind(this);
				this.renderCheckbox = this.renderCheckbox.bind(this);
				this.checkAll = this.checkAll.bind(this);
				this.uncheckAll = this.uncheckAll.bind(this);
				this.toggleAll = this.toggleAll.bind(this);
				this.isImportEnabled = this.isImportEnabled.bind(this);
				this.startImport = this.startImport.bind(this);
				this.setRoles = this.setRoles.bind(this);
				this.saveMapping = this.saveMapping.bind(this);
				this.loadMapping = this.loadMapping.bind(this);

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

			startImport() {
				if (!this.isImportEnabled()) {
					return false;
				}
				this.loading(true);
				const users = this.usersList()
					.filter(u => !!u.included())
					.map(u => ({ login: u.login, roles: u.roles(), }));
				usersApi.importUsers(users).finally(() => this.loading(false));
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
				usersApi.searchUsers(this.importProvider(), mapping)
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
						roleGroups: this.rolesMapping().map(item => ({
							role: { id: item.id, role: item.role },
							groups: item.groups,
						})),
					};
					usersApi.saveMapping(this.importProvider(), mapping);
				}
			}

			loadMapping() {
				usersApi.getMapping(this.importProvider()).then(mapping => {
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
				this.selectedRoles(this.roles().map(r => ({
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
				return '<a data-bind="click: function(d){ $component.onUsersRowClick(d) }, css: $component.linkClasses">' + label + '</a>';
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

			init() {
				this.loading(true);
				usersApi.getAuthenticationProviders().then(providers => {
					this.providers(providers);
				}).finally(() => this.loading(false));
				this.updateRoles().then(() => {
					const mapping = this.roles().map(role => (
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