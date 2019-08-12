define(['clipboard'], (clipboard) => {

	const Clipboard = (C = class{}) => class extends C {

		constructor(props) {
			super(props);
		}

        copyToClipboard(clipboardButtonId, clipboardButtonMessageId, appendedText) {
            const currentClipboard = new clipboard(clipboardButtonId);
            currentClipboard.on('success', (e) => {
                console.log('Copied to clipboard');
                e.clearSelection();
                if (appendedText) {
					let selected = false;
					let el = document.createElement('textarea');
					el.value = e.text + appendedText;
					el.setAttribute('readonly', '');
					el.style.position = 'absolute';
					el.style.left = '-9999px';
					document.body.appendChild(el);
					if (document.getSelection().rangeCount > 0) {
						selected = document.getSelection().getRangeAt(0)
					}
					el.select();
					document.execCommand('copy');
					document.body.removeChild(el);
					if (selected) {
						document.getSelection().removeAllRanges();
						document.getSelection().addRange(selected);
					}
				}
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