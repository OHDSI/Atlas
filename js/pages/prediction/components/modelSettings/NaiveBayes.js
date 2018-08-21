define([
	'knockout', 
	'text!./NaiveBayes.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class NaiveBayes extends Component {
		constructor(params) {
            super(params);
		}
	}

	return commonUtils.build('NaiveBayes', NaiveBayes, view);;
});