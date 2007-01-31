// from adblock plus
function loadInBrowser(url) {
	var windowMediator=Components
		.classes["@mozilla.org/appshell/window-mediator;1"]
		.getService(Components.interfaces.nsIWindowMediator);
	var currentWindow=windowMediator.getMostRecentWindow("navigator:browser");
	if (currentWindow) {
		try {
			currentWindow.delayedOpenTab(url);
		}
		catch(e) {
			currentWindow.loadURI(url);
		}
	} else {
		var protocolService=Components
			.classes["@mozilla.org/uriloader/external-protocol-service;1"]
		.getService(Components.interfaces.nsIExternalProtocolService);
		protocolService.loadUrl(url);
	}
}
