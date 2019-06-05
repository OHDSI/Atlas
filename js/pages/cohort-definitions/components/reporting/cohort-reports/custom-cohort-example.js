/**
 * Example of custom reports registration from external source
 */

(function () {
	const TYPE = 'atlas-cohort-report';
	const NAME = `${TYPE}-geospatial`;

	if (!customElements.get(NAME)) {
		class CohortGeospatialReport extends HTMLElement {
			static TYPE = TYPE;
			static TITLE = 'External';

			connectedCallback() {
				this.render();
			}

			static get observedAttributes() {
				return ['data-cohortid', 'data-sourcekey'];
			}

			attributeChangedCallback(name, oldValue, newValue) {
				this.render();
			}

			render() {
				let html = '';
				if (this.getAttribute('data-sourceKey') !== null && this.getAttribute('data-cohortId') != null) {
					html = `
					<b>External report for cohort id = ${this.getAttribute('data-cohortid')}, source key = ${this.getAttribute('data-sourcekey')}</b>
				`;
				}
				this.innerHTML = html;
			}
		}

		customElements.define(NAME, CohortGeospatialReport);
	}
})();