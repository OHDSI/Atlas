define([
	'knockout',
	'text!./conceptsets-export.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'appConfig',
	'services/file',
  'components/tabs',
  'circe',
  'less!./conceptsets-export.less'
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	config,
	fileService
) {
	class ConceptsetExport extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.exportTable = null;
			this.exportRowCount = ko.observable(0);
			this.exportConceptSets = [];
			this.isInProgress = ko.observable(false);
		}

		onExportAction (result) {
			if (result.action == 'add') {
				this.isInProgress(true);
				// Get the items we'd like to export from the table
				var itemsForExport = $('#exportConceptSetTable').DataTable().rows('.selected').data();
				var conceptSetIds = $.map(itemsForExport, function (obj) {
					return obj.id
				}).join('%2B'); // + encoded
				if (conceptSetIds.length > 0) {
					fileService
						.loadZip(config.api.url + 'conceptset/exportlist?conceptsets=' + conceptSetIds, 'exportedConceptSets.zip')
						.finally(() => this.isInProgress(false));
				}
			}
		}

		exportOnConceptSetSelected(conceptSet, valueAccessor, e) {
			$(e.currentTarget).toggleClass('selected');
			if (this.exportTable == null) {
				this.exportTable = $(e.currentTarget.parentElement.parentElement).DataTable();
			}
			this.exportRowCount(this.exportTable.rows('.selected').data().length);
		}

	}

	return commonUtils.build('conceptsets-export', ConceptsetExport, view);
});