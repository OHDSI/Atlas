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

			this.searchParams = {
				query: ko.observable(),
			};
		}

        onRouterParamsChanged({ query }) {
			if (query !== undefined) {
                this.searchParams.query(query);
			}
        }
	}

	return commonUtils.build('vocabulary', Vocabulary, view);
});
