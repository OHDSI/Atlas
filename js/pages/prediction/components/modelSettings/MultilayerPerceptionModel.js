define([
	'knockout', 
	'text!./MultilayerPerceptionModel.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class MultilayerPerceptionModel extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('MultilayerPerceptionModel', MultilayerPerceptionModel, view);;
});