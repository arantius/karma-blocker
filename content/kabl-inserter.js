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
// The Initial Developer of the Original Code is Joe Hewitt.
//
// Portions created by the Initial Developer are Copyright (C) 2005
// the Initial Developer. All Rights Reserved.
//
// Contributor(s):
//   Anthony Lieuallen, Copyright (C) 2007
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

var EXPORTED_SYMBOLS=['gKablInserter'];

Components.utils.import('resource://gre/modules/Services.jsm');

Components.utils.import('chrome://kabl/content/kabl-parse.js');
Components.utils.import('chrome://kabl/content/kabl-pref.js');

var gKablInserter={};

gKablInserter.addObserver=function() {
  Services.obs.addObserver(
      gKablInserter, 'content-document-global-created', false);
};

gKablInserter.removeObserver=function() {
  Services.obs.removeObserver(
      gKablInserter, 'content-document-global-created', false);
};

gKablInserter.observe=function(aSubject, aTopic, aData) {
  if ('content-document-global-created' != aTopic) return;
  if (!gKablPrefs.enabled) return;
  if (0 == gKablRulesObj.injectFunctions.length) return;

  var win = aSubject;
  // xpcnativewrapper = no expando, so unwrap
  win=win.wrappedJSObject || win;

  var obj=function(){return arguments.callee;};
  obj.__noSuchMethod__=obj;
  obj.toString=function(){return '';};

  for (var i=0, func=null; func=gKablRulesObj.injectFunctions[i]; i++) {
    var subObj=obj;
    var name=func.split('.');
    var baseName=name.shift(), subName;

    // Don't overwrite, if the page already has this object.
    if ('undefined'!=typeof win[baseName]) return;

    // Create properties, as necessary.
    while (subName=name.shift()) {
      subObj[subName]=obj;
      subObj=subObj[subName];
    }

    win[baseName]=obj;
  }
};
