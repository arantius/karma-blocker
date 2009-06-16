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
	clearing: false,

	onLoad:function() {
		window.removeEventListener('DOMContentLoaded', gKablMonitor.onLoad, false);
		gKablMonitor.treeRes=document.getElementById('treeRes');
		gKablMonitor.treeScore=document.getElementById('treeScore');
	},

	open:function() {
		Components
			.classes['@arantius.com/kabl-policy;1']
			.createInstance(Components.interfaces.nsIKablPolicy)
			.openMonitorWindow(window);
	},

	close:function() {
		Components
			.classes['@arantius.com/kabl-policy;1']
			.createInstance(Components.interfaces.nsIKablPolicy)
			.closeMonitorWindow(window);
	},
	
	clear:function() {
		this.clearing=true;
		while (this.treeScore.firstChild) {
			this.treeScore.removeChild(this.treeScore.firstChild);
		}
		while (this.treeRes.firstChild) {
			this.treeRes.removeChild(this.treeRes.firstChild);
		}
		this.clearing=false;
	},
	
	resSelect:function(event) {
		if (this.clearing) return;

		while (this.treeScore.firstChild) {
			this.treeScore.removeChild(this.treeScore.firstChild);
		}

		var group, item=this.treeRes.childNodes[
			this.treeRes.parentNode.currentIndex
		];
		for (i in item.groups) {
			group=item.groups[i];
			this.treeScore.appendChild(
				this.groupItem(group)
			);
		}
	},

	add:function(fields, groups, score, blocked) {
		if (!blocked && document.getElementById('showBlocked').selected) {
			return;
		}

		var item=this.fieldItem('$url', fields.$url, score, blocked);
		item.groups=groups;

		var children=document.createElement('treechildren');
		item.appendChild(children);

		var subItem;
		for (i in fields) {
			if ('$url'==i) continue;
			if ('node'==i) continue;
			if ('undefined'==typeof fields[i]) continue;

			subItem=this.fieldItem(i, fields[i]);
			children.appendChild(subItem);
		}

		this.treeRes.insertBefore(item, this.treeRes.firstChild);
	},

	fieldItem:function(name, value, score, blocked) {
		if ('$type'==name) {
			value=this.typeMap[value];
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
		item.setAttribute('container', 'true');

		row=document.createElement('treerow');
		item.appendChild(row);
		
		cell=document.createElement('treecell');
		cell.setAttribute('label', group.name);
		row.appendChild(cell);

		cell=document.createElement('treecell');
		cell.setAttribute('label', group.score);
		row.appendChild(cell);

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
			cell.setAttribute('label', rule.field+' '+rule.op+' '+rule.val);
			row.appendChild(cell);
			
			cell=document.createElement('treecell');
			cell.setAttribute('label', rule.match?'Yes':'No');
			row.appendChild(cell);
		}

		return item;
	},

	labelForResourceItem:function(item) {
		//          row        cell
		return item.firstChild.firstChild.getAttribute('label');
	},

	onResourceContextShowing:function(event) {
		dump('>>> onResourceContextShowing() ...\n');
		
		var items=this.treeRes.getElementsByTagName('treeitem');
		var treeView=this.treeRes.parentNode.view;
		var selectedUrl=0
		var selectedElse=0
		var start=new Object(), end=new Object();
		for (var i=0; i<treeView.selection.getRangeCount(); i++) {
			treeView.selection.getRangeAt(i, start, end);
			for (var j=start.value; j<=end.value; j++) {
				var item=treeView.getItemAtIndex(j);
				if ('true'==item.getAttribute('container')) {
					selectedUrl++;
				} else {
					selectedElse++;
				}
			}
		}

		/*
		var selectedItem=this.treeRes.childNodes[
			this.treeRes.parentNode.currentIndex
		];
		*/
		dump('url: '+selectedUrl+' else: '+selectedElse+'\n');

		var context=document.getElementById('resource-context');
		context.childNodes[0].disabled=(0==selectedUrl+selectedElse);
		context.childNodes[1].disabled=(0==selectedUrl || 0!=selectedElse);
		context.childNodes[2].disabled=(1!=selectedUrl || 0!=selectedElse);
	}
};

window.addEventListener('DOMContentLoaded', gKablMonitor.onLoad, false);
