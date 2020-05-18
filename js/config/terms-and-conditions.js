define(['text!./terms-and-conditions-content.html', 'less!./terms-and-conditions.less'], function (content) {

	var termsAndConditions = {
    content,
    acceptanceExpiresInDays: 30,
  };

	return {
		termsAndConditions
	};
});