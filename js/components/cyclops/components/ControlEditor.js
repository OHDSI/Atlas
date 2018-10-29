define([
	'knockout', 
	'text!./ControlEditor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../options',
    'databindings',
    'less!../cyclops.less',
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
		}
	}

	return commonUtils.build('cyclops-control-editor', ControlEditor, view);
});