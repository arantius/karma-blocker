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

var gKablPrefObserver={
	_branch:null,

	register:function() {
		this._branch=gKablPref;
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver('', this, false);
	},

	unregister:function() {
		if (!this._branch) return;
		this._branch.removeObserver('', this);
	},

	// run the passed function on all navigator windows
	withAllChrome:function(func) {
		var ifaces=Components.interfaces;
		var mediator=Components.classes['@mozilla.org/appshell/window-mediator;1'].
			getService(ifaces.nsIWindowMediator);
		var win,winEnum=mediator.getEnumerator('navigator:browser');
		while (winEnum.hasMoreElements()){
			win=winEnum.getNext();

			func(win);
		}
	},

	observe:function(aSubject, aTopic, aData) {
		if('nsPref:changed'!=aTopic) return;
		// aSubject is the nsIPrefBranch we're observing (after appropriate QI)
		// aData is the name of the pref that's been changed (relative to aSubject)

		switch (aData) {
		case 'enabled':
			// load the new value
			gKablEnabled=gKablPref.getBoolPref('enabled');

			this.withAllChrome(function(win) {
				win.gKablEnabled=gKablEnabled;
				win.gKabl.setImage();
			});

			break;
		case 'rules':
			// load the new value
			gKablRules=gKablPref.getCharPref('rules');

			// save it in global component context, for future policy checks
			gKablRulesObj.parse(gKablRules);

			this.withAllChrome(function(win) {
				win.gKablRulesObj=gKablRulesObj;
			});

			break;
		case 'debug':
			// load the new value
			gKablDebug=gKablPref.getIntPref('debug');
		}
	}
}
gKablPrefObserver.register();
