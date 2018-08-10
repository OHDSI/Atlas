define([
	'knockout',
	'text!./ldap-groups.html',
	'providers/Component',
	'utils/CommonUtils',
	'services/UserService',
	'./renderers',
	'less!./ldap-groups.less',
],
	function(
		ko,
		view,
		Component,
		commonUtils,
		userApi,
		renderers,
	){

		class LdapGroups extends Component {

			constructor(params){
				super(params);
				this.searchResults = params.searchResults || ko.observableArray();
				this.searchText = ko.observable("");
				this.loading = ko.observable();
				this.provider = params.provider || ko.observable("ad");
				this.role = params.role || ko.observable();

				this.role.subscribe((newRole) => {
					this.searchResults([]);
					this.searchText("");
				});

				this.searchGroups = this.searchGroups.bind(this);
				this.onSubmitSearch = this.onSubmitSearch.bind(this);
				this.renderCheckbox = this.renderCheckbox.bind(this);
			}

			searchGroups() {
				this.loading(true);
				userApi.searchGroups(this.provider(), this.searchText())
					.then(results => {
						this.searchResults(results.map(group => ({...group, included: ko.observable() })));
					}).finally(() => this.loading(false));
			}

			onSubmitSearch(data, event) {
				if (event.keyCode === 13) {
					this.searchGroups();
				}
			}

			renderCheckbox(field) {
				return renderers.renderCheckbox(field);
			}

		}

		commonUtils.build('ldap-groups', LdapGroups, view);

	}
);