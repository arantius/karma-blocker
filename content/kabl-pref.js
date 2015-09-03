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

var EXPORTED_SYMBOLS=[
    'gKablLoad', 'gKablPrefs', 'gKablSet', 'gKablSave'];

Components.utils.import('chrome://kabl/content/kabl-parse.js');

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var prefBranch=Components.classes['@mozilla.org/preferences-service;1']
    .getService(Components.interfaces.nsIPrefService)
    .getBranch('extensions.kabl.');

// globals that hold the settings
var gKablPrefs={
    'debug':null,
    'enabled':null,
    'rules':null,
    'sync_enabled':null,
    'sync_check_interval':null,
    'sync_last_rules':null,
    'sync_last_time':null,
    'sync_update_interval':null,
    'sync_url':null};

function gKablLoad() {
  gKablPrefs.debug=prefBranch.getIntPref('debug');
  gKablPrefs.enabled=prefBranch.getBoolPref('enabled');
  gKablPrefs.rules=prefBranch.getCharPref('rules');
  gKablPrefs.sync_enabled=prefBranch.getBoolPref('sync_enabled');
  gKablPrefs.sync_check_interval=prefBranch.getIntPref('sync_check_interval');
  gKablPrefs.sync_last_rules=prefBranch.getCharPref('sync_last_rules');
  gKablPrefs.sync_last_time=parseFloat(prefBranch.getCharPref('sync_last_time'));
  gKablPrefs.sync_update_interval=prefBranch.getIntPref('sync_update_interval');
  gKablPrefs.sync_url=prefBranch.getCharPref('sync_url');
}

function gKablSave() {
  prefBranch.setIntPref('debug', gKablPrefs.debug);
  prefBranch.setBoolPref('enabled', gKablPrefs.enabled);
  prefBranch.setCharPref('rules', gKablPrefs.rules);
  prefBranch.setBoolPref('sync_enabled', gKablPrefs.sync_enabled);
  prefBranch.setIntPref('sync_check_interval', gKablPrefs.sync_check_interval);
  prefBranch.setCharPref('sync_last_rules', gKablPrefs.sync_last_rules);
  prefBranch.setCharPref('sync_last_time', String(gKablPrefs.sync_last_time));
  prefBranch.setIntPref('sync_update_interval', gKablPrefs.sync_update_interval);
  prefBranch.setCharPref('sync_url', gKablPrefs.sync_url);
}

function gKablSet(name, value) {
  gKablPrefs[name]=value;
  gKablSave();
}

// run the passed function on all navigator windows
function withAllChrome(func) {
  var mediator=Components.classes['@mozilla.org/appshell/window-mediator;1']
      .getService(Components.interfaces.nsIWindowMediator);
  var winEnum=mediator.getEnumerator('navigator:browser');
  while (winEnum.hasMoreElements()){
    func(winEnum.getNext());
  }
}

var gKablPrefObserver={
  _branch:null,

  register:function() {
    prefBranch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    prefBranch.addObserver('', this, false);
  },

  observe:function(aSubject, aTopic, aData) {
    if('nsPref:changed'!=aTopic) return;
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)
    gKablLoad();
    switch (aData) {
    case 'enabled':
      withAllChrome(function(win) { win.gKabl.setToolbarButtonState(); });
      break;
    case 'rules':
      gKablRulesObj.parse(prefBranch.getCharPref('rules'));
      break;
    }
  }
};

gKablPrefObserver.register();
gKablLoad();
