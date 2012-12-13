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

var EXPORTED_SYMBOLS = ['gKablPolicy'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('chrome://kabl/content/kabl-parse.js');
Cu.import('chrome://kabl/content/kabl-pref.js');
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

//\\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function cloneObject(obj) {
		if (null==obj || 'object'!=typeof obj) {
				return obj;
	}

		var out=new obj.constructor();
		for (var key in obj) {
				out[key]=cloneObject(obj[key]);
	}

		return out;
}

function strippedTextContent(el) {
	var text=el.innerHTML || el.textContent;
	if (!text) return '';

	text=text.replace(/[\s]+/g, ' '); //collapse whitespace
	text=text.replace(/^\s+|\s+$/g, ''); //strip leading/trailing whitespace
	text=text.replace(/<script.*?\/script>/gi, ''); //strip js
	text=text.replace(/<noscript.*?\/noscript>/gi, ''); //strip no-js
	text=text.replace(/<iframe.*?\/iframe>/gi, ''); // iframe, alternate content
	text=text.replace(/<!--.*?-->/gi, ''); //strip comments
	text=text.replace(/<\/?[^>]+>/gi, ''); //strip tags

	return text;
}

const gKablCollapseMarker=String(Math.floor(Math.random()*100000));
const UNORDERED_NODE_SNAPSHOT_TYPE=6;
const COLLAPSE_TEXT_LENGTH=25;

//\\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var startupDone=false;

var gKablPolicy={
	classDescription: 'Karma Blocker content policy',
	classID: Components.ID('cabe6b3f-578c-480f-a2f0-68bc4b7a1142'),
	contractID: '@arantius.com/kabl-policy;1',

	QueryInterface: XPCOMUtils.generateQI(
		[Ci.nsIContentPolicy, Ci.nsIFactory, Ci.nsISupportsWeakReference]),

	// nsIFactory
	createInstance: function(outer, iid) {
		if (outer) throw Cr.NS_ERROR_NO_AGGREGATION;
		return this.QueryInterface(iid);
	},

	// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

	startup: function(outer, iid) {
		if (startupDone) return;
		startupDone=true;

		try {
			var registrar = Components.manager.QueryInterface(
				Ci.nsIComponentRegistrar);
			registrar.registerFactory(
				gKablPolicy.classID, gKablPolicy.classDescription,
				gKablPolicy.contractID, gKablPolicy);
		} catch (e) {
			dump('KABL registration error: '+e+'\n');
		}

		var categoryManager = Cc['@mozilla.org/categorymanager;1']
			.getService(Ci.nsICategoryManager);
		categoryManager.addCategoryEntry(
			'content-policy', gKablPolicy.classDescription,
			gKablPolicy.contractID, false, true);
	},
	ACCEPT:Components.interfaces.nsIContentPolicy.ACCEPT,
	REJECT:Components.interfaces.nsIContentPolicy.REJECT_REQUEST,

	monitorWin:null,

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

		// Set base values.
		this['$thirdParty']=false;
		this['$origin']=undefined;
		this['$origin.host']=undefined;
		this['$origin.path']=undefined;
		this['$origin.scheme']=undefined;
		this['$origin.tag']=undefined;

		// Conditionally override them based on scheme.
		function setOriginTag(obj, node) {
			obj['$origin.tag']=node.tagName;

			if (!node.attributes) return;
			for (var i=0, attr=null; attr=node.attributes.item(i); i++) {
				obj['$origin.tag.'+attr.nodeName]=attr.nodeValue.toLowerCase();
			}

			if (obj['$origin.tag.width'] && obj['$origin.tag.height']) {
				obj['$origin.tag.size']=obj['$origin.tag.width']
					+'x'+obj['$origin.tag.height'];
			}
		}

		switch (org.scheme) {
		case 'about':
			this['$origin']=org.spec;
			setOriginTag(this, node);

			break;
		case 'file':
		case 'chrome':
			this['$origin']=org.spec;
			this['$origin.path']=org.path;
			this['$origin.scheme']=org.scheme;

			setOriginTag(this, node);

			break;
		case 'ftp':
		case 'http':
		case 'https':
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

			setOriginTag(this, node);

			break;
		default:
			if (gKablPrefs.debug) {
				dump(
					'kabl error condition, unknown origin scheme for\n    '+
					org.spec+'\n'
				);
			}
			break;
		}

		for (key in gKablPolicy.fieldNames) {
			if ('string'==typeof this[key]) this[key]=this[key].toLowerCase();
		}

		this.node=node;
	},

	// true if group matches
	evalGroup:function(group, fields) {
		var flag;

		for (var j=0, rule=null; rule=group.rules[j]; j++) {
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

			rule.match=flag;

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
			try {
				var el=fields.node
					.QueryInterface(Components.interfaces.nsIDOMNode);
			} catch (e) {
				if (gKablPrefs.debug) dump('Error in evalScore: '+e+'\n');
				return;
			}

			// Attempt to hide the node, i.e. if a non-loaded image will
			// result in an alt tag showing.
			try {
				el.setAttribute('style', 'display: none !important');
			} catch (e) {
				if (gKablPrefs.debug) dump('Error in evalScore: '+e+'\n');
			}

			// Mark the node for collapsing.
			try {
				if ('STYLE'!=el.tagName) {
					el.setAttribute('kabl', gKablCollapseMarker);
				}
			} catch (e) {
				if (gKablPrefs.debug) dump('Error in evalScore: '+e+'\n');
			}

			return this.REJECT;
		} else if ('threshold'==type ||
			('cutoff'==type && Math.abs(score)>=gKablRulesObj.cutoff)
		) {
			return this.ACCEPT;
		} else {
			return undefined;
		}
	},

	// nsIKablPolicy
	openMonitorWindow:function(parentWin) {
		if (this.monitorWin && false===this.monitorWin.closed) {
			return this.monitorWin;
		}

		return this.monitorWin=parentWin.open(
			'chrome://kabl/content/kabl-monitor.xul', null,
			'chrome,close=no,dependent,dialog,resizable'
		);
	},

	closeMonitorWindow:function() {
		this.monitorWin.close();
		this.monitorWin=null;
	},

	monitorAdd:function(fields, groups, score, flag) {
		if (!this.monitorWin || this.monitorWin.closed) return;

		var blocked=this.REJECT==flag;
		this.monitorWin.gKablMonitor.add(fields, groups, score, blocked);
	},

	collapse:function(event) {
		// Don't continue if we're configured not to do collapsing.
		if (!gKablRulesObj.collapse) return;

		// called when a content page loads, this looks for elements that were
		// marked as blocked, and looks for a parent node that should be
		// collapsed down (because it's probably just a wrapper around the ad)

		var doc=event.target;
		var xpr=doc.evaluate(
			'//*[@kabl="'+gKablCollapseMarker+'"]',
			doc, null, UNORDERED_NODE_SNAPSHOT_TYPE, null
		);
		for (var i=0, item=null; item=xpr.snapshotItem(i); i++) {
			// Climb the DOM, from this item, to find a container to collapse.
			var el=null;
			while (item=item.parentNode) {
				// Before we pick this as a collapsing candidate, check for
				// stop conditions.
				if ('BODY'==item.tagName) break;
				if ('HTML'==item.tagName) break;
				if (0!=item.getElementsByTagName('form').length) break;
				if (strippedTextContent(item).length>COLLAPSE_TEXT_LENGTH) break;

				el=item;
			}

			// If we selected an item, collapse it.
			// try block just in case, attempt to hide the node, i.e.
			// if a non-loaded image will result in an alt tag showing
			try {
				if (el) {
					el=el.QueryInterface(Components.interfaces.nsIDOMNode);
					el.setAttribute('style', 'display: none !important');
					el.setAttribute('kablcollapse', '1');
				}
			} catch (e) {
				if (gKablPrefs.debug) dump('Error in collapse: '+e+'\n');
			}
		}
	},

	// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

	// nsIContentPolicy
	shouldLoad:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra
	) {
		try {

		// when not enabled, let it through
		if (!gKablPrefs.enabled) {
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

		// never block core parts of the browser
		if ('chrome://global/'==contentLocation.spec.substr(0, 16)
			|| 'chrome://browser/'==contentLocation.spec.substr(0, 17)
		) {
			return this.ACCEPT;
		}

		// if it is chrome, and so is the origin, let it through
		if (contentLocation.schemeIs('chrome') &&
			requestOrigin && requestOrigin.schemeIs('chrome')
		) {
			return this.ACCEPT;
		}

		// Only block in content windows (this from AdBlock Plus)
		var win=this.windowForNode(requestingNode);
		if (!win) return this.ACCEPT;
		var winType=win
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
			.itemType;
		if (winType!=Components.interfaces.nsIDocShellTreeItem.typeContent) {
			return this.ACCEPT;
		}

		// Start checking for whether we should block!
		var fields=new this.Fields(
			contentType, contentLocation, requestOrigin, requestingNode
		);
		var monitorGroups=[];

		var score=0, flag=false, group;
		for (var i=0, group=null; group=gKablRulesObj.groups[i]; i++) {
			group=new cloneObject(group);
			monitorGroups.push(group);

			if (this.evalGroup(group, fields)) {
				score+=group.score;
				flag=this.evalScore('cutoff', score, fields);
				if (flag) break;
			} else {
				group.score=0;
			}
		}

		if (!flag) {
			flag=this.evalScore('threshold', score, fields);
		}

		if (!flag) flag=this.ACCEPT;

		this.monitorAdd(fields, monitorGroups, score, flag);
		return flag;

		} catch (e) {
			dump('ERROR IN kabl:\n');
			for (i in e) dump(i+'	'+e[i]+'\n');
			return this.ACCEPT;
		}
	},

	shouldProcess:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra
	) {
		return this.ACCEPT;
	}
};
