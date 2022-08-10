define(['knockout', 'services/MomentAPI'], function (ko, momentApi) {

	function Concept(data) {
		var self = this;
		data = data || {};

        self.CONCEPT_CLASS_ID = data.CONCEPT_CLASS_ID;
		self.CONCEPT_CODE = data.CONCEPT_CODE;
		self.CONCEPT_ID = data.CONCEPT_ID;
		self.CONCEPT_NAME = data.CONCEPT_NAME;
		self.DOMAIN_ID = data.DOMAIN_ID;
        self.INVALID_REASON = data.INVALID_REASON;
        self.INVALID_REASON_CAPTION = data.INVALID_REASON_CAPTION;
        self.STANDARD_CONCEPT = data.STANDARD_CONCEPT;
        self.STANDARD_CONCEPT_CAPTION = data.STANDARD_CONCEPT_CAPTION;
		self.VOCABULARY_ID = data.VOCABULARY_ID;
		self.VALID_START_DATE = momentApi.formatDateTimeWithFormat(data.VALID_START_DATE, momentApi.ISO_DATE_FORMAT);
		self.VALID_END_DATE = momentApi.formatDateTimeWithFormat(data.VALID_END_DATE, momentApi.ISO_DATE_FORMAT);
	}

	return Concept;
});