define(['knockout',
		'text!./users-import.html',
		'appConfig',
		'atlas-state',
		'webapi/AuthAPI',
		'providers/Users',
		'providers/Component',
		'utils/CommonUtils',
		'./const',
		'./components/step-header',
		'./components/ldap-groups',
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
		Const) {

		const transitions = {
			'providers': {next: Const.WIZARD_STEPS.MAPPING,},
			'mapping': {prev: Const.WIZARD_STEPS.PROVIDERS, next: Const.WIZARD_STEPS.IMPORT,},
			'import' : {prev: Const.WIZARD_STEPS.MAPPING,},
		};

		class UsersImport extends Component{
			
			constructor(params) {
				super(params);
				this.loading = ko.observable();
				this.providers = ko.observable();
				this.isAuthenticated = authApi.isAuthenticated;
				this.hasMultipleProviders = ko.pureComputed(() => this.providers() && !!this.providers().ldapUrl && !!this.providers().adUrl);
				this.WIZARD_STEPS = Const.WIZARD_STEPS;
				this.wizardStep = ko.observable(this.WIZARD_STEPS.PROVIDERS);
				this.hasPrevious = ko.computed(() => !!this.getStep('prev'));
				this.hasNext = ko.computed(() => !!this.getStep());
				// form inputs
				this.importProvider = ko.observable(Const.PROVIDERS.ACTIVE_DIRECTORY);
				this.updateRoles = params.model.updateRoles;
				this.roles = sharedState.roles;
				this.rolesMapping = ko.observableArray();
				this.selectedRole = ko.observable();
				this.ldapGroups = ko.observableArray();

				this.isSearchGroupDialog = ko.observable();
				//bindings
				this.init = this.init.bind(this);
				this.getStep = this.getStep.bind(this);
				this.nextStep = this.nextStep.bind(this);
				this.prevStep = this.prevStep.bind(this);
				this.onRowClick = this.onRowClick.bind(this);
				this.closeModal = this.closeModal.bind(this);
				this.setGroupMapping = this.setGroupMapping.bind(this);

				this.init();
			}

			getStep(dir) {
				const direction = dir || 'next';
				const vertex = transitions[this.wizardStep()] || {};
				const value = vertex[direction];
				return (typeof value === 'function') ? value() : value;
			}

			nextStep() {
				const next = this.getStep();
				if (next) {
					this.wizardStep(next);
				}
			}

			prevStep() {
				const prev = this.getStep('prev');
				if (prev) {
					this.wizardStep(prev);
				}
			}

			onRowClick(data) {
				this.selectedRole(data);
				this.isSearchGroupDialog(true);
			}

			renderGroups(data, type, row) {
				return (row || []).groups().map(group => group.displayName).sort().join(", ");
			}

			closeModal() {
				this.isSearchGroupDialog(false);
			}

			setGroupMapping() {
				const selectedGroups = this.ldapGroups().filter(g => g.included()).map(g => {
					delete g.included;
					return g;
				});
				this.selectedRole().groups(selectedGroups);
				this.closeModal();
			}

			init() {
				this.loading(true);
				usersApi.getAuthenticationProviders().then(providers => {
					this.providers(providers);
					this.loading(false);
				});
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