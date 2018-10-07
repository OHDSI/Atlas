define([
	'knockout', 
	'text!./ControlEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
	consts,
) {
	class ControlEditor extends Component {
		constructor(params) {
            super(params);

			this.control = ko.isObservable(params.control) ? params.control() : params.control;
			this.options = options;
		}
	}

	return commonUtils.build('cyclops-control-editor', ControlEditor, view);
});