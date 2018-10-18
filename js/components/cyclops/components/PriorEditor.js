define([
	'knockout', 
	'text!./PriorEditor.html',	
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
	class PriorEditor extends Component {
		constructor(params) {
            super(params);

			this.prior = ko.isObservable(params.prior) ? params.prior() : params.prior;
			this.options = options;
		}
	}

	return commonUtils.build('cyclops-prior-editor', PriorEditor, view);
});