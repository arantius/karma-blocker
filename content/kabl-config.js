// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
//
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the 'License'); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
//
// Software distributed under the License is distributed on an 'AS IS' basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
//
// The Initial Developer of the Original Code is Anthony Lieuallen.
//
// Portions created by the Initial Developer are Copyright (C) 2007
// the Initial Developer. All Rights Reserved.
//
//
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the 'GPL'), or
// the GNU Lesser General Public License Version 2.1 or later (the 'LGPL'),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
//
// ***** END LICENSE BLOCK *****

Components.utils.import('chrome://kabl/content/kabl-parse.js');
Components.utils.import('chrome://kabl/content/kabl-pref.js');
Components.utils.import('chrome://kabl/content/kabl-sync.js');

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function gKablConfigOpen() {
	document.getElementById('enabled')
		.setAttribute('checked', gKablPrefs.enabled);
	document.getElementById('sync_enabled')
		.setAttribute('checked', gKablPrefs.sync_enabled);
	document.getElementById('sync_url')
		.setAttribute('value', gKablPrefs.sync_url);

	var rules=document.getElementById('rules');
	rules.value=gKablPrefs.rules;
	rules.selectionStart=0;
	rules.selectionEnd=0;
	rules.focus();

	gKablSetSyncTime();
}

function gKablConfigAccept() {
	var parseOk=gKablCheckConfig();
	if (!parseOk) {
		if (!confirm('Parse error.\nReally save rules?')) return;
	}

	// extract pref vals
	gKablPrefs.enabled=document.getElementById('enabled').checked;
	gKablPrefs.rules=document.getElementById('rules').value;
	gKablPrefs.sync_enabled=document.getElementById('sync_enabled').checked;
	gKablPrefs.sync_url=document.getElementById('sync_url').value;

	gKablSave();

	return true;
}

function gKablCheckConfig() {
	var textbox=document.getElementById('rules');

	var parsed=gKablRulesObj.parse(textbox.value);

	if (parsed instanceof Array) {
		textbox.selectionStart=parseInt(parsed[0]);
		textbox.selectionEnd=parseInt(parsed[1]);

		gKablSetStatusLabel('err', parsed[2]);
	} else {
		gKablSetStatusLabel('ok');
	}

	// return the focus here for continued editing
	textbox.focus();

	return !(parsed instanceof Array);
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

// This function originates from AdBlock Plus, reused under MPL.
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
			.classes['@mozilla.org/uriloader/external-protocol-service;1']
			.getService(Components.interfaces.nsIExternalProtocolService);
		protocolService.loadUrl(url);
	}
}

function gKablResetConfig() {
	if (!confirm('Really throw away current rules and reset to defaults?')) {
		return;
	}

	var defaultPref=Components.classes['@mozilla.org/preferences-service;1']
		.getService(Components.interfaces.nsIPrefService)
		.getDefaultBranch('extensions.kabl.');

	var textbox=document.getElementById('rules');
	textbox.value=defaultPref.getCharPref('rules');
}

function gKablSyncNow() {
	gKablRuleSync(gKablSyncNowCallback);
}

function gKablSyncNowCallback() {
	var rules=document.getElementById('rules');
	rules.value=gKablPrefs.rules;
	gKablSetSyncTime();
}

function gKablSetSyncTime() {
	var dt=new Date(gKablPrefs.sync_last_time);
	document.getElementById('sync_time').value='Last sync: '+dt.toLocaleString();
}
