define([
	'knockout', 
	'text!./control-editor.html',	
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
	class ControlEditor extends Component {
		constructor(params) {
            super(params);

			this.control = ko.isObservable(params.control) ? params.control() : params.control;
			this.options = options;
			this.isEditPermitted = params.isEditPermitted;
		}
	}

	return commonUtils.build('cyclops-control-editor', ControlEditor, view);
});