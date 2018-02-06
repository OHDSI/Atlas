define(['knockout', 
				'text!./CohortFeatureBrowserTemplate.html', 
				'appConfig', 
				'../FeatureSection', 
				'../tableConfig/DemoTableColumns', 
				'../tableConfig/DomainTableColumns', 
				'../tableConfig/DomainTableFilteredColumns',
				'../tableConfig/DomainTableOptions', 				
				'../tableConfig/DomainTableFilteredOptions',
				'../tableConfig/DistributionTableColumns',
				'../tableConfig/DistributionTableOptions',
				'webapi/CohortFeaturesAPI'], 
function (ko, 
					template, 
					config,
					FeatureSection,
					DemoTableColumns, 
					DomainTableColumns, 
					DomainTableFilteredColumns,
					DomainTableOptions,
					DomainTableFilteredOptions,
					DistributionTableColumns,
					DistributionTableOptions,
					cohortFeaturesAPI) {
	function CohortFeatureBrowser(params) {
		var self = this;

		self.cohortId = params.cohortId;
		self.sourceKey = params.sourceKey;
		self.chrMode = ko.observable('demo');
		self.demoSection = new FeatureSection('demo');
		self.condSection = new FeatureSection('cond');
		self.drugSection = new FeatureSection('drug');
		self.measSection = new FeatureSection('meas');
		self.obsrSection = new FeatureSection('obsr');
		self.procSection = new FeatureSection('proc');
		self.distSection = new FeatureSection('dist');

		// Result table display column definitions
		self.demoColumns = new DemoTableColumns().columnDef;
		self.distributionColumns = new DistributionTableColumns().columnDef;
		self.domainTableFilteredColumns = new DomainTableFilteredColumns().columnDef;
		self.domainTableColumns = new DomainTableColumns().columnDef;

		// Result table filter (facet) definitions
		// NOTE - each table must define its own set of filters
		// unlike the column definitions
		self.chrDemoOptions = new DomainTableOptions().filterDef;
		self.chrCondOptions = new DomainTableOptions().filterDef;
		self.chrDrugOptions = new DomainTableOptions().filterDef;
		self.chrMeasOptions = new DomainTableOptions().filterDef;
		self.chrObsrOptions = new DomainTableOptions().filterDef;
		self.chrProcOptions = new DomainTableOptions().filterDef;
		self.chrDistOptions = new DistributionTableOptions().filterDef;

		// Result table filtered - filter (facet) definitions
		self.chrCondOptionsFiltered = new DomainTableFilteredOptions().filterDef;
		self.chrDrugOptionsFiltered = new DomainTableFilteredOptions().filterDef;
		self.chrMeasOptionsFiltered = new DomainTableFilteredOptions().filterDef;
		self.chrObsrOptionsFiltered = new DomainTableFilteredOptions().filterDef;
		self.chrProcOptionsFiltered = new DomainTableFilteredOptions().filterDef;

		self.featureSectionMap = [
			{
				"section": 'demo',
				"domainList": ["demographics"],
				"featureSection": self.demoSection,
			},
			{
				"section": 'cond',
				"domainList": ["condition"],
				"featureSection": self.condSection,
			},
			{
				"section": 'drug',
				"domainList": ["drug"],
				"featureSection": self.drugSection,
			},
			{
				"section": 'meas',
				"domainList": ["measurement"],
				"featureSection": self.measSection,
			},
			{
				"section": 'obsr',
				"domainList": ["observation"],
				"featureSection": self.obsrSection,
			},
			{
				"section": 'proc',
				"domainList": ["procedure"],
				"featureSection": self.procSection,
			},
			{
				"section": 'dist',
				"domainList": [],
				"featureSection": self.distSection,
			},
		];

		self.getFeatureSection = function (section) {
			return $.grep(self.featureSectionMap, function (n) {
				return n.section == section
			})[0];
		}

		self.getDomainList = function (chrType) {
			return self.getFeatureSection(chrType).domainList;
		}

		self.chrPillClick = function (chrType) {
			self.chrMode(chrType);
			var featureSection = self.getFeatureSection(chrType).featureSection;
			if (!featureSection.dataLoaded()) {
				self.getCohortFeatures(featureSection);
			}
		}

		self.covariateSelected = function (data, obj) {
			if (obj.target.className.indexOf("btn-explore") >= 0) {
				self.exploreByFeature(data, null);
			}
		}

		self.exploreByFeature = function (covInfo, featureSection) {
			if (featureSection == null) {
				featureSection = self.getFeatureSection(self.chrMode()).featureSection;
			}

			var selectedCovariateId = covInfo.covariateId;
			featureSection.loadingFlag(true);
			featureSection.currentFilter(covInfo);

			if (!featureSection.byCovariate.has(selectedCovariateId)) {
				// Go get the covariate ancestors/desendants
				cohortFeaturesAPI.getStudyPrevalenceStatisticsByVocab(self.cohortId(), self.sourceKey(), covInfo.covariateId).then(function (data) {
					data.forEach(function (item) {
						if (item.distance > 0) {
							item.relationshipType = "Ancestor"
						} else if (item.distance < 0) {
							item.relationshipType = "Descendant"
						} else {
							item.relationshipType = "Selected"
						}
					});
					featureSection.dataFiltered(data);
					featureSection.filteredFlag(true);
					featureSection.byCovariate.set(selectedCovariateId, data);
					featureSection.loadingFlag(false);
				}, function (err) {
					console.log(err);
					featureSection.loadingFlag(false);
				});
			} else {
				featureSection.dataFiltered(featureSection.byCovariate.get(selectedCovariateId));
				featureSection.filteredFlag(true);
				featureSection.loadingFlag(false);
			}
		}

		self.getCohortFeatures = function (featureSection, searchTerm) {
			featureSection.loadingFlag(true);
			var domainList = self.getDomainList(featureSection.type);
			var analysisIdList = null; //self.getAnalysisIdList(featureSection.chrType);
			var cohortId = self.cohortId()
			var sourceKey = self.sourceKey();
			var promise;
			if (featureSection.type == "dist") {
				promise = cohortFeaturesAPI.getStudyDistributionStatistics(sourceKey, cohortId, domainList, analysisIdList, searchTerm);
			} else {
				promise = cohortFeaturesAPI.getStudyPrevalenceStatistics(sourceKey, cohortId, domainList, analysisIdList, searchTerm);
			}

			promise.then(function (data) {
				featureSection.data(data);
				featureSection.dataLoaded(true);
				if (featureSection.loadingFlag() && featureSection.currentFilter() && featureSection.currentFilter().covariateId != null) {
					self.exploreByFeature(featureSection.currentFilter(), featureSection);
				} else {
					featureSection.loadingFlag(false);
				}
			}, function (err) {
				featureSection.loadingFlag(false);
				console.error("An error occurred when retrieving prevalance results for the cohort." + err)
			});
		}

		self.clearFilter = function () {
			var featureSection = self.getFeatureSection(self.chrMode()).featureSection;
			featureSection.loadingFlag(true);
			featureSection.filteredFlag(false);
			featureSection.currentFilter(null);
			featureSection.loadingFlag(false);
		}

		self.init = function () {
			self.getCohortFeatures(self.demoSection, null);
		}

		self.init();
		
		// subscriptions	
		var sourceKeySub = self.sourceKey.subscribe(function (newVal) {
			if (newVal) {
				// clear loaded data
				self.featureSectionMap.forEach(f => { 
					f.featureSection.data.removeAll();
					f.featureSection.dataLoaded(false);
				});
				// reload the selected pill
				self.chrPillClick(self.chrMode()); 
			}
		});
		
		// cleanup
		self.dispose = function() {
			sourceKeySub.dispose();
		};				
	}

	var component = {
		viewModel: CohortFeatureBrowser,
		template: template
	};

	return component;
});
