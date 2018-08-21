define([
	'knockout', 
	'text!./KNearestNeighbors.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class KNearestNeighbors extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('KNearestNeighbors', KNearestNeighbors, view);;
});