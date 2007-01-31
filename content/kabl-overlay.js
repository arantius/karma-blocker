var gKabl={
	openConfig:function() {
//		window.openDialog(
//			'chrome://kabl/content/kabl-config.xul',
//			'kabl-config', 'resizable=yes,dependent=yes,close=no,dialog=no'
//		);
		var windowWatcher=Components
			.classes["@mozilla.org/embedcomp/window-watcher;1"]
			.getService(Components.interfaces.nsIWindowWatcher);
		windowWatcher.openWindow(
			null, 'chrome://kabl/content/kabl-config.xul', '_blank', 
			'chrome,centerscreen,resizable,dialog=no', null
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
