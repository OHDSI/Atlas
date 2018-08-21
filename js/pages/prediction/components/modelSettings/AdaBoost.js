define([
	'knockout', 
	'text!./AdaBoost.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class AdaBoost extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('AdaBoost', AdaBoost, view);;
});