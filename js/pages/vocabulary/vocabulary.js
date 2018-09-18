define([
	'knockout',
	'text!./vocabulary.html',
	'providers/Page',
	'./components/search',
	'./components/import',
	'utils/CommonUtils',
	'components/heading',
	'less!./vocabulary.less'
], function (
	ko,
	view,
	Page,
	searchTab,
	importTab,
	commonUtils
) {
	class Vocabulary extends Page {
		constructor(params) {
			super(params);
		}
	}

	return commonUtils.build('vocabulary', Vocabulary, view);
});
