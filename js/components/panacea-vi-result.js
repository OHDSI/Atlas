define(['knockout', 'text!./panacea-vi-result.html', 'jquery', 'd3', 'appConfig', 'panacea-vi-build2'  
        ,'knockout.dataTables.binding'
        ,'faceted-datatable'
        ,'databindings'
], function (ko, view, $, d3, config, panaceaViBuild2) {
	function panaceaViResult(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.resultMode = params.resultMode;
		self.currentResultSource = params.currentResultSource;
		self.currentStudy = params.currentStudy;
		self.cohortDefinition = params.cohortDefinition;
		self.loading = params.loading;
		self.rootJSON = params.rootJSON;

		self.resultMode.subscribe(function (d) {
			self.renderVi();
		});
		
		self.currentResultSource.subscribe(function (d) {
			self.renderVi();
		});
		
		self.renderVi = function(){
			if (self.model != null && self.resultMode() == 'visualization' && self.rootJSON() != null){
//				if(!(self.rootJSON()["studyResultUniquePath"] === undefined || self.rootJSON()["studyResultUniquePath"] === null)) {
//					panaceaViBuild2.d3RenderData(JSON.parse(self.rootJSON()["studyResultUniquePath"]));
//				}else if
			if(!(self.rootJSON()["studyResultFiltered"] === undefined || self.rootJSON()["studyResultFiltered"] === null)) {
					panaceaViBuild2.d3RenderData(JSON.parse(self.rootJSON()["studyResultFiltered"]));
				}else if(!(self.rootJSON()["studyResultCollapsed"] === undefined || self.rootJSON()["studyResultCollapsed"] === null)){
					panaceaViBuild2.d3RenderData(JSON.parse(self.rootJSON()["studyResultCollapsed"]));
				}
			}		
		};
		
	};
			
	var component = {
			viewModel: panaceaViResult,
			template: view
		};

	ko.components.register('panacea-vi-result', component);
	return component;
});