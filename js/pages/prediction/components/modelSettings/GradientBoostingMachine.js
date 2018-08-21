define([
	'knockout', 
	'text!./GradientBoostingMachine.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class GradientBoostingMachine extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('GradientBoostingMachine', GradientBoostingMachine, view);;
});