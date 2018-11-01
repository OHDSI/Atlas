define([
	'knockout', 
	'text!./evidence-pair-viewer.html',	
	'components/Component',
	'appConfig', 
	'services/AuthAPI', 
	'services/EvidenceAPI',
], function (
	ko, 
	view, 
	Component,
	config, 
	authApi, 
	evidenceAPI
) {
	class EvidencePairViewer extends Component {
		constructor(params) {
			super(params);

			this.sourceKey = ko.isObservable(params.sourceKey) ? params.sourceKey() : params.sourceKey;
			this.targetDomainId = ko.isObservable(params.targetDomainId) ? params.targetDomainId() : params.targetDomainId;
			this.drugConceptIds = params.drugConceptIds || [42904205];
			this.conditionConceptIds = params.conditionConceptIds || [4093145];
			this.sourceIds = params.sourceIds || config.evidenceLinkoutSources;
			this.drugConditionPairs = ko.observableArray();
			this.loading = ko.observable(true);
			this.showHelpText = ko.observable(false);
			this.cemDrugConditionPairs = null;
			this.pubmedMetadata = {};

			this.columns = [
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

			this.options = {
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

			this.rowClick = function(s, p, d) {
				window.open(s.linkout);
			}

			this.loadDrugConditionPairs = function() { 
				this.loading(true);

				evidenceAPI.getDrugConditionPairs(this.sourceKey, this.targetDomainId, this.drugConceptIds, this.conditionConceptIds, this.sourceIds)
					.done((results) => {
						this.cemDrugConditionPairs = results;
						this.getMetadataFromPubmed().done((metadata) => {
						if (metadata.result) {
							this.pubmedMetadata = metadata.result;
						} else {
							this.pubmedMetadata = {};
						}
					}).done((results) => {
						this.cemDrugConditionPairs.forEach(dcp => {
							var externalLink = config.cemOptions.externalLinks[dcp.evidenceSource];
							if (externalLink && externalLink.length > 0) {
								dcp.linkout = externalLink.replace("{@id}", dcp.uniqueIdentifier);
							} else {
								dcp.linkout = dcp.uniqueIdentifier;
							}
							if (dcp.evidenceSource.indexOf("medline") !== -1) {
								dcp.evidenceTitle = this.pubmedMetadata[dcp.uniqueIdentifier].title
							} else if (dcp.evidenceSource.indexOf("splicer") !== -1) {
								dcp.evidenceTitle = dcp.drugConceptName;
							} else {
								dcp.evidenceTitle = dcp.linkout;
							}
						});
						this.drugConditionPairs(this.cemDrugConditionPairs);
						this.loading(false);
					})
					.fail(function (err) {
						console.log(err);
					})
				});
			}

			this.getMetadataFromPubmed = function() {
				var metadataPromise = $.Deferred();
				var pubmedMetadataUrl = config.cemOptions.sourceRestEndpoints["medline_winnenburg"];
				if (pubmedMetadataUrl && pubmedMetadataUrl.length > 0) {
					// Get the medline related results
					var medlineResults = this.cemDrugConditionPairs.filter(function (info) {
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

			this.toggleHelpText = function() {
				this.showHelpText(!this.showHelpText());
			}

			this.helpTextDisplay = function() {
				if (!this.showHelpText()) {
					return "Click here for more information about this evidence list"
				} else {
					return "Hide details"
				}
			}
			
			// startup actions
			this.loadDrugConditionPairs();
		}
	}

	var component = {
		viewModel: EvidencePairViewer,
		template: view
	};

	return component;
});