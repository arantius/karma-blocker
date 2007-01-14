var tpss={
	pref:null,
	enabled:true,

	toggle:function () {
		this.enabled=!this.enabled;
		this.pref.setBoolPref('enabled', this.enabled);
		this.setImage();
	},

	setImage:function() {
		document.getElementById('status-bar-tpss-image').setAttribute(
			'src',
			'chrome://tpss/skin/tpss-'+(this.enabled?'on':'off')+'.png'
		);
	},

	onLoad:function() {
		window.removeEventListener('DOMContentLoaded', tpss.onLoad, false);
		tpss.setImage();
	}
};

tpss.pref=Components.classes['@mozilla.org/preferences-service;1']
	.getService(Components.interfaces.nsIPrefService)
	.getBranch('extensions.tpss.');
tpss.enabled=tpss.pref.getBoolPref('enabled');

window.addEventListener('DOMContentLoaded', tpss.onLoad, false);
