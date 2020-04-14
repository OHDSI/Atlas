'use strict';

const currentDocument = document.currentScript.ownerDocument;

define([
	'text!./styles.css',
	'text!leaflet.css',
	'leaflet',
], (commonStyles, leafletStyles) => {
	const SOURCE_KEY_ATTR = 'data-sourcekey';

	class BaseMapWidget extends HTMLElement {

		static LOADING_PANEL_ID = '#loadingPanel';

		connectedCallback() {
			this.root = this.attachShadow({mode: 'open'});
		}

		static get observedAttributes() {
			return [SOURCE_KEY_ATTR];
		}

		get sourceKey() {
			return this.getAttribute(SOURCE_KEY_ATTR);
		}

		getEl(selector) {
			return this.root.querySelector(selector);
		}

		setLoading(state) {
			this.getEl(BaseMapWidget.LOADING_PANEL_ID).style.display = state ? 'block' : 'none';
		}

		attachStyles(styles) {
			const mapStyles = currentDocument.createElement('style');
			mapStyles.innerHTML = styles;
			this.root.appendChild(mapStyles);
		}

		render() {
			this.root.innerHTML = this.componentTemplate;
			this.attachStyles(commonStyles);
			this.attachStyles(this.componentStyles);
			this.attachStyles(leafletStyles);
		}
	}

	return BaseMapWidget;
});