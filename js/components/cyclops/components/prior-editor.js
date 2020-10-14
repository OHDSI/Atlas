define([
	'knockout', 
	'text!./prior-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class PriorEditor extends Component {
		constructor(params) {
            super(params);

			this.prior = ko.isObservable(params.prior) ? params.prior() : params.prior;
			this.options = options;
			this.isEditPermitted = params.isEditPermitted;
		}
	}

	return commonUtils.build('cyclops-prior-editor', PriorEditor, view);
});