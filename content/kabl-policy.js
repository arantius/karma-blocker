// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
//
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the 'License'); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
//
// Software distributed under the License is distributed on an 'AS IS' basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
//
// The Initial Developer of the Original Code is Anthony Lieuallen.
//
// Portions created by the Initial Developer are Copyright (C) 2007
// the Initial Developer. All Rights Reserved.
//
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the 'GPL'), or
// the GNU Lesser General Public License Version 2.1 or later (the 'LGPL'),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
//
// ***** END LICENSE BLOCK *****

var gKablPolicy={
	ACCEPT:Components.interfaces.nsIContentPolicy.ACCEPT,
	REJECT:Components.interfaces.nsIContentPolicy.REJECT_REQUEST,

	fieldNames:{
		'$type':1, '$url':1, '$url.host':1, '$url.path':1, '$url.scheme':1,
		'$thirdParty':1, '$origin':1, '$origin.host':1, '$origin.path':1,
		'$origin.scheme':1, '$origin.tag':1
	},

	hostToTld:function(host) {
		// this terribly simple method seems to work well enough
		return host.replace(/.*\.(.*......)/, '$1');
	},

	// Inherited from AdBlock Plus, utils.js
	windowForNode:function(node) {
		if (node && node.nodeType!=Components.interfaces.nsIDOMNode.DOCUMENT_NODE) {
			node = node.ownerDocument;
		}

		if (!node || node.nodeType!=Components.interfaces.nsIDOMNode.DOCUMENT_NODE) {
			return null;
		}

		return node.defaultView;
	},

	// constructor for details of the request
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
			if (!lHost.match(/^[0-9.]+$/)) {
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

		for (key in gKablPolicy.fieldNames) {
			if ('string'==typeof this[key]) this[key]=this[key].toLowerCase();
		}

		this.node=node;
	},

	// true if group matches
	evalGroup:function(group, fields) {
		var flag;

		if (gKablDebug>3) dump('  Group ...\n');
		for (var j=0, rule=null; rule=group.rules[j]; j++) {
			if (gKablDebug>4) dump('    rule = '+rule.toSource()+'\n');
			flag=false;

			switch (rule.op) {
				case '==':
					flag=fields[rule.field]==rule.val;
					break;
				case '!=':
					flag=fields[rule.field]!=rule.val;
					break;
				case '=~':
					flag=(new RegExp(rule.val)).test(fields[rule.field]);
					break;
				case '!~':
					flag=!(new RegExp(rule.val)).test(fields[rule.field]);
					break;
				case '^=':
					flag=fields[rule.field].substr(0, rule.val.length)==rule.val;
					break;
				case '$=':
					flag=fields[rule.field]
						.substr(fields[rule.field].length-rule.val.length)==rule.val;
					break;
			}

			if (gKablDebug>5) dump([
				'      ', fields[rule.field],
				' ', rule.op,
				' ', rule.val,
				'\n'
			].join(''));
			if (gKablDebug>4) dump('    match = '+flag+'\n');

			if (flag && 'any'==group.match) {
				return true;
			} else if (!flag && 'all'==group.match) {
				return false;
			}
		}

		if (flag && 'all'==group.match) {
			return true;
		}
	},

	// evaluate if/how we should handle this type of score
	evalScore:function(type, score, fields) {
		var scoreMsg='  score: '+score+' rules '+type+': '+gKablRulesObj[type]+' ... ';

		if (('threshold'==type && score>=gKablRulesObj.threshold) ||
			('cutoff'==type && score>=gKablRulesObj.cutoff)
		) {
			if (gKablDebug>1) dump(scoreMsg+'deny!\n');
			else if (1==gKablDebug) dump('kabl X '+fields['$url']+'\n');

			// try block just in case, attempt to hide the node, i.e.
			// if a non-loaded image will result in an alt tag showing
			try {
				fields.node=fields.node
					.QueryInterface(Components.interfaces.nsIDOMNode);
				fields.node.style.display='none !important';
			} catch (e) {
				if (gKablDebug) dump('Error in evalScore: '+e+'\n');
			}

			return this.REJECT;
		} else if ('threshold'==type ||
			('cutoff'==type && Math.abs(score)>=gKablRulesObj.cutoff)
		) {
			if (gKablDebug>1) dump(scoreMsg+'accept\n');
			else if (1==gKablDebug) dump('kabl   '+fields['$url']+'\n');

			return this.ACCEPT;
		} else {
			return undefined;
		}
	},

	// nsIContentPolicy interface implementation
	shouldLoad:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra
	) {
		// when not enabled, let it through
		if (!gKablEnabled) {
			return this.ACCEPT;
		}

		// it's not a remote scheme, definitely let it through
		if (!contentLocation.schemeIs('http') &&
			!contentLocation.schemeIs('https') &&
			!contentLocation.schemeIs('chrome') &&
			!contentLocation.schemeIs('ftp')
		) {
			return this.ACCEPT;
		}

		// if it is chrome, and so is the origin, let it through
		if (contentLocation.schemeIs('chrome') &&
			originLocation.schemeIs('chrome')
		) {
			return this.ACCEPT;
		}

		// Only block in content windows (this from AdBlock Plus)
		var win=this.windowForNode(requestingNode);
		var winType=win
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
			.itemType;
		if (winType!=Components.interfaces.nsIDocShellTreeItem.typeContent) {
			return this.ACCEPT;
		}

		// if the requesting node is XUL, it's the top-frame document
		// if we block it, things go very wrong, so let it through
		try {
			if (requestingNode.QueryInterface(
				Components.interfaces.nsIDOMXULElement
			)) {
				return this.ACCEPT;
			}
		} catch (e) {
			// if it isn't there, it will throw with NS_NOINTERFACE ..
			// fail silently
		}

		var fields=new this.Fields(
			contentType, contentLocation, requestOrigin, requestingNode
		);

		if (gKablDebug>1) dump('\nKarma Blocker - Checking:\nloc: '+contentLocation.spec+'\norg: '+requestOrigin.spec+'\n');
		var score=0, flag=false;
		for (var i=0, group=null; group=gKablRulesObj.groups[i]; i++) {
			if (this.evalGroup(group, fields)) {
				score+=group.score;

				flag=this.evalScore('cutoff', score, fields);
				if (flag) return flag;
			}
		}

		flag=this.evalScore('threshold', score, fields);
		if (flag) return flag;

		return this.ACCEPT;
	},

	// nsISupports interface implementation
	shouldProcess:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra
	) {
		if (gKablDebug>0) dump([
			'.... shouldProcess ....', contentType, contentLocation.spec,
			requestOrigin.spec, requestingNode, mimeType, extra
		,''].join('\n'));
		return this.ACCEPT;
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
		const CONTENTPOLICY_CONTRACTID="@mozilla.org/layout/content-policy;1";
		const CONTENTPOLICY_DESCRIPTION="Content policy service";

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
