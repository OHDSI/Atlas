define([
	'knockout',
	'text!./conceptset-export.html',
	'providers/Component',
	'providers/AutoBind',
	'utils/CommonUtils',
  'clipboard',
  '../../const',
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  clipboard,
  constants,
) {
	class ConceptsetExport extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.model = params.model;
      
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

    exportCSV() {
			window.open(constants.paths.export(this.model.currentConceptSet().id));
		}
	}


	return commonUtils.build('conceptset-export', ConceptsetExport, view);
});