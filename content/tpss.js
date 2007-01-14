const TPSS_CONTRACTID="@arantius.com/tpss;1";
const TPSS_CID=Components.ID('{cabe6b3f-578c-480f-a2f0-68bc4b7a1142}');

const CONTENTPOLICY_CONTRACTID="@mozilla.org/layout/content-policy;1";
const CONTENTPOLICY_DESCRIPTION="Content policy service";

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var gPref=Components.classes['@mozilla.org/preferences-service;1']
	.getService(Components.interfaces.nsIPrefService)
	.getBranch('extensions.tpss.');
var gTpssEnabled=gPref.getBoolPref('enabled');

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var policy={
	hostToTld:function(host) {
		// this terribly simple method seems to work well enough
		return host.replace(/.*\.(.*......)/, '$1')
	},

	// nsIContentPolicy interface implementation
	shouldLoad:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra
	) {
		if (!gTpssEnabled) {
			// when not enabled:  let it through
			return Components.interfaces.nsIContentPolicy.ACCEPT;
		}

		if (null==requestOrigin || null==requestingNode) {
			// if we don't know where the request came from, we can't
			// judge it.  let it through
			return Components.interfaces.nsIContentPolicy.ACCEPT;
		}

		if ('http'!=contentLocation.scheme &&
			'https'!=contentLocation.scheme &&
			'ftp'!=contentLocation.scheme
		) {
			// it's not a remote scheme, definitely let it through
			return Components.interfaces.nsIContentPolicy.ACCEPT;
		}

		if ('undefined'!=typeof requestingNode.tagName &&
			'SCRIPT'==requestingNode.tagName
		) {
			var cHost=contentLocation.host;
			var rHost=requestOrigin.host;

			if ('undefined'!=typeof cHost && 'undefined'!=typeof rHost &&
				''!=cHost && ''!=rHost
			) {
				if (cHost.match(/^[0-9.]+$/)) {
					// the content host is all digits and dots ... IP!
					// don't munge it
				} else {
					cHost=this.hostToTld(cHost);
					rHost=this.hostToTld(rHost);
				}

				// at this point, we know the request originated from a 
				// <script> tag.  We have a host and a referring host,
				// and we've trimmed them down to the "top" domain name.
				// if they aren't the same domain, REJECT!
				if (cHost!=rHost) {
					dump(
						'TPSS denied: '+contentLocation.spec+'\n'+
						'from page:   '+requestOrigin.spec+'\n'
					);
					return Components.interfaces.nsIContentPolicy.REJECT_REQUEST;
				}
			}
		}

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
var factory={
	// nsIFactory interface implementation
	createInstance:function(outer, iid) {
		if (outer!=null) throw Components.results.NS_ERROR_NO_AGGREGATION;
		return policy;
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
if (typeof(Components.classes[TPSS_CONTRACTID]) == 'undefined') {
	// Component registration
	var compMgr=Components.manager
		.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	var cid=compMgr.contractIDToCID(CONTENTPOLICY_CONTRACTID);

	compMgr.registerFactory(
		cid, CONTENTPOLICY_DESCRIPTION, CONTENTPOLICY_CONTRACTID, factory
	);
	compMgr.registerFactory(
		TPSS_CID, CONTENTPOLICY_DESCRIPTION, TPSS_CONTRACTID, factory
	);
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var myPrefObserver={
	_branch:null,

	register:function() {
		this._branch=gPref;
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver('', this, false);
	},

	unregister:function() {
		if (!this._branch) return;
		this._branch.removeObserver('', this);
	},

	observe:function(aSubject, aTopic, aData) {
		if(aTopic != 'nsPref:changed') return;
		// aSubject is the nsIPrefBranch we're observing (after appropriate QI)
		// aData is the name of the pref that's been changed (relative to aSubject)
		
		if ('enabled'==aData) {
			gTpssEnabled=gPref.getBoolPref('enabled');
		}
	}
}
myPrefObserver.register();