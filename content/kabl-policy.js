var gKablPolicy={
	hostToTld:function(host) {
		// this terribly simple method seems to work well enough
		return host.replace(/.*\.(.*......)/, '$1')
	},

	// nsIContentPolicy interface implementation
	shouldLoad:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra
	) {
		if (!gKablEnabled) {
			// when not enabled:  let it through
			return Components.interfaces.nsIContentPolicy.ACCEPT;
		}

		if ('http' !=contentLocation.scheme &&
			'https'!=contentLocation.scheme &&
			'ftp'  !=contentLocation.scheme
		) {
			// it's not a remote scheme, definitely let it through
			return Components.interfaces.nsIContentPolicy.ACCEPT;
		}

		// todo: fill in the actual logic!

		return Components.interfaces.nsIContentPolicy.ACCEPT;
	},

	// this is now for urls that directly load media, and meta-refreshes (before activation)
	shouldProcess:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra
	) {
		return Components.interfaces.nsIContentPolicy.ACCEPT;
	},

	// nsISupports interface implementation
	QueryInterface:function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsIContentPolicy)
		) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// Factory object
var gKablFactory={
	// nsIFactory interface implementation
	createInstance:function(outer, iid) {
		if (outer!=null) throw Components.results.NS_ERROR_NO_AGGREGATION;
		return gKablPolicy;
	},

	// nsISupports interface implementation
	QueryInterface:function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsISupportsWeakReference) &&
			!iid.equals(Components.interfaces.nsIFactory) &&
			!iid.equals(Components.interfaces.nsIObserver)
		) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// Initialization and registration
if ('undefined'==typeof(Components.classes[KABL_CONTRACTID])) {
	(function() { // to keep from munging with scope
		// Component registration
		var compMgr=Components.manager
			.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		var cid=compMgr.contractIDToCID(CONTENTPOLICY_CONTRACTID);

		compMgr.registerFactory(
			cid, CONTENTPOLICY_DESCRIPTION, CONTENTPOLICY_CONTRACTID, gKablFactory
		);
		compMgr.registerFactory(
			KABL_CID, CONTENTPOLICY_DESCRIPTION, KABL_CONTRACTID, gKablFactory
		);
	})();
}
