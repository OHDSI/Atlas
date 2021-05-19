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
			this.getListFn = params.getListFn;
			this.updateVersionFn = params.updateVersionFn;
			this.isLoading = ko.observable(true);
			this.data = ko.observableArray();
			this.editVersion = ko.observable();
			this.comment = ko.observable();
			this.isCommentModalShown = ko.observable(false);

			this.columns = [
				{
					title: ko.i18n('columns.number', 'Number'),
					data: 'version'
				},
				{
					title: ko.i18n('columns.author', 'Author'),
					render: datatableUtils.getCreatedByFormatter()
				},
				{
					title: ko.i18n('columns.created', 'Created'),
					render: datatableUtils.getDateFieldFormatter('createdDate')
				},
				{
					title: ko.i18n('columns.comment', 'Comment'),
					render: (s, p, d) => {
						const comment = d.comment;
						d.editComment = () => this.editComment(d);
						return comment ?
							`${comment} <a data-bind="css: '${this.classes('action-link')}', click: editComment"><i class="fa fa-pencil"></i></a>` :
							`<a data-bind="css: '${this.classes('action-link')}', click: editComment, text: ko.i18n('components.versions.addComment', 'Add comment')"></a>`;
					}
				},
				{
					title: ko.i18n('components.versions.preview', 'Preview'),
					orderable: false,
					render: (s, p, d) => {
						d.preview = () => this.openPreview(d);
						return `<a data-bind="css: '${this.classes('action-link')}', click: preview, text: ko.i18n('components.versions.preview', 'Preview')"></a>`

					}
				},
				{
					title: ko.i18n('components.versions.copy', 'Copy'),
					orderable: false,
					render: (s, p, d) => {
						d.copy = () => this.copyVersion(d);
						return `<a data-bind="css: '${this.classes('action-link')}', click: copy, text: ko.i18n('components.versions.copy', 'Copy')"></a>`

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
				const data = await this.getListFn();
				this.data(data);
			} catch (ex) {
				console.log(ex);
			} finally {
				this.isLoading(false);
			}
		}

		editComment(version) {
			this.editVersion(version);
			this.comment(version.comment);
			this.isCommentModalShown(true);
		}

		async submitComment() {
			try {
				const updated = this.editVersion();
				updated.comment = this.comment();
				await this.updateVersionFn(updated);
				this.editVersion(null);

				this.data(this.data().map(v => v.id === updated.id ? {...v, comment: updated.comment} : v));
			} catch (ex) {
				alert('Version save error');
				console.log(ex);
			} finally {
				this.isCommentModalShown(false);
			}
		}

		openPreview(version) {

		}

		copyVersion(version) {

		}
	}
		
	return commonUtils.build('versions', VersionsComponent, view);
});