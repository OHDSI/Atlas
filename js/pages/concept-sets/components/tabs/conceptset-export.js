define([
	'knockout',
	'text!./conceptset-export.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/file',
	'atlas-state',
	'clipboard',
	'../../const',
	'loading',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	FileService,
	sharedState,
	clipboard,
	constants,
) {
	class ConceptsetExport extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.currentConceptSet = sharedState.repositoryConceptSet.current;
			this.currentConceptSetDirtyFlag = sharedState.ConceptSet.dirtyFlag; // TODO
			this.currentIncludedConceptIdentifierList = sharedState.repositoryConceptSet.currentIncludedConceptIdentifierList;
			this.currentConceptIdentifierList = sharedState.repositoryConceptSet.currentConceptIdentifierList;
			this.currentConceptSetExpressionJson = sharedState.repositoryConceptSet.currentConceptSetExpressionJson;
			this.exporting = ko.observable(false);
			this.loading = sharedState.repositoryConceptSet.resolvingConceptSetExpression;
    }

    copyToClipboard(clipboardButtonId, clipboardButtonMessageId) {
			var currentClipboard = new clipboard(clipboardButtonId);

			currentClipboard.on('success', function (e) {
				console.log('Copied to clipboard');
				e.clearSelection();
				$(clipboardButtonMessageId).fadeIn();
				setTimeout(function () {
					$(clipboardButtonMessageId).fadeOut();
				}, 1500);
			});

			currentClipboard.on('error', function (e) {
				console.log('Error copying to clipboard');
				console.log(e);
			});
		}

    copyExpressionToClipboard() {
			this.copyToClipboard('#btnCopyExpressionClipboard', '#copyExpressionToClipboardMessage');
    }

    copyIdentifierListToClipboard() {
      this.copyToClipboard('#btnCopyIdentifierListClipboard', '#copyIdentifierListMessage');
    }

    copyIncludedConceptIdentifierListToClipboard() {
      this.copyToClipboard('#btnCopyIncludedConceptIdentifierListClipboard', '#copyIncludedConceptIdentifierListMessage');
    }

    async exportCSV() {
			this.exporting(true);
			try {
				await FileService.loadZip(constants.paths.export(this.currentConceptSet.id),
					`conceptset-${this.currentConceptSet.id}.zip`);
			}finally {
				this.exporting(false);
			}
		}
	}


	return commonUtils.build('conceptset-export', ConceptsetExport, view);
});