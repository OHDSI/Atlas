define([
	'knockout', 
	'text!./LassoLogisticRegression.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class LassoLogisticRegression extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('LassoLogisticRegression', LassoLogisticRegression, view);;
});