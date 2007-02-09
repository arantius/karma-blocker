// **** BEGIN LICENSE BLOCK *****
// Version:MPL 1.1/GPL 2.0/LGPL 2.1
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
// The Original Code is ManyOne Chrome Messenger.
//
// The Initial Developer of the Original Code is
// Alexander J. Vincent <ajvincent@gmail.com>.
// Portions created by the Initial Developer are Copyright (C) 2006
// the Initial Developer. All Rights Reserved.
//
// Contributor(s):
//   The ManyOne Networks, Inc. Development Team
//   Anthony Lieuallen
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

var componentName='mnIKablInjector';
var componentId  =Components.ID('{d10f581a-d163-4194-a0cc-75b6a8e35a09}');
var contractId   ='@arantius.com/kabl-injector;1';

function kablInjector() {
}
kablInjector.prototype={
	// nsISecurityCheckedComponent
	canCallMethod:function(iid) { return 'NoAccess'; },
	canCreateWrapper:function(iid) { return 'AllAccess'; },
	canGetProperty:function(iid) { return 'NoAccess'; },
	canSetProperty:function(iid) { return 'NoAccess'; },

	// nsIClassInfo
	classDescription:componentName,
	classID:componentId,
	contractID:contractId,
	flags:Components.interfaces.nsIClassInfo.SINGLETON,
	implementationLanguage:Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT,

	// nsIClassInfo
	getHelperForLanguage:function(aLanguage) { return null; },
	getInterfaces:function(aCount) {
		var interfaces=[
			Components.interfaces.mnIKablInjector,
			Components.interfaces.nsISecurityCheckedComponent,
			Components.interfaces.nsIClassInfo
		];
		aCount.value=interfaces.length;
		return interfaces;
	},

	// nsISupports
	QueryInterface:function(aIID) {
		if (aIID.equals(Components.interfaces.mnIKablInjector) ||
			aIID.equals(Components.interfaces.nsISecurityCheckedComponent) ||
			aIID.equals(Components.interfaces.nsIClassInfo) ||
			aIID.equals(Components.interfaces.nsISupports)
		) {
			return this;
		}

		return null
	}
};

/* The rest of this code is largely borrowed from 'Creating Applications With
 * Mozilla', http://books.mozdev.org, Chapter 8.
 */
var Module={
	registerSelf:function(compMgr, fileSpec, loc, type) {
		compReg=compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		compReg.registerFactoryLocation(
			componentId, componentName, contractId, fileSpec, loc, type
		);

		var catman=Components.classes['@mozilla.org/categorymanager;1']
			.getService(Components.interfaces.nsICategoryManager);
		catman.addCategoryEntry(
			'JavaScript global property', 'kablInjector',
			contractId, true, true
		);
	},

	unregisterSelf:function(compMgr, fileSpec, loc) {
		compReg=compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		compReg.unregisterFactoryLocation(componentId, fileSpec);

		var catman=Components.classes[CATMAN_CONTRACTID]
			.getService(Components.interfaces.nsICategoryManager);
		catman.deleteCategoryEntry(
			'JavaScript global property', contractId, true
		);
	},

	getClassObject:function(compMgr, aCID, aIID) {
		if (!aCID.equals(componentId)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		if (!aIID.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}
		return this.factory;
	},

	factory:{
		createInstance:function(outer, iid) {
			if (null!=outer) {
				throw Components.results.NS_ERROR_NO_AGGREGATION;
			}

			return (new kablInjector()).QueryInterface(iid);
		}
	},

	canUnload:function() {
		return true;
	},

	QueryInterface: function QueryInterface(aIID) {
		if (aIID.equals(Components.interfaces.nsIModule) ||
			 aIID.equals(Components.interfaces.nsISupports)
		) {
			return this;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

function NSGetModule(compMgr, fileSpec) {
	return Module;
}
