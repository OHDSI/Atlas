define(['clipboard'], (clipboard) => {

	const Clipboard = (C = class{}) => class extends C {

		constructor(props) {
			super(props);
		}

		copyToClipboard (clipboardButtonId, clipboardButtonMessageId) {
			var currentClipboard = new clipboard(clipboardButtonId);

			currentClipboard.on('success', (e) => {
				console.log('Copied to clipboard');
				e.clearSelection();
				$(clipboardButtonMessageId).fadeIn();
				setTimeout(() => {
					$(clipboardButtonMessageId).fadeOut();
				}, 1500);
			});

			currentClipboard.on('error', (e) => {
				console.log('Error copying to clipboard');
				console.log(e);
			});
		}
	};

	return Clipboard;
});