define([], () => {
    const INCLUSION_REPORT = {
    	BY_EVENT: 0,
    	BY_PERSON: 1,
      BY_DEMOGRAPHIC: 2
    };

    const feAnalysisTypes = {
      PRESET: 'PRESET',
      CRITERIA_SET: 'CRITERIA_SET',
      CUSTOM_FE: 'CUSTOM_FE'
    };

    return {
    	INCLUSION_REPORT,
      feAnalysisTypes
    };
  }
);