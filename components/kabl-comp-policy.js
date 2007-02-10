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

const KABL_CONTRACTID='@arantius.com/kabl-policy;1';
const KABL_CID=Components.ID('{cabe6b3f-578c-480f-a2f0-68bc4b7a1142}');

const CATMAN_CONTRACTID='@mozilla.org/categorymanager;1';
const JSLOADER_CONTRACTID='@mozilla.org/moz/jssubscript-loader;1';

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var Module={
	factoryLoaded:false,

	registerSelf:function(compMgr, fileSpec, location, type) {
		compMgr=compMgr.QueryInterface(
			Components.interfaces.nsIComponentRegistrar
		);
		compMgr.registerFactoryLocation(
			KABL_CID, 'KABL content policy', KABL_CONTRACTID,
			fileSpec, location, type
		);

		var catman=Components.classes[CATMAN_CONTRACTID]
			.getService(Components.interfaces.nsICategoryManager);
		catman.addCategoryEntry(
			'content-policy', KABL_CONTRACTID, KABL_CONTRACTID, true, true
		);
	},

	unregisterSelf:function(compMgr, fileSpec, location) {
		compMgr=compMgr.QueryInterface(
			Components.interfaces.nsIComponentRegistrar
		);

		compMgr.unregisterFactoryLocation(KABL_CID, fileSpec);

		var catman=Components.classes[CATMAN_CONTRACTID]
			.getService(Components.interfaces.nsICategoryManager);
		catman.deleteCategoryEntry('content-policy', KABL_CONTRACTID, true);
	},

	getClassObject:function(compMgr, cid, iid) {
		if (!cid.equals(KABL_CID)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		if (!iid.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}

		if (!this.factoryLoaded) {
			var loader=Components.classes[JSLOADER_CONTRACTID]
				.getService(Components.interfaces.mozIJSSubScriptLoader);

			loader.loadSubScript('chrome://kabl/content/kabl-pref.js');
			loader.loadSubScript('chrome://kabl/content/kabl-prefobs.js');
			loader.loadSubScript('chrome://kabl/content/kabl-policy.js');
			loader.loadSubScript('chrome://kabl/content/kabl-parse.js');

			this.factoryLoaded=true;
		}

		return gKablFactory;
	},

	canUnload:function(compMgr) {
		return true;
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// module initialisation
function NSGetModule(comMgr, fileSpec) {
	return Module;
}
