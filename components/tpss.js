const _TPSS_CONTRACTID="@arantius.com/tpss;1";
const _TPSS_CID=Components.ID('{cabe6b3f-578c-480f-a2f0-68bc4b7a1142}');

const CATMAN_CONTRACTID="@mozilla.org/categorymanager;1";
const JSLOADER_CONTRACTID="@mozilla.org/moz/jssubscript-loader;1";

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var module={
	factoryLoaded:false,

	registerSelf:function(compMgr, fileSpec, location, type) {
		compMgr=compMgr.QueryInterface(
			Components.interfaces.nsIComponentRegistrar
		);
		compMgr.registerFactoryLocation(
			_TPSS_CID, "TPSS content policy", _TPSS_CONTRACTID,
			fileSpec, location, type
		);

		var catman=Components.classes[CATMAN_CONTRACTID]
			.getService(Components.interfaces.nsICategoryManager);
		catman.addCategoryEntry(
			"content-policy", _TPSS_CONTRACTID, _TPSS_CONTRACTID, true, true
		);
	},

	unregisterSelf:function(compMgr, fileSpec, location) {
		compMgr=compMgr.QueryInterface(
			Components.interfaces.nsIComponentRegistrar
		);

		compMgr.unregisterFactoryLocation(_TPSS_CID, fileSpec);

		var catman=Components.classes[CATMAN_CONTRACTID]
			.getService(Components.interfaces.nsICategoryManager);
		catman.deleteCategoryEntry("content-policy", _TPSS_CONTRACTID, true);
	},

	getClassObject:function(compMgr, cid, iid) {
		if (!cid.equals(_TPSS_CID)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		if (!iid.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}

		if (!this.factoryLoaded) {
			var loader=Components.classes[JSLOADER_CONTRACTID]
				.getService(Components.interfaces.mozIJSSubScriptLoader);
			loader.loadSubScript('chrome://tpss/content/tpss.js');
			this.factoryLoaded=factory;
		}

		return factory;
	},

	canUnload:function(compMgr) {
		return true;
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// module initialisation
function NSGetModule(comMgr, fileSpec) {
	return module;
}
