define(['knockout'], function (ko) {

	function TemporalCovariateSettings(data) {
		var self = this;
		data = data || {};

        self.temporal = ko.observable(data.temporal === 0 ? false : data.temporal || true);
        self.DemographicsGender = ko.observable(data.DemographicsGender === 0 ? 0 : data.DemographicsGender || false);
        self.DemographicsAge = ko.observable(data.DemographicsAge === 0 ? 0 : data.DemographicsAge || false);
        self.DemographicsAgeGroup = ko.observable(data.DemographicsAgeGroup === 0 ? 0 : data.DemographicsAgeGroup || false);
        self.DemographicsRace = ko.observable(data.DemographicsRace === 0 ? 0 : data.DemographicsRace || false);
        self.DemographicsEthnicity = ko.observable(data.DemographicsEthnicity === 0 ? 0 : data.DemographicsEthnicity || false);
        self.DemographicsIndexYear = ko.observable(data.DemographicsIndexYear === 0 ? 0 : data.DemographicsIndexYear || false);
        self.DemographicsIndexMonth = ko.observable(data.DemographicsIndexMonth === 0 ? 0 : data.DemographicsIndexMonth || false);
        self.DemographicsPriorObservationTime = ko.observable(data.DemographicsPriorObservationTime === 0 ? 0 : data.DemographicsPriorObservationTime || false);
        self.DemographicsPostObservationTime = ko.observable(data.DemographicsPostObservationTime === 0 ? 0 : data.DemographicsPostObservationTime || false);
        self.DemographicsTimeInCohort = ko.observable(data.DemographicsTimeInCohort === 0 ? 0 : data.DemographicsTimeInCohort || false);
        self.DemographicsIndexYearMonth = ko.observable(data.DemographicsIndexYearMonth === 0 ? 0 : data.DemographicsIndexYearMonth || false);
        self.ConditionOccurrence = ko.observable(data.ConditionOccurrence === 0 ? 0 : data.ConditionOccurrence || false);
        self.ConditionOccurrencePrimaryInpatient = ko.observable(data.ConditionOccurrencePrimaryInpatient === 0 ? 0 : data.ConditionOccurrencePrimaryInpatient || false);
        self.ConditionEraStart = ko.observable(data.ConditionEraStart === 0 ? 0 : data.ConditionEraStart || false);
        self.ConditionEraOverlap = ko.observable(data.ConditionEraOverlap === 0 ? 0 : data.ConditionEraOverlap || false);
        self.ConditionEraGroupStart = ko.observable(data.ConditionEraGroupStart === 0 ? 0 : data.ConditionEraGroupStart || false);
        self.ConditionEraGroupOverlap = ko.observable(data.ConditionEraGroupOverlap === 0 ? 0 : data.ConditionEraGroupOverlap || false);
        self.DrugExposure = ko.observable(data.DrugExposure === 0 ? 0 : data.DrugExposure || false);
        self.DrugEraStart = ko.observable(data.DrugEraStart === 0 ? 0 : data.DrugEraStart || false);
        self.DrugEraOverlap = ko.observable(data.DrugEraOverlap === 0 ? 0 : data.DrugEraOverlap || false);
        self.DrugEraGroupStart = ko.observable(data.DrugEraGroupStart === 0 ? 0 : data.DrugEraGroupStart || false);
        self.DrugEraGroupOverlap = ko.observable(data.DrugEraGroupOverlap === 0 ? 0 : data.DrugEraGroupOverlap || false);
        self.ProcedureOccurrence = ko.observable(data.ProcedureOccurrence === 0 ? 0 : data.ProcedureOccurrence || false);
        self.DeviceExposure = ko.observable(data.DeviceExposure === 0 ? 0 : data.DeviceExposure || false);
        self.Measurement = ko.observable(data.Measurement === 0 ? 0 : data.Measurement || false);
        self.MeasurementValue = ko.observable(data.MeasurementValue === 0 ? 0 : data.MeasurementValue || false);
        self.MeasurementRangeGroup = ko.observable(data.MeasurementRangeGroup === 0 ? 0 : data.MeasurementRangeGroup || false);
        self.Observation = ko.observable(data.Observation === 0 ? 0 : data.Observation || false);
        self.CharlsonIndex = ko.observable(data.CharlsonIndex === 0 ? 0 : data.CharlsonIndex || false);
        self.Dcsi = ko.observable(data.Dcsi === 0 ? 0 : data.Dcsi || false);
        self.Chads2 = ko.observable(data.Chads2 === 0 ? 0 : data.Chads2 || false);
        self.Chads2Vasc = ko.observable(data.Chads2Vasc === 0 ? 0 : data.Chads2Vasc || false);
        self.DistinctConditionCount = ko.observable(data.DistinctConditionCount === 0 ? 0 : data.DistinctConditionCount || false);
        self.DistinctIngredientCount = ko.observable(data.DistinctIngredientCount === 0 ? 0 : data.DistinctIngredientCount || false);
        self.DistinctProcedureCount = ko.observable(data.DistinctProcedureCount === 0 ? 0 : data.DistinctProcedureCount || false);
        self.DistinctMeasurementCount = ko.observable(data.DistinctMeasurementCount === 0 ? 0 : data.DistinctMeasurementCount || false);
        self.DistinctObservationCount = ko.observable(data.DistinctObservationCount === 0 ? 0 : data.DistinctObservationCount || false);
        self.VisitCount = ko.observable(data.VisitCount === 0 ? 0 : data.VisitCount || false);
        self.VisitConceptCount = ko.observable(data.VisitConceptCount === 0 ? 0 : data.VisitConceptCount || false);
        self.temporalStartDays = ko.observableArray((data.temporalStartDays && Array.isArray(data.temporalStartDays)) ? data.temporalStartDays : [ -365, -364, -363, -362, -361, -360, -359, -358, -357, -356, -355, -354, -353, -352, -351, -350, -349, -348, -347, -346, -345, -344, -343, -342, -341, -340, -339, -338, -337, -336, -335, -334, -333, -332, -331, -330, -329, -328, -327, -326, -325, -324, -323, -322, -321, -320, -319, -318, -317, -316, -315, -314, -313, -312, -311, -310, -309, -308, -307, -306, -305, -304, -303, -302, -301, -300, -299, -298, -297, -296, -295, -294, -293, -292, -291, -290, -289, -288, -287, -286, -285, -284, -283, -282, -281, -280, -279, -278, -277, -276, -275, -274, -273, -272, -271, -270, -269, -268, -267, -266, -265, -264, -263, -262, -261, -260, -259, -258, -257, -256, -255, -254, -253, -252, -251, -250, -249, -248, -247, -246, -245, -244, -243, -242, -241, -240, -239, -238, -237, -236, -235, -234, -233, -232, -231, -230, -229, -228, -227, -226, -225, -224, -223, -222, -221, -220, -219, -218, -217, -216, -215, -214, -213, -212, -211, -210, -209, -208, -207, -206, -205, -204, -203, -202, -201, -200, -199, -198, -197, -196, -195, -194, -193, -192, -191, -190, -189, -188, -187, -186, -185, -184, -183, -182, -181, -180, -179, -178, -177, -176, -175, -174, -173, -172, -171, -170, -169, -168, -167, -166, -165, -164, -163, -162, -161, -160, -159, -158, -157, -156, -155, -154, -153, -152, -151, -150, -149, -148, -147, -146, -145, -144, -143, -142, -141, -140, -139, -138, -137, -136, -135, -134, -133, -132, -131, -130, -129, -128, -127, -126, -125, -124, -123, -122, -121, -120, -119, -118, -117, -116, -115, -114, -113, -112, -111, -110, -109, -108, -107, -106, -105, -104, -103, -102, -101, -100, -99, -98, -97, -96, -95, -94, -93, -92, -91, -90, -89, -88, -87, -86, -85, -84, -83, -82, -81, -80, -79, -78, -77, -76, -75, -74, -73, -72, -71, -70, -69, -68, -67, -66, -65, -64, -63, -62, -61, -60, -59, -58, -57, -56, -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40, -39, -38, -37, -36, -35, -34, -33, -32, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1 ]);
        self.temporalEndDays = ko.observableArray((data.temporalEndDays && Array.isArray(data.temporalEndDays)) ? data.temporalEndDays : [ -365, -364, -363, -362, -361, -360, -359, -358, -357, -356, -355, -354, -353, -352, -351, -350, -349, -348, -347, -346, -345, -344, -343, -342, -341, -340, -339, -338, -337, -336, -335, -334, -333, -332, -331, -330, -329, -328, -327, -326, -325, -324, -323, -322, -321, -320, -319, -318, -317, -316, -315, -314, -313, -312, -311, -310, -309, -308, -307, -306, -305, -304, -303, -302, -301, -300, -299, -298, -297, -296, -295, -294, -293, -292, -291, -290, -289, -288, -287, -286, -285, -284, -283, -282, -281, -280, -279, -278, -277, -276, -275, -274, -273, -272, -271, -270, -269, -268, -267, -266, -265, -264, -263, -262, -261, -260, -259, -258, -257, -256, -255, -254, -253, -252, -251, -250, -249, -248, -247, -246, -245, -244, -243, -242, -241, -240, -239, -238, -237, -236, -235, -234, -233, -232, -231, -230, -229, -228, -227, -226, -225, -224, -223, -222, -221, -220, -219, -218, -217, -216, -215, -214, -213, -212, -211, -210, -209, -208, -207, -206, -205, -204, -203, -202, -201, -200, -199, -198, -197, -196, -195, -194, -193, -192, -191, -190, -189, -188, -187, -186, -185, -184, -183, -182, -181, -180, -179, -178, -177, -176, -175, -174, -173, -172, -171, -170, -169, -168, -167, -166, -165, -164, -163, -162, -161, -160, -159, -158, -157, -156, -155, -154, -153, -152, -151, -150, -149, -148, -147, -146, -145, -144, -143, -142, -141, -140, -139, -138, -137, -136, -135, -134, -133, -132, -131, -130, -129, -128, -127, -126, -125, -124, -123, -122, -121, -120, -119, -118, -117, -116, -115, -114, -113, -112, -111, -110, -109, -108, -107, -106, -105, -104, -103, -102, -101, -100, -99, -98, -97, -96, -95, -94, -93, -92, -91, -90, -89, -88, -87, -86, -85, -84, -83, -82, -81, -80, -79, -78, -77, -76, -75, -74, -73, -72, -71, -70, -69, -68, -67, -66, -65, -64, -63, -62, -61, -60, -59, -58, -57, -56, -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40, -39, -38, -37, -36, -35, -34, -33, -32, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1 ]);
        self.includedCovariateConceptIds = ko.observableArray((data.includedCovariateConceptIds && Array.isArray(data.includedCovariateConceptIds)) ? data.includedCovariateConceptIds : []);
        self.addDescendantsToInclude = ko.observable(data.addDescendantsToInclude === 0 ? false : data.addDescendantsToInclude  || false);
        self.excludedCovariateConceptIds = ko.observableArray((data.excludedCovariateConceptIds && Array.isArray(data.excludedCovariateConceptIds)) ? data.excludedCovariateConceptIds : []);
        self.addDescendantsToExclude = ko.observable(data.addDescendantsToExclude === 0 ? false : data.addDescendantsToExclude || false);
        self.includedCovariateIds = ko.observableArray((data.includedCovariateIds && Array.isArray(data.includedCovariateIds)) ? data.includedCovariateIds : []);
        self.attr_fun = data.attr_fun || "getDbDefaultCovariateData";
        self.attr_class = data.attr_class || "covariateSettings";
	}
	
	return TemporalCovariateSettings;
});