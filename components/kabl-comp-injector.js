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

const CLASS_ID    = Components.ID('{ed99d6dd-f1df-49c9-934a-1673cafee2ad}');
const CLASS_NAME  = 'KABL Function Injector';
const CONTRACT_ID = '@arantius.com/kabl-injector;1';

function KablInjector() {
};
KablInjector.prototype={
	// nsIObserver
	observe:function(aSubject, aTopic, aData) {
		// just in case!
		if ('xpcom-startup'!=aTopic) return;
		dump('KablInjector observe '+aTopic+'...\n');

		try {

			var catman=Components.classes['@mozilla.org/categorymanager;1']
				.getService(Components.interfaces.nsICategoryManager);

			catman.addCategoryEntry(
				'JavaScript global property', 'urchinTracker', CONTRACT_ID, false, true
			);

		} catch (e) {
			dump('KablInjector observe error:\n'+e.toSource()+'\n');
		}

	},

	// nsISupports
	QueryInterface:function(aIID) {
		dump('KablInjector QueryInterface...\n');

		if (!aIID.equals(Components.interfaces.nsISupports) &&
			!aIID.equals(Components.interfaces.nsIObserver)
		) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
};

var Factory={
	createInstance:function(aOuter, aIID) {
		dump('KablInjector Factory createInstance...\n');

		if (null!=aOuter) {
			throw Components.results.NS_ERROR_NO_AGGREGATION;
		}

		return (new KablInjector()).QueryInterface(aIID);
	}
};

var Module={
	registerSelf:function(aCompMgr, aFileSpec, aLocation, aType) {
		dump('KablInjector Module registerSelf...\n');

		aCompMgr=aCompMgr
			.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType
		);

		var catMan=Components.classes['@mozilla.org/categorymanager;1']
			.getService(Components.interfaces.nsICategoryManager);

		catMan.addCategoryEntry(
			'xpcom-startup', 'KablInjector', CONTRACT_ID, true, true
		);
	},

	unregisterSelf:function(aCompMgr, aLocation, aType) {
		dump('KablInjector Module unregisterSelf...\n');

		aCompMgr=aCompMgr
			.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
	},

	getClassObject:function(aCompMgr, aCID, aIID) {
		dump('KablInjector Module getClassObject...\n');

		if (!aIID.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}

		if (aCID.equals(CLASS_ID)) {
			return Factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	canUnload:function(aCompMgr) { return true; }
};

function NSGetModule(aCompMgr, aFileSpec) { return Module; }
