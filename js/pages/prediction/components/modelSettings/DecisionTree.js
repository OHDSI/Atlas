define([
	'knockout', 
	'text!./DecisionTree.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class DecisionTree extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('DecisionTree', DecisionTree, view);;
});