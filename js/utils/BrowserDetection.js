
const browserInfo = bowser.getParser(navigator.userAgent).getBrowser();
const isBrowserSupported = browserInfo.name.toLowerCase() === 'chrome' && parseInt(browserInfo.version) > 63;
toggleWarning(isBrowserSupported);

function toggleWarning(doHide) {

    document.getElementById("b-alarm").style.display = (doHide ? "none" : "flex");
}