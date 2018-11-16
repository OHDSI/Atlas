define([
	'knockout',
	'atlas-state',
	'pages/characterizations/services/PermissionService',
	'text!./characterization-design.html',
	'appConfig',
	'services/AuthAPI',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'lodash',
	'pages/characterizations/components/feature-analyses/feature-analyses-browser',
	'./characterization-params-create-modal',
	'components/cohort/linked-cohort-list',
	'components/linked-entity-list',
	'less!./characterization-design.less',
	'components/ac-access-denied',
], function (
	ko,
	sharedState,
	PermissionService,
	view,
	config,
	authApi,
	Component,
	AutoBind,
	commonUtils,
	lodash
) {
	class CharacterizationDesign extends AutoBind(Component) {
		constructor(params) {
			super();

			this.design = params.design;
			this.characterizationId = params.characterizationId;

			this.loading = ko.observable(false);

			this.isViewPermitted = this.isPermittedViewResolver();

			this.cohorts = ko.computed({
				read: () => params.design() && params.design().cohorts() || [],
				write: (value) => params.design().cohorts(value),
			});

			this.featureAnalyses = {
				newItemAction: this.showFeatureBrowser,
				columns: [
					{
						title: 'ID',
						data: 'id',
						className: this.classes('col-feature-id'),
					},
					{
						title: 'Name',
						data: 'name',
						className: this.classes('col-feature-name'),
					},
					{
						title: 'Description',
						data: 'description',
						className: this.classes('col-feature-descr'),
					},
					{
						title: 'Actions',
						render: this.getRemoveCell('removeFeature'),
						className: this.classes('col-feature-remove'),
					}
				],
				data: ko.computed(() => params.design() && params.design().featureAnalyses() || [])
			};

			this.featureAnalysesParams = {
				newItemAction: this.showParameterCreateModal,
				columns: [
					{
						title: 'Name',
						data: 'name',
						className: this.classes('col-param-name'),
					},
					{
						title: 'Value',
						data: 'value',
						className: this.classes('col-param-value'),
					},
					{
						title: 'Actions',
						render: this.getRemoveCell('removeParam', 'name'),
						className: this.classes('col-param-remove'),
					}
				],
				data: ko.computed(() => params.design() && params.design().parameters() || [])
			};

			this.showFeatureAnalysesBrowser = ko.observable(false);
			this.featureAnalysesSelected = ko.observableArray();
			this.featureAnalysesAvailable = ko.pureComputed(() => this.featureAnalysesSelected().length > 0);

			this.isParameterCreateModalShown = ko.observable(false);
		}

		isPermittedViewResolver() {
			return ko.computed(
				() => (this.characterizationId() ? PermissionService.isPermittedGetCC(this.characterizationId()) : true)
			);
		}

		getRemoveCell(action, identifierField = 'id') {
			return (s, p, d) => {
				return `<a data-bind="click: () => $component.params.${action}('${d[identifierField]}')">Remove</a>`;
			}
		}

		showFeatureBrowser() {
			this.showFeatureAnalysesBrowser(true);
		}

		closeFeatureBrowser() {
			this.showFeatureAnalysesBrowser(false);
		}

		importFeatures() {
			this.closeFeatureBrowser();
			this.featureAnalysesSelected().forEach(fe => this.attachFeature(fe));
		}

		attachFeature({id, name, description}) {
			const ccDesign = this.design();
			ccDesign.featureAnalyses(lodash.uniqBy(
				[
					...(ccDesign.featureAnalyses() || []),
					{id, name, description}
				],
				'id'
			));
		}

		removeFeature(id) {
			this.design().featureAnalyses.remove(a => a.id === parseInt(id));
		}

		addParam({name, value}) {
			const ccDesign = this.design();
			this.isParameterCreateModalShown(false);
			ccDesign.parameters(lodash.uniqBy(
				[
					...(ccDesign.parameters() || []),
					{name, value}
				],
				'name'
			));
		}

		removeParam(name) {
			this.design().parameters.remove(a => a.name === name);
		}


		showParameterCreateModal() {
			this.isParameterCreateModalShown(true);
		}
	}

	return commonUtils.build('characterization-design', CharacterizationDesign, view);
});
