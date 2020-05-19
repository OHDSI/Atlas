define([
	'text!./terms-and-conditions-content-en.html',
	'text!./terms-and-conditions-content-ru.html',
	'text!./terms-and-conditions-content-ko.html',
	'less!./terms-and-conditions.less'
], function (contentEn, contentRu, contentKo) {

	var termsAndConditions = {
    contents: {
    	en: contentEn,
    	ru: contentRu,
			ko: contentKo
		},
    acceptanceExpiresInDays: 30
  };

	return {
		termsAndConditions
	};
});