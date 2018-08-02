define([
	'knockout',
	'text!./included-sourcecodes.html',
	'./utils',
	'./const',
	'providers/Component',
	'utils/CommonUtils',
	'providers/Vocabulary',
	'faceted-datatable',
	'css!./included-sourcecodes.css',
], function(
		ko,
		view,
		utils,
		Const,
		Component,
		commonUtils,
		vocabularyAPI,
	){

		class IncludedSourcecodes extends Component {
			constructor(params) {
				super(params);

				this.model = params.model;
				this.sourceCodesFilter = {};
				this.tableLanguage = Const.tableLanguage;
				this.tableClasses = { sProcessing: this.classes('conceptset-processing'), };
				this.loadingClass = this.classes('conceptset-loading');

				this.applySourceCodesFilter = this.applySourceCodesFilter.bind(this);
				this.loadSourceCodesFacets = this.loadSourceCodesFacets.bind(this);
				this.loadSourceCodes = this.loadSourceCodes.bind(this);
			}

			loadSourceCodesFacets() {
				return utils.loadFacets(this.model.relatedSourcecodesOptions.Facets, 'lookup/mapped/facets');
			}

			applySourceCodesFilter(data) {
				return utils.applyFilter(data, this.sourceCodesFilter);
			}

			loadSourceCodes(data, callback, settings) {
				vocabularyAPI.loadSourceCodes(utils.getExpression(data, this.sourceCodesFilter, this.model.relatedSourcecodes.Facets), true)
					.then(concepts => {
						callback(concepts);
					});
			}

		}

		commonUtils.build('included-sourcecodes', IncludedSourcecodes, view);
	}
);