define([
	'knockout', 
	'text!./RandomForest.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class RandomForest extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('RandomForest', RandomForest, view);;
});