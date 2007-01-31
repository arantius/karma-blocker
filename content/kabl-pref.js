var gKablPref=Components.classes['@mozilla.org/preferences-service;1']
	.getService(Components.interfaces.nsIPrefService)
	.getBranch('extensions.kabl.');
var gKablEnabled=gKablPref.getBoolPref('enabled');
