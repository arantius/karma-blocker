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

var gKablTokens=[];
// settings section
gKablTokens['settings']='\\[Settings\\]';
gKablTokens['settings_cmd']='(?:threshold|cutoff)';

// inject section
gKablTokens['inject']='\\[Inject\\]';
gKablTokens['inject_cmd']='(?:function)';

// group section
gKablTokens['group']='\\[Group\\]';
gKablTokens['group_cmd']='(?:match|score|rule)';
gKablTokens['group_match_val']='(?:all|any)';

// fields
gKablTokens['field']='(?:'+
	'\\$thirdParty|\\$type'+
	'|\\$url\\.?(?:host|path|scheme)?'+
	'|\\$origin\\.?(?:host|path|scheme|tag)?'+
	')';
gKablTokens['field_type_val']=
	'(?:other|script|image|stylesheet|object|document|subdocument|refresh)';

// types
gKablTokens['bool']='(?:true|false)';
gKablTokens['number']='-?\\d+(?:\\.\\d+)?';
gKablTokens['string']='(?:\'.*\'|".*")';

// operators
gKablTokens['field_op']='(?:==|!=|=~|!~|\\^=|\\$=)';
gKablTokens['inieq']='=';

// etc
gKablTokens['comment']='^#.*';
gKablTokens['whitespace']='[ \t\\n\\r]'

var gKablIdxTokMap=[];
for (key in gKablTokens) {
	gKablIdxTokMap[gKablIdxTokMap.length]=key;
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function KablToken(type, val, cstart, cend) {
	this.type=type;
	this.val=val;
	this.cstart=cstart;
	this.cend=cend;
}
KablToken.prototype.toString = function() {
	return "{ " + this.type + ", \"" + this.val + "\" }";
}

function KablParseException(start, end, errMsg, token) {
	if (token) {
		errMsg=errMsg.replace('%%', token.val);
	}

	this.start=start;
	this.end=end;
	this.message=errMsg;

	this.toString=function(){ return '[KablParseException '+errMsg+']'; }
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var gKablRulesObj={
	///////////////////////////////// DATA /////////////////////////////////////

	// string rules turn into tokens, stored here
	rulesTok:[],

	// the actual rules data
	threshold:null,
	cutoff:null,
	groups:null,
	injectFunctions:null,

	/////////////////////////////// METHODS ////////////////////////////////////

	expect:function(expectTok, errMsg) {
		var tok=this.rulesTok.shift();

		if (expectTok!=tok.type) {
			throw new KablParseException(tok.cstart, tok.cend, errMsg, tok);
		}

		return tok;
	},

	lex:function(rules) {
		// special case
		if (rules.match(/^\s*$/)) return true;

		// collapse defined tokens into a giant regex
		var tokRegex='', i=0, parens='';
		for (key in gKablTokens) {
			tokRegex+=gKablTokens[key]+parens+'|';
			parens+='()';
			i++;
		}
		tokRegex=tokRegex.substring(0, tokRegex.length-1);
		tokRegex=new RegExp(tokRegex, 'gim');

		// init empty, in case this isn't the first run
		this.rulesTok=[];

		// use the giant regex to tokenize the string
		var prev_lastIndex=0;
		while (true) {
			var match=tokRegex.exec(rules);

			if (null==match) {
				throw new KablParseException(
					prev_lastIndex, tokRegex.lastIndex, 'Syntax error'
				);
			} else if (match.index!=prev_lastIndex) {
				// start of this isn't end of last
				throw new KablParseException(
					prev_lastIndex, match.index, 'Syntax error: illegal character(s)'
				);
			} else {
				var tokIdx=0;
				for (var i=0; i<match.length; i++) {
					if (''==match[i]) tokIdx++;
				}

				var tokType=gKablIdxTokMap[tokIdx];

				switch (tokType) {
				case 'whitespace': case 'comment':
					// ignore
					break;
				case undefined:
					break;
				default:
					this.rulesTok.push(new KablToken(
						tokType, match[0], match.index, tokRegex.lastIndex
					));
				}
			}

			if (tokRegex.lastIndex>=rules.length) {
				// lexed the whole string, no errors thrown, we're done!
				break;
			} else {
				prev_lastIndex=tokRegex.lastIndex;
			}
		}

	},

	parse:function(rules) {
		// this giant try lets us more cleanly terminate parsing at any point
		// by throwing a custom exception, even from subroutines
		try {
			this.lex(rules);

			// init default values
			this.threshold=10;
			this.cutoff=Number.MAX_VALUE;
			this.groups=[];
			this.injectFunctions=[];

			function defaultGroup() {
				this.score=1;
				this.match='any';
				this.rules=[];
			};

			// State:
			// 00 - started
			// 10 - in settings section
			// 20 - in group section
			// 30 - in inject section
			var tok=null, tok2=null, state=0, group=null;

			// parse the rules, by examining the tokens in order
			while (this.rulesTok.length>0) {
				tok=this.rulesTok.shift();

				switch (tok.type) {
				////////////////////////////////////////////////////////////////
				case 'settings':
					state=10;
					break;
				case 'settings_cmd':
					if (10!=state) {
						throw new KablParseException(
							tok.cstart, tok.cend,
							'Unexpected '+tok.type+' outside of [Settings] section'
						);
					}

					switch (tok.val) {
					case 'threshold': case 'cutoff':
						this.expect('inieq', 'Unexpected "%%" expected: "="');
						tok2=this.expect('number', 'Unexpected "%%" expected: number');
						this[tok.val]=parseFloat(tok2.val);
						break;
					}
					break;
				////////////////////////////////////////////////////////////////
				case 'inject':
					state=30;
					break;
				case 'inject_cmd':
					if (30!=state) {
						throw new KablParseException(
							tok.cstart, tok.cend,
							'Unexpected '+tok.type+' outside of [Inject] section'
						);
					}

					switch (tok.val) {
					case 'function':
						this.expect('inieq', 'Unexpected "%%" expected: "="');
						tok2=this.expect('string', 'Unexpected "%%" expected: string');
						this.injectFunctions.push(
							// strip off the quote marks
							tok2.val.substr(0, tok2.val.length-1).substr(1)
						);
						break;
					}
					break;
				////////////////////////////////////////////////////////////////
				case 'group':
					state=20;
					if (group) this.groups.push(group);
					group=new defaultGroup;
					break;
				case 'group_cmd':
					if (20!=state) {
						throw new KablParseException(
							tok.cstart, tok.cend,
							'Unexpected "%%" outside of [Group] section', tok
						);
					}

					switch (tok.val) {
					case 'match':
						this.expect('inieq', 'Unexpected "%%" expected: "="');
						tok2=this.expect('group_match_val', 'Unexpected "%%" expected: "any", "all"');
						group.match=tok2.val;
						break;
					case 'score':
						this.expect('inieq', 'Unexpected "%%" expected: "="');
						tok2=this.expect('number', 'Unexpected "%%" expected: number');
						group.score=parseFloat(tok2.val);
						break;
					case 'rule':
						this.expect('inieq', 'Unexpected "%%" expected: "="');
						group.rules.push(this.parseRule());
						break;
					}
					break;
				////////////////////////////////////////////////////////////////
				default:
					throw new KablParseException(
						tok.cstart, tok.cend,
						'Unexpected "%%"', tok
					);
				}
			}
		} catch (e if e instanceof KablParseException) {
			return [e.start, e.end, e.message];
		}

		// if the last parsed section was a group with rules, add it
		if (group && group.rules.length) this.groups.push(group);

		return true;
	},

	parseRule:function() {
		var fieldTok=this.expect('field', 'Unexpected "%%" expected: field');
		var opTok=this.expect('field_op', 'Unexpected "%%" expected: field operator');

		var valTok=null, val=null;

		switch (true) {
		case '$thirdParty'==fieldTok.val:
			valTok=this.expect('bool', 'Unexpected "%%" expected: true, false');
			val=new Boolean(valTok.val); //ensure type
			break;
		case '$type'==fieldTok.val:
			valTok=this.expect('field_type_val', 'Unexpected "%%" expected: type');
			// ensure type
			val=Components.interfaces.nsIContentPolicy[
				'TYPE_'+valTok.val.toUpperCase()
			];
			break;
		case '$origin'==fieldTok.val.substring(0, 7):
		case '$url'==fieldTok.val.substring(0, 4):
			valTok=this.expect('string', 'Unexpected "%%" expected: string');
			val=valTok.val.toLowerCase(); // ensure type, case insensitivity
			val=val.substr(0, val.length-1).substr(1); // strip off the quote marks
			break;
		default:
			throw new KablParseException(
				field.cstart, field.cend,
				'Unexpected "%%", expected: field', field
			);
		}

		if (val) {
			return {
				field: fieldTok.val,
				op:    opTok.val,
				val:   val
			};
		} else {
			return null;
		}
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// set up initial parsed rules object
gKablRulesObj.parse(gKablRules);
