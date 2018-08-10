define([
	'knockout',
	'text!./atlas-roles.html',
	'providers/Component',
	'utils/CommonUtils',
	'./renderers',
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

				this.renderCheckbox = this.renderCheckbox.bind(this);
			}

			renderCheckbox(field) {
				return renderers.renderCheckbox(field);
			}
		}

		commonUtils.build('atlas-roles', AtlasRoles, view);
	}
);