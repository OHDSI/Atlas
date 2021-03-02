define([
	'knockout',
	'text!./conceptsets-export.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'appConfig',
	'services/file',
	'atlas-state',
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
	fileService,
	sharedState,
) {
	class ConceptsetExport extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.exportRowCount = ko.observable(0);
			this.exportConceptSets = [];
			this.isInProgress = ko.observable(false);
			this.criteriaContext = sharedState.criteriaContext;
			this.tableOptions = commonUtils.getTableOptions('L');
		}

		onExportAction (result) {
			if (result.action == 'add') {
				// Get the items we'd like to export from the table
				var itemsForExport = $('#exportConceptSetTable').DataTable().rows('.selected').data();
				var conceptSetIds = $.map(itemsForExport, function (obj) {
					return obj.id
				}).join('%2B'); // + encoded
				if (conceptSetIds.length > 0) {
					this.isInProgress(true);
					fileService
						.loadZip(config.api.url + 'conceptset/exportlist?conceptsets=' + conceptSetIds, 'exportedConceptSets.zip')
						.finally(() => this.isInProgress(false));
				} else {
					alert('No concept set is selected.');
				}
			}
		}

		exportOnConceptSetSelected(conceptSet, valueAccessor, e) {
			$(e).toggleClass('selected');
			const exportTable = $('#exportConceptSetTable').DataTable();
			this.exportRowCount(exportTable.rows('.selected').data().length);
		}

	}

	return commonUtils.build('conceptsets-export', ConceptsetExport, view);
});