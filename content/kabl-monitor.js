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

Components.utils.import('chrome://kabl/content/kabl-policy.js');

//\\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

var LENGTH_LIMIT = 4000;

var lastSelectedItem=null;
var $=function(x){ return document.getElementById(x); }

var gKablMonitor={
  typeMap:{
    '1':'other',
    '2':'script',
    '3':'image',
    '4':'stylesheet',
    '5':'object',
    '6':'document',
    '7':'subdocument',
    '8':'refresh',
    '9':'xbl',
    '10':'ping',
    '11':'xmlhttprequest',
    '12':'object_subrequest'
  },

  treeRes:null,
  treeScore:null,
  changing:false,

  onLoad:function() {
    window.removeEventListener('DOMContentLoaded', gKablMonitor.onLoad, false);
    gKablMonitor.treeRes=$('treeRes');
    gKablMonitor.treeScore=$('treeScore');

    Cc['@mozilla.org/parentprocessmessagemanager;1']
        .getService(Ci.nsIMessageBroadcaster)
        .broadcastAsyncMessage('kabl:monitor-opened');
    Cc['@mozilla.org/parentprocessmessagemanager;1']
        .getService(Ci.nsIMessageListenerManager)
        .addMessageListener('kabl:monitor', gKablMonitor.add);

    $('filterForm').addEventListener('click', function(event) {
      // After timeout so that .checked/.selected matches new state.
      setTimeout(gKablMonitor.changeShowing, 0, event);
    }, true);
  },

  onUnload:function() {
    Cc['@mozilla.org/parentprocessmessagemanager;1']
        .getService(Ci.nsIMessageBroadcaster)
        .broadcastAsyncMessage('kabl:monitor-closed');
    Cc['@mozilla.org/parentprocessmessagemanager;1']
        .getService(Ci.nsIMessageListenerManager)
        .removeMessageListener('kabl:monitor', gKablMonitor.add);
  },

  changeShowing:function(event) {
    var checkedShowAll = $('showTypeAll').checked;
    var checkedAllOther =
        $('showTypeXhr').checked &&
        $('showTypeCss').checked &&
        $('showTypeImg').checked &&
        $('showTypeScr').checked &&
        $('showTypeOth').checked;

    if ('showTypeAll' == event.target.id) {
      $('showTypeXhr').checked =
          $('showTypeCss').checked =
          $('showTypeImg').checked =
          $('showTypeScr').checked =
          $('showTypeOth').checked =
          $('showTypeAll').checked;
    } else if (checkedAllOther) {
      $('showTypeAll').checked = true;
    } else {
      $('showTypeAll').checked = false;
    }

    for (var i = 0, row = null; row = gKablMonitor.treeRes.childNodes[i]; i++) {
      row.hidden = !gKablMonitor.showRow(row);
    }
  },

  clear:function() {
    gKablMonitor.changing=true;
    while (gKablMonitor.treeScore.firstChild) {
      gKablMonitor.treeScore.removeChild(gKablMonitor.treeScore.firstChild);
    }
    while (gKablMonitor.treeRes.firstChild) {
      gKablMonitor.treeRes.removeChild(gKablMonitor.treeRes.firstChild);
    }
    gKablMonitor.changing=false;
  },

  resSelect:function(event) {
    if (gKablMonitor.changing) return;

    var item=gKablMonitor.treeRes.childNodes[
        gKablMonitor.treeRes.parentNode.currentIndex];
     if (item && item==lastSelectedItem) return;
     lastSelectedItem=item;

    while (gKablMonitor.treeScore.firstChild) {
      gKablMonitor.treeScore.removeChild(gKablMonitor.treeScore.firstChild);
    }

     if (!item) return;

    var group;
    for (i in item.groups) {
      group=item.groups[i];
      gKablMonitor.treeScore.appendChild(gKablMonitor.groupItem(group));
    }
  },

  showRow:function(row) {
    if ($('showBlockedNo').selected && row.blocked) return false;
    if ($('showBlockedYes').selected && !row.blocked) return false;

    if ($('showTypeAll').checked) return true;

    if (row.fields.$type == 2) return $('showTypeScr').checked;
    else if (row.fields.$type == 3) return $('showTypeImg').checked;
    else if (row.fields.$type == 4) return $('showTypeCss').checked;
    else if (row.fields.$type == 11) return $('showTypeXhr').checked;
    else return $('showTypeOth').checked;
  },

  add:function(message) {
    fields = message.data.fields;
    groups = message.data.groups;
    score = message.data.score;
    blocked = message.data.blocked;

    var item=gKablMonitor.fieldItem('$url', fields.$url, score, blocked);
    item.blocked=blocked;
    item.fields=fields;
    item.groups=groups;

    item.hidden = !gKablMonitor.showRow(item);

    var children=document.createElement('treechildren');
    item.appendChild(children);

    var subItem;
    for (i in fields) {
      if ('$url'==i) continue;
      if ('node'==i) continue;
      if ('undefined'==typeof fields[i]) continue;

      subItem=gKablMonitor.fieldItem(i, fields[i]);
      children.appendChild(subItem);
    }

    gKablMonitor.treeRes.insertBefore(item, gKablMonitor.treeRes.firstChild);
    while (gKablMonitor.treeRes.childNodes.length > LENGTH_LIMIT) {
      gKablMonitor.treeRes.removeChild(gKablMonitor.treeRes.lastChild);
    }
  },

  fieldItem:function(name, value, score, blocked) {
    if ('$type'==name) {
      value=gKablMonitor.typeMap[value];
    }

    var cell, row, item=document.createElement('treeitem');

    row=document.createElement('treerow');
    item.appendChild(row);

    cell=document.createElement('treecell');
    cell.setAttribute('label', name+': '+value);
    row.appendChild(cell);

    if ('undefined'!=typeof score) {
      item.setAttribute('container', 'true');

      cell=document.createElement('treecell');
      cell.setAttribute('label', score);
      row.appendChild(cell);

      cell=document.createElement('treecell');
      if (blocked) cell.setAttribute('properties', 'blocked');
      row.appendChild(cell);
    }

    return item;
  },

  groupItem:function(group) {
    var cell, row, item=document.createElement('treeitem');
    if (group.rules) item.setAttribute('container', 'true');

    row=document.createElement('treerow');
    item.appendChild(row);

    cell=document.createElement('treecell');
    cell.setAttribute('label', group.name);
    row.appendChild(cell);

    cell=document.createElement('treecell');
    cell.setAttribute('label', group.score);
    row.appendChild(cell);

    if (!group.rules) return item;

    var children=document.createElement('treechildren');
    item.appendChild(children);

    var rule;
    for (i in group.rules) {
      rule=group.rules[i];

      var subItem=document.createElement('treeitem');

      row=document.createElement('treerow');
      subItem.appendChild(row);
      children.appendChild(subItem);

      cell=document.createElement('treecell');
      var val=rule.val;
      if ('$type'==rule.field) val=this.typeMap[val];
      cell.setAttribute('label', rule.field+' '+rule.op+' '+val);
      row.appendChild(cell);

      cell=document.createElement('treecell');
      var match='';
      if (null===rule.match) {
        match='Skipped';
      } else {
        match=rule.match?'Yes':'No';
      }
      cell.setAttribute('label', match);
      row.appendChild(cell);
    }

    return item;
  },

  labelForResourceItem:function(item) {
    //          row        cell
    return item.firstChild.firstChild.getAttribute('label');
  },

  withSelectedResources:function(callbackRow, callbackDetail) {
    var treeView=gKablMonitor.treeRes.parentNode.view;
    var start=new Object(), end=new Object();
    for (var i=0; i<treeView.selection.getRangeCount(); i++) {
      treeView.selection.getRangeAt(i, start, end);
      for (var j=start.value; j<=end.value; j++) {
        if (treeView.isContainer(j)) {
          callbackRow( treeView.getItemAtIndex(j), j, treeView );
        } else {
          callbackDetail( treeView.getItemAtIndex(j), j, treeView );
        }
      }
    }
  },

  onResourceContextShowing:function(event) {
    // Find which rows are selected.
    var selectedRow=0;
    var selectedDetail=0;
    var selectedOpen=0;
    var selectedClosed=0;
    gKablMonitor.withSelectedResources(
      function(item, i, view) {
        selectedRow++;
        if (view.isContainerOpen(i)) {
          selectedOpen++;
        } else {
          selectedClosed++;
        }
      },
      function() { selectedDetail++; }
    );

    // Set appropriate enabled/disabled statuses based on selection
    var context=$('resource-context');
    context.childNodes[0].disabled=(0==selectedRow+selectedDetail);
    context.childNodes[1].disabled=(0==selectedRow || 0!=selectedDetail);
    context.childNodes[2].disabled=(1!=selectedRow || 0!=selectedDetail);
    context.childNodes[4].disabled=(0==selectedClosed);
    context.childNodes[5].disabled=(0==selectedOpen);
  },

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

  resourceContextCopy:function() {
    var data=[];
    function addData(item) {
      var label=gKablMonitor.labelForResourceItem(item);
      data.push(label);
    }

    gKablMonitor.withSelectedResources(addData, addData);

    Components.classes["@mozilla.org/widget/clipboardhelper;1"]
        .getService(Components.interfaces.nsIClipboardHelper)
        .copyString(data.join('\n'));
  },

  resourceContextDelete:function() {
    var items=[];

    gKablMonitor.withSelectedResources(
      function(item) { items.push(item); },
      function(){}
    );

    gKablMonitor.changing=true;
    for (var i=0, item=null; item=items[i]; i++) {
      item.parentNode.removeChild(item);
    }
    gKablMonitor.changing=false;
  },

  resourceContextOpen:function() {
    gKablMonitor.withSelectedResources(
      function(item) {
        var label=gKablMonitor.labelForResourceItem(item);
        window.opener.getBrowser().addTab(
          label.substr(label.indexOf(' ')+1)
        );
      },
      function(){}
    );
  },

  resourceContextExpand:function(ifOpen) {
    gKablMonitor.changing=true;
    gKablMonitor.withSelectedResources(
      function(item, i, view) {
        if (ifOpen==view.isContainerOpen(i)) view.toggleOpenState(i);
      },
      function(){}
    );
    gKablMonitor.changing=false;
  }
};

window.addEventListener('DOMContentLoaded', gKablMonitor.onLoad, false);
window.addEventListener('unload', gKablMonitor.onUnload, false);
