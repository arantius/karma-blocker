var gKablPref=Components.classes['@mozilla.org/preferences-service;1']
	.getService(Components.interfaces.nsIPrefService)
	.getBranch('extensions.kabl.');

// globals that hold the settings
var gKablEnabled, gKablRules, gKablDebug;
// load 'em up!
gKablLoad();

function gKablLoad() {
	gKablEnabled=gKablPref.getBoolPref('enabled');
	gKablRules=gKablPref.getCharPref('rules');
	gKablDebug=gKablPref.getIntPref('debug');
}

function gKablSave() {
	gKablPref.setBoolPref('enabled', gKablEnabled);
	gKablPref.setCharPref('rules', gKablRules);
	gKablPref.setCharPref('debug', gKablDebug);
}
