define([
	'knockout',
	'text!./versions.html',
	'components/Component',
	'utils/CommonUtils',
	'utils/AutoBind',
	'utils/DatatableUtils',
	'databindings',
	'faceted-datatable',
	'less!./versions.less',
],
function (
	ko, 
	view,
	Component,
	commonUtils,
	AutoBind,
	datatableUtils
) {
	class VersionsComponent extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.versionPreviewUrl = params.versionPreviewUrl;
			this.currentVersion = params.currentVersion;
			this.previewVersion = params.previewVersion;
			this.getList = params.getList;
			this.updateVersion = params.updateVersion;
			this.copyVersionFn = params.copyVersion;
			this.isAssetDirty = params.isAssetDirty;
			this.canAddComments = params.canAddComments;

			this.isLoading = ko.observable(true);
			this.data = ko.observableArray();
			this.editVersion = ko.observable();
			this.comment = ko.observable();
			this.isCommentModalShown = ko.observable(false);

			this.columns = [
				{
					title: ko.i18n('columns.version', 'Version'),
					data: 'version'
				},
				{
					title: ko.i18n('columns.author', 'Author'),
					render: datatableUtils.getCreatedByFormatter()
				},
				{
					title: ko.i18n('columns.created', 'Created'),
					render: datatableUtils.getDateFieldFormatter('createdDate', false, true)
				},
				{
					title: ko.i18n('columns.comment', 'Comment'),
					orderable: false,
					render: (s, p, d) => {
						if (d.currentVersion) {
							return;
						}

						const comment = d.comment;

						if (!this.canAddComments()) {
							return comment || '';
						}

						d.editComment = () => this.editComment(d);
						return comment ?
							`${comment} <a data-bind="css: '${this.classes('action-link')}', click: editComment"><i class="fa fa-pencil-alt"></i></a>` :
							`<a data-bind="css: '${this.classes('action-link')}', click: editComment, text: ko.i18n('components.versions.addComment', 'Add comment')"></a>`;
					}
				},
				{
					title: ko.i18n('columns.preview', 'Preview'),
					orderable: false,
					render: (s, p, d) => {
						if (d.currentVersion) {
							return;
						}
						if (d.version === parseInt(this.previewVersion() && this.previewVersion().version)) {
							return `<span data-bind="text: ko.i18n('components.versions.viewing', 'Viewing now')"></span>`;
						}
						d.preview = () => this.openPreview(d);
						return `<a data-bind="css: '${this.classes('action-link')}', click: preview, text: ko.i18n('components.versions.preview', 'Preview')"></a>`
					}
				},
				{
					title: ko.i18n('columns.copy', 'Copy'),
					orderable: false,
					render: (s, p, d) => {
						if (d.currentVersion) {
							return;
						}
						d.copy = () => this.copyVersion(d);
						return `<a data-bind="css: '${this.classes('action-link')}', click: copy, text: ko.i18n('components.versions.createACopy', 'Create a copy'), title: ko.i18n('components.versions.createNewAsset', 'Create new asset from this version')"></a>`

					}
				}
			];
			this.options = {
				Facets: [
					{
						caption: ko.i18n('facets.caption.created', 'Created'),
						binding: o => datatableUtils.getFacetForDate(o.createdDate)
					},
					{
						caption: ko.i18n('facets.caption.author', 'Author'),
						binding: datatableUtils.getFacetForCreatedBy
					}
				],
			};
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('L');

			this.loadData();
		}

		async loadData() {
			this.isLoading(true);
			try {
				const data = await this.getList();

				if (this.currentVersion() && ko.unwrap(this.currentVersion().id)) {
					data.push({
						currentVersion: true,
						version: ko.i18n('components.versions.current', 'Current'),
						createdBy: this.currentVersion().modifiedBy || this.currentVersion().createdBy,
						createdDate: this.currentVersion().modifiedDate || this.currentVersion().createdDate,
					});
				}

				this.data(data);
			} catch (ex) {
				console.log(ex);
			} finally {
				this.isLoading(false);
			}
		}

		editComment(version) {
			this.editVersion(Object.assign({}, version));
			this.comment(version.comment);
			this.isCommentModalShown(true);
		}

		async submitComment() {
			try {
				const updated = this.editVersion();
				updated.comment = this.comment().trim();
				await this.updateVersion(updated);

				this.data(this.data().map(v => v.version === updated.version ? {...v, comment: updated.comment} : v));
			} catch (ex) {
				alert('Version save error');
				console.log(ex);
			} finally {
				this.comment(null);
				this.editVersion(null);
				this.isCommentModalShown(false);
			}
		}

		openPreview(version) {
			if (this.isAssetDirty() && !confirm(ko.i18n('common.unsavedWarning', 'Unsaved changes will be lost. Proceed?')())) {
				return;
			}
			commonUtils.routeTo(this.versionPreviewUrl(version.version));
		}

		copyVersion(version) {
			if (this.isAssetDirty() && !confirm(ko.i18n('common.unsavedWarning', 'Unsaved changes will be lost. Proceed?')())) {
				return;
			}
			this.copyVersionFn(version);
		}
	}
		
	return commonUtils.build('versions', VersionsComponent, view);
});