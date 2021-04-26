define([
	'text!./terms-and-conditions-content-en.html',
	'text!./terms-and-conditions-content-ru.html',
	'text!./terms-and-conditions-content-ko.html',
	'text!./terms-and-conditions-content-zh.html',
	'less!./terms-and-conditions.less'
], function (contentEn, contentRu, contentKo, contentZh) {

	var termsAndConditions = {
		contents: {
			en: contentEn,
			ru: contentRu,
			ko: contentKo,
			zh: contentZh
		},
		acceptanceExpiresInDays: 30
	};

	return {
		termsAndConditions
	};
});