const gKablDebug=true;

var gKablPolicy={
	hostToTld:function(host) {
		// this terribly simple method seems to work well enough
		return host.replace(/.*\.(.*......)/, '$1')
	},

	Fields:function(type, loc, org, node) {
		this['$type']=type;

		this['$url']=loc.spec;
		this['$url.host']=loc.host;
		this['$url.path']=loc.path;
		this['$url.scheme']=loc.scheme;

		if ('chrome'==org.scheme) {
			this['$thirdParty']=false;

			this['$origin']=undefined;
			this['$origin.host']=undefined;
			this['$origin.path']=undefined;
			this['$origin.scheme']=undefined;

			this['$origin.tag']=undefined;
		} else {
			var lHost=loc.host;
			var oHost=org.host;
			if (lHost.match(/^[0-9.]+$/)) {
				// the content host is all digits and dots ... IP!
				// don't munge it
			} else {
				lHost=gKablPolicy.hostToTld(lHost);
				oHost=gKablPolicy.hostToTld(oHost);
			}
			this['$thirdParty']=(lHost!=oHost);

			this['$origin']=org.spec;
			this['$origin.host']=org.host;
			this['$origin.path']=org.path;
			this['$origin.scheme']=org.scheme;

			this['$origin.tag']=node.tagName;
		}
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

		var fields=new this.Fields(
			contentType, contentLocation, requestOrigin, requestingNode
		);

		if (gKablDebug) dump('\n\nChecking against:\n'+contentLocation.spec+'\n'+requestOrigin.spec+'\n');
		var score=0, val, field, flag=false;
		for (var i=0, group=null; group=gKablRulesObj.groups[i]; i++) {
			if (gKablDebug) dump('  Group ...\n');
			for (var j=0, rule=null; rule=group.rules[j]; j++) {
				if (gKablDebug) dump('    rule = '+rule.toSource()+'\n');
				flag=false;

				// extract the actual value of this field
				field=fields[rule[0]];
				if ('string'==typeof field) field=field.toLowerCase();

				// decode the match value
				if ('$thirdParty'==rule[0]) {
					val=new Boolean(rule[2]);
				} else if ('$type'==rule[0]) {
					val=Components.interfaces.nsIContentPolicy[
						'TYPE_'+rule[2].toUpperCase()
					];
				} else {
					val=rule[2].substring(1, rule[2].length-1);
					val=val.toLowerCase();
				}

				switch (rule[1]) {
					case '==': flag=field==val; break;
					case '!=': flag=field!=val; break;
					case '=~': flag=(new RegExp(val)).test(field); break;
					case '!~': flag=!(new RegExp(val)).test(field); break;
					case '^=': flag=field.substr(0, val.length)==val; break;
					case '$=': flag=field.substr(field.length-val.length)==val; break;
				}

				if (gKablDebug) dump('      ' + field + ' <> ' + val + '\n');
				if (gKablDebug) dump('      match = '+flag+'\n');

				if (flag && 'any'==group.match) {
					if (gKablDebug) dump('flag and any, deny\n');
					return Components.interfaces.nsIContentPolicy.REJECT_REQUEST;
				} else if (!flag && 'all'==group.match) {
					if (gKablDebug) dump('!flag and all, skip to next rule\n');
					break;
				}
			}

			if (flag && 'all'==group.match) {
				if (gKablDebug) dump('final flag and all, deny\n');
				return Components.interfaces.nsIContentPolicy.REJECT_REQUEST;
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
