define([
	'knockout',
	'text!./ldap-groups.html',
	'providers/Component',
	'utils/CommonUtils',
	'providers/Users',
	'less!./ldap-groups.less',
],
	function(
		ko,
		view,
		Component,
		commonUtils,
		userApi
	){

		class LdapGroups extends Component {

			constructor(params){
				super(params);
				this.searchResults = params.searchResults || ko.observableArray();
				this.searchText = ko.observable("");
				this.loading = ko.observable();
				this.provider = params.provider || ko.observable("ad");
				this.role = params.role || ko.observable();
				this.dtApi = ko.observable();

				this.role.subscribe((newRole) => {
					this.searchResults([]);
					this.searchText("");
				});

				this.onRowClick = this.onRowClick.bind(this);
				this.searchGroups = this.searchGroups.bind(this);
				this.onSubmitSearch = this.onSubmitSearch.bind(this);
				this.renderCheckbox = this.renderCheckbox.bind(this);
			}

			searchGroups() {
				this.loading(true);
				userApi.searchGroups(this.provider(), this.searchText())
					.then(results => {
						this.loading(false);
						this.searchResults(results.map(group => ({...group, included: ko.observable() })));
					});
			}

			onRowClick(data) {
				console.log(data);
			}

			onSubmitSearch(data, event) {
				if (event.keyCode === 13) {
					this.searchGroups();
				}
			}

			renderCheckbox(field) {
					return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } , css: { selected: ' + field + '}" class="fa fa-check"></span>';
			}

		}

		commonUtils.build('ldap-groups', LdapGroups, view);

	}
);