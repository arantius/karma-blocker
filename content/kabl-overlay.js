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

Components.utils.import('chrome://kabl/content/kabl-pref.js');

var gKabl={
  menuitemToggle: null,
  menuitemReload: null,

  isReloading: false,
  reloadTimer: null,

  finishReload:function() {
    if (!gKabl.isReloading) return;
    dump("Finishing disabled reload ...\n");
    gKabl.isReloading = false;
    if (gKabl.reloadTimer) {
      clearTimeout(gKabl.reloadTimer);
      gKabl.reloadTimer = null;
    }
    gKablSet('enabled', true);
  },

  openConfig:function() {
    var windowWatcher=Components
        .classes['@mozilla.org/embedcomp/window-watcher;1']
        .getService(Components.interfaces.nsIWindowWatcher);
    windowWatcher.openWindow(
        window, 'chrome://kabl/content/kabl-config.xul', null,
        'chrome,dependent,centerscreen,resizable,dialog', null);
  },

  openMonitorWindow:function(parentWin) {
    if (gKabl.monitorWin && false===gKabl.monitorWin.closed) {
      return gKabl.monitorWin;
    }

    return gKabl.monitorWin=parentWin.open(
      'chrome://kabl/content/kabl-monitor.xul', null,
      'chrome,close=no,dependent,dialog,resizable'
    );
  },

  popupshowing:function() {
    gKabl.menuitemToggle.style.fontWeight
        = gKablPrefs.enabled ? 'normal' : 'bold';
    gKabl.menuitemReload.style.fontWeight
        = gKablPrefs.enabled ? 'bold' : 'normal';
  },

  toggle:function() {
    gKablSet('enabled', !gKablPrefs.enabled);
  },

  toolbarButtonDefault:function() {
    dump('>>> toolbarButtonDefault ...\n');
    if (gKablPrefs.enabled) {
      dump("Reloading, disabled ...\n");
      gKabl.isReloading = true;
      gKablSet('enabled', false);
      gKabl.reloadTimer = setTimeout(gKabl.finishReload, 30000);
      try {
        gBrowser.reloadTab(gBrowser.mCurrentTab);
      } catch (e) {
        dump('could not reload tab!\n'+e+'\n');
      }
    } else {
      gKablSet('enabled', true);
    }
  },

  setToolbarButtonState:function() {
    var tb=document.getElementById('tb-kabl');
    if (tb) {
      // Standard is disabled=true -- but that disables the button, so
      // clicking it fires no command and won't re-enable us.  Use our
      // own yes/no styled to be similar.
      tb.setAttribute('kabl_disabled', gKablPrefs.enabled ? 'no' : 'yes');
    }
  },

  onContentLoad:function(event) {
    gKabl.finishReload();
  },

  onChromeLoad:function() {
    gKabl.setToolbarButtonState();

    gKabl.menuitemToggle
        = document.querySelector('#tb-kabl menuitem[label=Toggle]');
    gKabl.menuitemReload
    = document.querySelector('#tb-kabl menuitem[label=Reload]');

    window.removeEventListener('load', gKabl.onLoad, false);
    gBrowser.addEventListener('load', gKabl.onContentLoad, true);

    Components
        .classes['@mozilla.org/globalmessagemanager;1']
        .getService(Ci.nsIMessageListenerManager)
        .loadFrameScript('chrome://kabl/content/kabl-frame.js', true);
  }
};

window.addEventListener('load', gKabl.onChromeLoad, false);
