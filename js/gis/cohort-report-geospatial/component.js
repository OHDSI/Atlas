define([
	'../config.js',
	'../BaseMapWidget.js',
	'./CohortMap.js',
	'text!./template.html',
	'text!./styles.css',
], (
	config,
	BaseMapWidget,
	CohortMap,
	componentTemplate,
	componentStyles,
) => {
	const TYPE = 'atlas-cohort-report';
	const NAME = `${TYPE}-geospatial`;
	let CohortGeospatialReport;

	if (!customElements.get(NAME)) {

		const COHORT_ID_ATTR = 'data-cohortid';
		const MAP_CONTAINER_ID = '#map';
		const LOAD_DENSITY_BTN_ID = '#loadDensity';
		const LOAD_CLUSTERS_BTN_ID = '#loadClusters';

		CohortGeospatialReport = class extends BaseMapWidget {
			static TYPE = TYPE;
			static TITLE = 'Geospatial';

			constructor() {
				super();
			}

			connectedCallback() {
				super.connectedCallback();
				this.render();
				this.initMap();
			}

			static get observedAttributes() {
				return [super.observedAttributes, COHORT_ID_ATTR];
			}

			get componentTemplate() {
				return componentTemplate;
			}

			get componentStyles() {
				return componentStyles;
			}

			attributeChangedCallback(name, oldValue, newValue) {
				if (oldValue !== newValue && this.cohortMap && this.cohortId && this.sourceKey) {
					this.cohortMap.setParams(this.cohortId, this.sourceKey);
					this.cohortMap.refresh();
				}
			}

			get cohortId() {
				return this.getAttribute(COHORT_ID_ATTR);
			}

			setLoading(state) {
				super.setLoading(state);
				this.getEl(LOAD_DENSITY_BTN_ID).toggleAttribute('disabled', state);
				this.getEl(LOAD_CLUSTERS_BTN_ID).toggleAttribute('disabled', state);
			}

			initMap() {
				this.cohortMap = new CohortMap({
					gisServiceUrl: config.gisServiceUrl,
					tilesServerUrl: config.tilesServerUrl,
					mapContainerEl: this.getEl(MAP_CONTAINER_ID),
					setLoading: this.setLoading.bind(this)
				});

				this.root.querySelector(LOAD_DENSITY_BTN_ID).addEventListener('click', async () => {
					try {
						await this.cohortMap.updateDensityMap();
					} catch (e) {
						alert('Cannot retrieve density map');
						console.log(e);
					}
				});
				this.root.querySelector(LOAD_CLUSTERS_BTN_ID).addEventListener('click', async () => {
					try {
						await this.cohortMap.updateClusterMap();
					} catch (e) {
						alert('Cannot retrieve clusters');
						console.log(e);
					}
				});
			}
		}

		customElements.define(NAME, CohortGeospatialReport);
	}

	return {
		name: NAME,
		element: CohortGeospatialReport,
	};
});