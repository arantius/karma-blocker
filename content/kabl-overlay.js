var kabl={
	pref:null,
	enabled:true,

	toggle:function () {
		this.enabled=!this.enabled;
		this.pref.setBoolPref('enabled', this.enabled);
		this.setImage();
	},

	setImage:function() {
		document.getElementById('status-bar-kabl-image').setAttribute(
			'src',
			'chrome://kabl/skin/kabl-'+(this.enabled?'on':'off')+'.png'
		);
	},

	onLoad:function() {
		window.removeEventListener('DOMContentLoaded', kabl.onLoad, false);
		kabl.setImage();
	}
};

kabl.pref=Components.classes['@mozilla.org/preferences-service;1']
	.getService(Components.interfaces.nsIPrefService)
	.getBranch('extensions.kabl.');
kabl.enabled=kabl.pref.getBoolPref('enabled');

window.addEventListener('DOMContentLoaded', kabl.onLoad, false);
