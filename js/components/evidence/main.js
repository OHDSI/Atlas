define(function (require, exports) {
	
	var ko = require('knockout')
	
	var evidencePairViewer = require('./components/evidence-pair-viewer');
    ko.components.register('evidence-pair-viewer', evidencePairViewer);
    
});
