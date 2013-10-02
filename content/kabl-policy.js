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

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('chrome://kabl/content/kabl-parse.js');
Cu.import('chrome://kabl/content/kabl-pref.js');
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var gKablCollapseMarker=String(Math.floor(Math.random()*100000));
var UNORDERED_NODE_SNAPSHOT_TYPE=6;
var COLLAPSE_TEXT_LENGTH=25;

//\\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// constructor for details of the request
function Fields(type, loc, org, node) {
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

  if ('about:feeds' == org.spec) {
    var ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
    org = ioService.newURI(node.ownerDocument.location.href, null, null);
  }

  // Conditionally override them based on scheme.
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
      lHost=hostToTld(lHost);
      oHost=hostToTld(oHost);
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
      dump('kabl error condition, unknown origin scheme for\n\t'+org.spec+'\n');
    }
    break;
  }

  for (var i=0, key=null; key=fieldNames[i]; i++) {
    if ('string'==typeof this[key]) this[key]=this[key].toLowerCase();
  }

  this.node=node;
}

function cloneObject(obj) {
  if (null==obj || 'object'!=typeof obj) {
    return obj;
  }

  var out=new obj.constructor();
  for (var key in obj) {
    if(key=="rval") {
      // would have preferred to check "instanceof RegExp", but it fails when called from extensions
      //special case to avoid destroying the cached regex
      out[key]=obj[key];
    } else {
      out[key]=cloneObject(obj[key]);
    }
  }

  return out;
}

// true if group matches
function evalGroup(group, fields, monitor) {
  var flag=null;

  for (var j=0, rule=null; rule=group.rules[j]; j++) {
    flag=false;

    if (!(rule.field in fields)) continue;
    var fieldVal=fields[rule.field];
    switch (rule.op) {
      case '==':
        flag=fieldVal==rule.val;
        break;
      case '!=':
        flag=fieldVal!=rule.val;
        break;
      case '=~':
        flag=(new RegExp(rule.val)).test(fieldVal);
        break;
      case '!~':
        flag=!(new RegExp(rule.val)).test(fieldVal);
        break;
      case '^=':
        flag=fieldVal.substr(0, rule.val.length)==rule.val;
        break;
      case '$=':
        flag=fieldVal.substr(fieldVal.length-rule.val.length)==rule.val;
        break;
      case '<':
        fieldVal=parseFloat(fieldVal);
        flag=(!isNaN(fieldVal)) && fieldVal<rule.val;
        break;
      case '>':
        fieldVal=parseFloat(fieldVal);
        flag=(!isNaN(fieldVal)) && fieldVal>rule.val;
        break;
    }

    if(monitor) rule.match=flag;

    if (flag && 'any'==group.match) {
      return true;
    } else if (!flag && 'all'==group.match) {
      return false;
    }
  }

  if (flag && 'all'==group.match) {
    return true;
  }
}

function hostToTld(host) {
  // this terribly simple method seems to work well enough
  return host.replace(/.*\.(.*......)/, '$1');
}

// evaluate if/how we should handle this type of score
function evalScore(type, score, fields) {
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

    return REJECT;
  } else if ('threshold'==type ||
      ('cutoff'==type && Math.abs(score)>=gKablRulesObj.cutoff)
  ) {
    return ACCEPT;
  } else {
    return undefined;
  }
}

function monitoring() {
    return !(!monitorWin || monitorWin.closed);
}

function monitorAdd(fields, groups, score, flag) {
  if (!monitoring()) return;

  var blocked=REJECT==flag;
  monitorWin.gKablMonitor.add(fields, groups, score, blocked);
}

function setOriginTag(obj, node) {
  obj['$origin.tag']=node.tagName;

  if (!node.attributes) return;
  for (var i=0, attr=null; attr=node.attributes.item(i); i++) {
    obj['$origin.tag.'+attr.nodeName]=attr.value.toLowerCase();
  }

  if (obj['$origin.tag.width'] && obj['$origin.tag.height']) {
    obj['$origin.tag.size']=obj['$origin.tag.width']
        +'x'+obj['$origin.tag.height'];
  }
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

//Inherited from AdBlock Plus, utils.js
function windowForNode(node) {
  if (node && node.nodeType!=Components.interfaces.nsIDOMNode.DOCUMENT_NODE) {
    node = node.ownerDocument;
  }

  if (!node || node.nodeType!=Components.interfaces.nsIDOMNode.DOCUMENT_NODE) {
    return null;
  }

  return node.defaultView;
}

//\\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var ACCEPT=Components.interfaces.nsIContentPolicy.ACCEPT;
var REJECT=Components.interfaces.nsIContentPolicy.REJECT_REQUEST;

var fieldNames=['$type', '$thirdParty',
    '$url', '$url.host', '$url.path', '$url.scheme',
    '$origin', '$origin.host', '$origin.path', '$origin.scheme', '$origin.tag'];

var monitorWin=null;

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

    // set up initial parsed rules object
    gKablRulesObj.parse(gKablPrefs.rules);

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

  openMonitorWindow:function(parentWin) {
    if (monitorWin && false===monitorWin.closed) {
      return monitorWin;
    }

    return monitorWin=parentWin.open(
      'chrome://kabl/content/kabl-monitor.xul', null,
      'chrome,close=no,dependent,dialog,resizable'
    );
  },

  closeMonitorWindow:function() {
    monitorWin.close();
    monitorWin=null;
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
        doc, null, UNORDERED_NODE_SNAPSHOT_TYPE, null);
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
  shouldLoad:function(contentType, contentLocation, requestOrigin,
      requestingNode, mimeTypeGuess, extra) {
    try {

    // when not enabled, let it through
    if (!gKablPrefs.enabled) {
      return ACCEPT;
    }

    // it's not a remote scheme, definitely let it through
    if (!contentLocation.schemeIs('http') &&
        !contentLocation.schemeIs('https') &&
        !contentLocation.schemeIs('chrome') &&
        !contentLocation.schemeIs('ftp')
    ) {
      return ACCEPT;
    }

    // never block core parts of the browser
    if ('chrome://global/'==contentLocation.spec.substr(0, 16)
        || 'chrome://browser/'==contentLocation.spec.substr(0, 17)
    ) {
      return ACCEPT;
    }

    // if it is chrome, and so is the origin, let it through
    if (contentLocation.schemeIs('chrome') &&
        requestOrigin && requestOrigin.schemeIs('chrome')
    ) {
      return ACCEPT;
    }

    // Only block in content windows (this from AdBlock Plus)
    var win=windowForNode(requestingNode);
    if (!win) return ACCEPT;
    var winType=win
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
        .itemType;
    if (winType!=Components.interfaces.nsIDocShellTreeItem.typeContent) {
      return ACCEPT;
    }

    // Start checking for whether we should block!
    var fields=new Fields(
        contentType, contentLocation, requestOrigin, requestingNode);
    var monitor=monitoring();
    var monitorGroups=[];

    var score=0, flag=false;
    for (var i=0, group=null; group=gKablRulesObj.groups[i]; i++) {
      if(monitor) {
        group=cloneObject(group);
        monitorGroups.push(group);
      }

      if (evalGroup(group, fields, monitor)) {
        score+=group.score;
        flag=evalScore('cutoff', score, fields);
        if (flag) {
          if(monitor) monitorGroups.push({
            'name': 'Cutoff score reached, processing halted.',
            'score': null, 'match': null, 'rules': null});
          break;
        }
      } else {
        if(monitor) group.score=0;
      }
    }

    if (!flag) {
      flag=evalScore('threshold', score, fields);
    }

    if (!flag) flag=ACCEPT;

    if(monitor) monitorAdd(fields, monitorGroups, score, flag);
    return flag;

    } catch (e) {
      dump('ERROR IN kabl:\n');
      for (var i in e) dump(i+'	'+e[i]+'\n');
      return ACCEPT;
    }
  },

  shouldProcess:function(contentType, contentLocation, requestOrigin,
      requestingNode, mimeType, extra) {
    return ACCEPT;
  }
};
