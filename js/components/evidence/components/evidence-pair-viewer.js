define([
	'knockout',
	'text!./evidence-pair-viewer.html',
	'appConfig',
	'webapi/AuthAPI',
	'webapi/EvidenceAPI',
], function (
	ko,
	view,
	config,
	authApi,
	evidenceAPI
) {
	function evidencePairViewer(params) {
		var self = this;
		self.model = params.model;
		self.sourceKey = ko.isObservable(params.sourceKey) ? params.sourceKey() : params.sourceKey;
		self.targetDomainId = ko.isObservable(params.targetDomainId) ? params.targetDomainId() : params.targetDomainId;
		self.drugConceptIds = params.drugConceptIds || [42904205];
		self.conditionConceptIds = params.conditionConceptIds || [4093145];
		self.sourceIds = params.sourceIds || config.evidenceLinkoutSources;
		self.drugConditionPairs = ko.observableArray();
		self.loading = ko.observable(true);
		self.showHelpText = ko.observable(false);
		self.cemDrugConditionPairs = null;
		self.pubmedMetadata = {};

		self.columns = [
			{
				title: 'Linkout',
				render: function(s, p, d) {
					return '<span class="linkish">' + d.evidenceTitle + '</span>';
				},
				width: "50%",
			},
			{
				title: 'Unique Identifier',
				data: d => d.uniqueIdentifier,
				visible: false,
			},
			{
				title: 'Evidence Source',
				data: d => d.evidenceSource,
				visible: false,
			},
			{
				title: 'Drug Concept Id',
				data: d => d.drugConceptId,
				visible: false,
			},
			{
				title: 'Drug Concept Name',
				data: d => d.drugConceptName,
			},
			{
				title: 'Condition Concept Id',
				data: d => d.hoiConceptId,
				visible: false,
			},
			{
				title: 'Condition Concept Name',
				data: d => d.hoiConceptName,
			},
			{
				title: 'Mapping Type',
				data: d => d.mappingType,
			},
		];

		self.options = {
			lengthMenu: [
				[10, 25, 50, 100, -1],
				['10', '25', '50', '100', 'All']
			],
			order: [
				[0, 'asc']
			],
			Facets: [
				{
					'caption': 'Mapping Type',
					'binding': d => d.mappingType,
				},
				{
					'caption': 'Source',
					'binding': d => d.evidenceSource,
				},
			]
		};

		self.rowClick = function(s, p, d) {
			window.open(s.linkout);
		}

		self.loadDrugConditionPairs = function() { 
			self.loading(true);

			evidenceAPI.getDrugConditionPairs(self.sourceKey, self.targetDomainId, self.drugConceptIds, self.conditionConceptIds, self.sourceIds)
				.done(function (results) {
					self.cemDrugConditionPairs = results;
					self.getMetadataFromPubmed().done(function(metadata) {
					  if (metadata.result) {
						self.pubmedMetadata = metadata.result;
					} else {
						self.pubmedMetadata = {};
					}
				}).done(function(results) {
					$.each(self.cemDrugConditionPairs, function(i, dcp) {
						var externalLink = config.cemOptions.externalLinks[dcp.evidenceSource];
						if (externalLink && externalLink.length > 0) {
							dcp.linkout = externalLink.replace("{@id}", dcp.uniqueIdentifier);
						} else {
							dcp.linkout = dcp.uniqueIdentifier;
						}
						if (dcp.evidenceSource.indexOf("medline") !== -1) {
							dcp.evidenceTitle = self.pubmedMetadata[dcp.uniqueIdentifier].title
						} else if (dcp.evidenceSource.indexOf("splicer") !== -1) {
							dcp.evidenceTitle = dcp.drugConceptName;
						} else {
							dcp.evidenceTitle = dcp.linkout;
						}
					});

					self.drugConditionPairs(self.cemDrugConditionPairs);
					self.loading(false);
				})
				.fail(function (err) {
					console.log(err);
				})
			});
		}

	    self.getMetadataFromPubmed = function() {
			var metadataPromise = $.Deferred();
			var pubmedMetadataUrl = config.cemOptions.sourceRestEndpoints["medline_winnenburg"];
			if (pubmedMetadataUrl && pubmedMetadataUrl.length > 0) {
				// Get the medline related results
				var medlineResults = self.cemDrugConditionPairs.filter(function (info) {
					return info.evidenceSource.indexOf("medline") !== -1;
				});
				// Get the unique identifiers
				var uniqueIdentifiers = []
				$.each(medlineResults, function (i, medlineEntry) {
					uniqueIdentifiers.push(medlineEntry.uniqueIdentifier);
				});
				// Retrieve the metadata
				var ids = uniqueIdentifiers.join();
				var metadataPromise = $.ajax({
					url: pubmedMetadataUrl.replace("{@ids}", ids),
					method: 'GET'
				});
			} else {
				metadataPromise.resolve();
			}
			return metadataPromise;
		}

		self.toggleHelpText = function() {
			self.showHelpText(!self.showHelpText());
		}

		self.helpTextDisplay = function() {
			if (!self.showHelpText()) {
				return "Click here for more information about this evidence list"
			} else {
				return "Hide details"
			}
		}
		
		// startup actions
		self.loadDrugConditionPairs();
	}

	var component = {
		viewModel: evidencePairViewer,
		template: view
	};

	return component;
});