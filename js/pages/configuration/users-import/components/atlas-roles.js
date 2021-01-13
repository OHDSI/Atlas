define([
	'knockout',
	'text!./atlas-roles.html',
	'components/Component',
	'utils/CommonUtils',
	'utils/Renderers',
],
	function(
		ko,
		view,
		Component,
		commonUtils,
		renderers,
	){

		class AtlasRoles extends Component {
			constructor(params) {
				super(params);
				this.roles = params.roles || [];
				this.tableOptions = commonUtils.getTableOptions('L');
				this.renderCheckbox = this.renderCheckbox.bind(this);
			}

			renderCheckbox(field) {
				return renderers.renderCheckbox(field);
			}
		}

		commonUtils.build('atlas-roles', AtlasRoles, view);
	}
);