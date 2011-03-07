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

var EXPORTED_SYMBOLS=['gKablRuleSync'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('chrome://kabl/content/kabl-pref.js');

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function gKablRuleSync(callback) {
	if (!gKablPrefs.sync_enabled) return;

	gKablSet('sync_last_time', new Date().valueOf());

	var xhr=Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
		.createInstance(Ci.nsIXMLHttpRequest);
	xhr.open('GET', gKablPrefs.sync_url, true);
	xhr.onreadystatechange = function() {
		gKablRuleSyncCallback(xhr, callback);
	};
	xhr.send(null);
}

function gKablRuleSyncCallback(xhr, callback) {
	if (4!=xhr.readyState) return;
	if (200!=xhr.status) return;

	var newRules=xhr.responseText;
	gKablSet('sync_last_rules', newRules);
	gKablSet('rules', newRules);

	callback && callback();
}

var timerCallback={
	notify:function(timer) {
		var now=new Date().valueOf();
		if (now < gKablPrefs.sync_last_time+gKablPrefs.sync_update_interval) {
			return;
		}
		gKablRuleSync();
	}
};

// Now, and ..
timerCallback.notify();
// .. once every hour.
var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
timer.initWithCallback(timerCallback, gKablPrefs.sync_check_interval,
	Ci.nsITimer.TYPE_REPEATING_SLACK);
