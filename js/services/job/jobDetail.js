define(function (require, exports) {

	var ko = require('knockout');
	
	function jobDetail(data) {
		var self = this;
		var data = data || {};
		
		self.name = data.name || "";
		self.type = data.type || "batch"; 
		self.status = ko.observable(data.status != null ? data.status : 'LOADING');
		self.executionId = data.executionId || null;
		self.executionUniqueId = ko.pureComputed(function() {
			return self.type + "-" + self.executionId;
		})
		self.statusUrl = data.statusUrl || null;
		self.statusValue = data.statusValue || 'status';
		self.progress = ko.observable(data.progress != null ? data.progress : 0);
		self.progressUrl = data.progressUrl || null;
		self.progressValue = data.progressValue || 'length';
		self.progressMax = data.progressMax || 1;
		self.viewed = ko.observable(data.viewed != null ? data.viewed : false);
		self.url = ko.observable(data.url || null);		
		
		self.isComplete = function() {
			return self.status() == "COMPLETED" || self.status() == "COMPLETE";
		}

		self.isFailed = function() {
			return self.status() == "FAILED";
		}
		
		self.checkProgress = function(progressData) {
			switch (self.type) {
				case 'cohort-generation':
				case 'ir-analysis':
				case 'negative-controls':
					return null;
					break;
				default:
					return progressData[self.progressValue];
			}
		}
		
		self.getStatusFromResponse = function(statusData) {
			switch (this.type) {
				case 'batch':
					this.progress(statusData.progress);
					if (this.progress() == '0') {
						return 'STARTING';
					} else if (this.progress() < this.progressMax) {
						return 'RUNNING';
					} else {
						return 'COMPLETE';
					}
					break;
				case 'cohort-generation':
					statusData = statusData.find(j => (String(j.id.cohortDefinitionId) + String(j.id.sourceId)) == this.executionId);
					break;
				case 'ir-analysis':
					statusData = statusData.find(j => (String(j.executionInfo.id.analysisId) + String(j.executionInfo.id.sourceId)) == this.executionId);
					if (statusData) {
						statusData = statusData.executionInfo;
					}
					break;
				case 'negative-controls':
					statusData = statusData.find(j => (String(j.conceptSetId) + String(j.sourceId)) == this.executionId);
					break;
				case 'plp':
				case 'cca':
					statusData = { status: statusData };
					break;
				default:
					// Leave the object as-is 
					break;
			}
			if (statusData) {
				return statusData[this.statusValue];
			} else {
				return null;
			}
		}		
	}
	
	
	return jobDetail;
});
