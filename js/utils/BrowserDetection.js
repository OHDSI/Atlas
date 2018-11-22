
const browser = detect.parse(navigator.userAgent);
const isBrowserSupported = browser.browser.family.toLowerCase() === 'chrome' && parseInt(browser.browser.version) > 63;
if (!isBrowserSupported){
    document.getElementById("b-alarm").style.visibility = "visible";
} else {
    hideWarning();
}

function hideWarning() {
    document.getElementById("b-alarm").style.display = "none";
}