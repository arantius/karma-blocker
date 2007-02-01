// from adblock plus
function gKablLoadInBrowser(url) {
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

function gKablConfigOpen() {
	document.getElementById('enabled').setAttribute('checked', gKablEnabled);
	document.getElementById('rules').value=gKablRules;
}

function gKablConfigAccept() {
	gKablEnabled=document.getElementById('enabled').checked;
	gKablRules=document.getElementById('rules').value;

	gKablSave();
}

function gKablCheckConfig() {
	var textbox=document.getElementById('rules');

	var parsed=gKablParseRules(textbox.value, true);

	if (parsed instanceof Array) {
		textbox.selectionStart=parseInt(parsed[0]);
		textbox.selectionEnd=parseInt(parsed[1]);
		textbox.focus();

		gKablSetStatusLabel('err', parsed[2]);
	} else {
		gKablSetStatusLabel('ok');
	}
}

function gKablSetStatusLabel(type, msg) {
	for (label in {'unk':1, 'ok':1, 'err':1}) {
		document.getElementById('status_'+label).setAttribute(
			'hidden', (label!=type)
		);
	}

	var errmsg=document.getElementById('status_errmsg');
	if ('err'==type) {
		errmsg.setAttribute('value', msg);
		errmsg.setAttribute('hidden', false);
	} else {
		errmsg.setAttribute('hidden', true);
	}
}
