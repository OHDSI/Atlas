define([
	'knockout',
	'text!./download.html',
	'appConfig',
	'services/AuthAPI',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/file',
	'less!./download.less',
], function (
	ko,
	view,
	config,
	authApi,
	Component,
	AutoBind,
	commonUtils,
	fileService,
) {

	class DownloadUtil extends AutoBind(Component) {
		constructor(params) {
			super(params);

			this.title = params.title;
			this.downloadUrl = params.downloadUrl;
			this.filename = params.filename || (() => "download.zip");
			this.loading = params.loading || ko.observable();
			this.loadingMessage = params.loadingMessage || ko.observable();
			this.packageName = ko.observable();
			this.validPackageName = ko.computed(() => (this.packageName() && /^[a-zA-Z\d]+$/.test(this.packageName())));
		}

		downloadPackage() {

			this.loadingMessage("Starting download...");
			this.loading(true);
			fileService.loadZip(
				config.api.url + this.downloadUrl(this.packageName()),
				this.filename()
			)
				.catch((e) => console.error("error when downloading: " + e))
				.finally(() => this.loading(false));
		}
	}

	return commonUtils.build('download', DownloadUtil, view);
});