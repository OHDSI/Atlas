define(['text!./terms-and-conditions-content.html'], function (content) {
	var termsAndConditions = {
    header: 'SNOMED International SNOMED CT Browser License Agreement',
    description: 'In order to use the SNOMED International SNOMED CT Browser, please accept the following license agreement:',
    content,
    acceptanceExpiresInDays: 30,
  };

	return {
		termsAndConditions
	};
});