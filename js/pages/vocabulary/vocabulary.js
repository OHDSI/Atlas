define([
	'knockout',
	'text!./vocabulary.html',
	'providers/Component',
	'./components/search',
	'./components/import',
	'utils/CommonUtils',
	'components/heading',
	'less!./vocabulary.less'
], function (
	ko,
	view,
	Component,
	searchTab,
	importTab,
	commonUtils
) {
	class Vocabulary extends Component {
		constructor(params) {
			super(params);
			this.componentParams = params;
			return this;
		}
	}

	return commonUtils.build('vocabulary', Vocabulary, view);
});
