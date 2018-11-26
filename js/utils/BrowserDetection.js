
const browserInfo  = bowser._detect(navigator.userAgent);
const isBrowserSupported =  browserInfo.name.toLowerCase() === 'chrome' && parseInt(browserInfo.version) > 63;
toggleWarning(isBrowserSupported);
function toggleWarning(doHide) {
    document.getElementById("b-alarm").style.display = (doHide ? "none" : "flex");
} 