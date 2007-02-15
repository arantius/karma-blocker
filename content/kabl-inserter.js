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

////////////////////////////////////////////////////////////////////////////////

// This file is derived from the 'firebug.js' file from Firebug version 0.4.1.
// All sections related to the injection of the console api into the content
// window have been kept and/or adapted, and all other sections removed.

////////////////////////////////////////////////////////////////////////////////

var gKablInserter={};

gKablInserter.initialize=function() {
	this.browser=document.getElementById('kablInserterBrowser');
	this.browser.addEventListener('load', gKablInserter.setup, true);
}

gKablInserter.setup=function(event) {
	gKablInserter.addObserver();
}

gKablInserter.shutdown=function() {
	try {
		this.removeObserver();
	} catch (exc) {}
}

////////////////////////////////////////////////////////////////////////////////

gKablInserter.addObserver=function() {
	var tabBrowser=document.getElementById('content');
	tabBrowser.addProgressListener(gKablInserterTabProgressListener,
		Components.interfaces.nsIWebProgress.NOTIFY_DOCUMENT);

	for (var i=0; i<tabBrowser.browsers.length; ++i) {
		var browser=tabBrowser.browsers[i];
		this.attachToWindow(browser.contentWindow);
	}
}

gKablInserter.removeObserver=function() {
	var tabBrowser=document.getElementById('content');
	tabBrowser.removeProgressListener(gKablInserterTabProgressListener);
}

////////////////////////////////////////////////////////////////////////////////

gKablInserter.attachToWindow=function(win) {
	if ('about:blank'==win.location.href) return;

	var browser=this.getBrowserByWindow(win);
	if (browser && !browser.attachedKablInserter) {
		browser.addProgressListener(gKablInserterFrameProgressListener,
			Components.interfaces.nsIWebProgress.NOTIFY_DOCUMENT);
		browser.attachedKablInserter=true;
	}
}

gKablInserter.attachToLoadingWindow=function(win) {
	if (!gKablEnabled) return;

	// xpcnativewrapper = no expando, so unwrap
	win=win.wrappedJSObject || win;

	for (var i=0, func=null; func=gKablRulesObj.injectFunctions[i]; i++) {
		if ('undefined'!=typeof win[func]) continue;
		if (gKablDebug>0) dump('kabl inject function: '+func+'\n');
		win[func]=new Function();
	}
}

gKablInserter.getBrowserByWindow=function(win) {
	var tabBrowser=document.getElementById('content');
	for (var i=0; i<tabBrowser.browsers.length; ++i) {
		var browser=tabBrowser.browsers[i];
		if (browser.contentWindow==win) return browser;
	}

	return null;
}

////////////////////////////////////////////////////////////////////////////////

function gKablInserterWebProgressListener() {}
gKablInserterWebProgressListener.prototype={
	stateIsRequest: false,

	QueryInterface:function(iid) {
		if (iid.equals(Components.interfaces.nsIWebProgressListener) ||
			iid.equals(Components.interfaces.nsISupportsWeakReference) ||
			iid.equals(Components.interfaces.nsISupports)
		) {
			return this;
		}

		throw Components.results.NS_NOINTERFACE;
	},

	onLocationChange: function() {},
	onStateChange:function() {},
	onProgressChange:function() {},
	onStatusChange:function() {},
	onSecurityChange:function() {},
	onLinkIconAvailable:function() {}
};

var gKablInserterTabProgressListener=new gKablInserterWebProgressListener();
gKablInserterTabProgressListener.onLocationChange=function(progress, request, loc) {
	// Only attach to windows that are their own parent - e.g. not frames
	if (progress.DOMWindow.parent==progress.DOMWindow) {
		gKablInserter.attachToWindow(progress.DOMWindow);
	}
}

var gKablInserterFrameProgressListener=new gKablInserterWebProgressListener();
gKablInserterFrameProgressListener.onStateChange=function(progress, request, flag, status) {
	// When the load of the top-level page or a frame within begins
	if (flag & Components.interfaces.nsIWebProgressListener.STATE_START) {
		gKablInserter.attachToLoadingWindow(progress.DOMWindow);
	}
}
