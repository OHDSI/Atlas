
const browser = detect.parse(navigator.userAgent);
const isBrowserSupported = browser.browser.family.toLowerCase() === 'chrome' && parseInt(browser.browser.version) > 63;
toggleWarning(isBrowserSupported);
function toggleWarning(doHide) {
    document.getElementById("b-alarm").style.display = (doHide ? "none" : "flex");
}