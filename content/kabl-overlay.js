var gKabl={
	openConfig:function() {
		var windowWatcher=Components
			.classes["@mozilla.org/embedcomp/window-watcher;1"]
			.getService(Components.interfaces.nsIWindowWatcher);
		windowWatcher.openWindow(
			window, 'chrome://kabl/content/kabl-config.xul', null,
			'chrome,dependent,centerscreen,resizable,dialog', null
		);
	},

	toggle:function() {
		gKablEnabled=!gKablEnabled;
		gKablPref.setBoolPref('enabled', gKablEnabled);
	},

	setImage:function() {
		document.getElementById('status-bar-kabl-image').setAttribute(
			'src',
			'chrome://kabl/skin/kabl-'+(gKablEnabled?'on':'off')+'.png'
		);
	},

	onLoad:function() {
		window.removeEventListener('DOMContentLoaded', gKabl.onLoad, false);
		gKabl.setImage();
	}
};

window.addEventListener('DOMContentLoaded', gKabl.onLoad, false);
