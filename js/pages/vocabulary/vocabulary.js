define([
	'knockout',
	'text!./vocabulary.html',
	'pages/Page',
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

				this.model = params.model;
				this.searchParams = {
					model: this.model
				};
			}
		}

		return commonUtils.build('vocabulary', Vocabulary, view);
	});
