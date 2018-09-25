define(function (require, exports) {

	const Service = require('providers/Service');
	const { apiPaths } = require('const');

	class EvidenceService extends Service {    	
		async getNegativeControls(sourceKey, conceptSetId = -1) {
			const { data } = await this.httpService.doGet(`${apiPaths.evidence()}/${sourceKey}/negativecontrols${conceptSetId}`);
			return data;
		}
		
		async getDrugLabelExists(sourceKey, conceptIds) {
			const { data } = await this.httpService.doPost(`${apiPaths.evidence()}/${sourceKey}/druglabel`, conceptIds);
			return data;
		}

		async getDrugConditionPairs(sourceKey, targetDomainId, drugConceptIds, conditionConceptIds, sourceIds) {
			const params = {
				targetDomain: targetDomainId,
				drugConceptIds: drugConceptIds,
				conditionConceptIds: conditionConceptIds,
				sourceIds: sourceIds,
			};
			const { data } = await this.httpService.doPost(`${apiPaths.evidence()}/${sourceKey}/drugconditionpairs`, params);
			return data;
		}
		
		async generateNegativeControls(sourceKey, conceptSetId, conceptSetName, conceptDomainId, targetDomainId, conceptIds, csToInclude, csToExclude) {
			const params = {
				jobName: "NEGATIVE_CONTROLS_" + conceptSetId,
				conceptSetId: conceptSetId,
				conceptSetName: conceptSetName,
				conceptDomainId: conceptDomainId,
				outcomeOfInterest: targetDomainId,
				conceptsOfInterest: conceptIds,
				csToInclude: csToInclude,
				csToExclude: csToExclude,
				//translatedSchema: "translated", 
			};
			const { data } = await this.httpService.doPost(`${apiPaths.evidence()}/${sourceKey}/negativecontrols`, params);
			return data;
		}
	}

	return new EvidenceService();
});