define([
	'../config.js',
	'../const.js',
	'../BaseMapWidget.js',
	'../Utils.js',
	'./const.js',
	'text!./template.html',
	'text!./styles.css',
], (
	config,
	constants,
	BaseMapWidget,
	{ httpQuery },
	componentConst,
	componentTemplate,
	componentStyles,
) => {

	const TYPE = 'atlas-profile-widget';
	const NAME = `${TYPE}-map`;
	let PersonMapWidget;

	if (!customElements.get(NAME)) {

		const PERSON_ID_ATTR = 'data-personid';
		const START_DATE_ATTR = 'data-startdate';
		const END_DATE_ATTR = 'data-enddate';
		const MAP_CONTAINER_ID = '#map';
		const COMPONENT_ID = '#component';

		PersonMapWidget = class extends BaseMapWidget {
			static TYPE = TYPE;
			static TITLE = 'Map';

			constructor() {
				super();
			}

			connectedCallback() {
				super.connectedCallback();
				this.render();
			}

			static get observedAttributes() {
				return [super.observedAttributes, PERSON_ID_ATTR, START_DATE_ATTR, END_DATE_ATTR];
			}

			attributeChangedCallback(name, oldValue, newValue) {
				if (oldValue === newValue)
					return;

				if (this.personId && this.sourceKey) {
					!this.mapInitiated && this.initMap();
					this.toggleReadyState(true);
					this.loadLocationHistory();
				} else {
					this.toggleReadyState(false);
				}
			}

			get personId() {
				return this.getAttribute(PERSON_ID_ATTR);
			}

			get startDate() {
				return this.getAttribute(START_DATE_ATTR);
			}

			get endDate() {
				return this.getAttribute(END_DATE_ATTR);
			}

			get componentTemplate() {
				return componentTemplate;
			}

			get componentStyles() {
				return componentStyles;
			}

			toggleReadyState(state) {
				this.getEl(COMPONENT_ID).classList.toggle('ready', state);
			}

			initMap() {
				this.map = L.map(this.getEl(MAP_CONTAINER_ID));
				// Since the map takes full width and user's mouse most possible will be over it during scroll - disable zoom on scroll
				this.map.scrollWheelZoom.disable();
				this.osmLayer = L.tileLayer(config.tilesServerUrl + '/{z}/{x}/{y}.png', {
					id: 'osm_tiles',
					maxZoom: 18,
				});
				this.map.addLayer(this.osmLayer);
				this.mapInitiated = true;
			}

			async loadLocationHistory() {
				this.setLoading(true);

				this.clearLayers();

				const locationHistory = await httpQuery(componentConst.Api.loadLocationHistory({
					personId: this.personId,
					sourceKey: this.sourceKey,
					startDate: this.startDate,
					endDate: this.endDate,
				}));

				this.map.fitBounds(
					[
						// <LatLng> southWest, <LatLng> northEast
						[locationHistory.bbox.southLatitude, locationHistory.bbox.westLongitude],
						[locationHistory.bbox.northLatitude, locationHistory.bbox.eastLongitude],
					],
					{
						padding: [50, 50]
					}
				);

				locationHistory.locations.forEach(loc => {
					L
						.marker([loc.latitude, loc.longitude], {icon: constants.DefaultIcon})
						.bindPopup(`Dates: ${loc.startDate} - ${loc.endDate || 'current'}`)
						.addTo(this.map);
				});

				this.setLoading(false);
			}

			clearLayers() {
				this.map && this.map.eachLayer(layer => layer !== this.osmLayer && this.map.removeLayer(layer));
			}
		}

		customElements.define(NAME, PersonMapWidget);
	}

	return {
		name: NAME,
		element: PersonMapWidget,
	}
});