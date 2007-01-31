var gKablPref=Components.classes['@mozilla.org/preferences-service;1']
	.getService(Components.interfaces.nsIPrefService)
	.getBranch('extensions.kabl.');

// globals that hold the settings
var gKablEnabled, gKablRules;
// load 'em up!
gKablLoad();

function gKablLoad() {
	gKablEnabled=gKablPref.getBoolPref('enabled');
	gKablRules=gKablPref.getCharPref('rules');
}

function gKablSave() {
	gKablPref.setBoolPref('enabled', gKablEnabled);
	gKablPref.setCharPref('rules', gKablRules);
}
