define(['text!./terms-and-conditions-content.html', 'less!./terms-and-conditions.less',], function (content) {
	var termsAndConditions = {
    header: 'License Agreement',
    description: 'In order to use the SNOMED International SNOMED CT Browser and HemOnc, please accept the following license agreement:',
    content,
    acceptanceExpiresInDays: 30,
  };

	return {
		termsAndConditions
	};
});