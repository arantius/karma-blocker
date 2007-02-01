var gKablTokens=[];
// settings section
gKablTokens['settings']='\\[Settings\\]';
gKablTokens['settings_cmd']='(?:threshold|cutoff)';

// group section
gKablTokens['group']='\\[Group\\]';
gKablTokens['group_cmd']='(?:match|score|rule)';
gKablTokens['group_val']='(?:all|any)';

// fields
gKablTokens['field']='(?:'+
	'\\$(?:thirdParty|type)'+
	'|\\$url\\.?(?:host|path|scheme)?'+
	'|\\$origin\\.?(?:host|path|scheme|tag)?'+
	')';

// types
gKablTokens['bool']='(?:true|false)';
gKablTokens['num']='-?\\d+(?:\\.\\d+)?';
gKablTokens['string']='(?:\'.*\'|".*")';

// operators
gKablTokens['eq']='==';
gKablTokens['neq']='!=';
gKablTokens['match']='=~';
gKablTokens['nmatch']='!~';
gKablTokens['inieq']='=';

// etc
gKablTokens['comment']='^#.*';
gKablTokens['newline']='\\n';

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

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function gKablParseRules(rules, checkOnly) {
	// collapse tokens into a giant regex
	var tokRegex='', i=0, parens='';
	for (key in gKablTokens) {
		tokRegex+=gKablTokens[key]+parens+'|';
		parens+='()';
		i++;
	}
	tokRegex=tokRegex.substring(0, tokRegex.length-1);
	tokRegex=new RegExp(tokRegex, 'gim');

	// use the giant regex to tokenize the string
	var rulesTok=[], done=false, prev_lastIndex=0;
	while (!done) {
		var match=tokRegex.exec(rules);

		if (null==match) {
			return [prev_lastIndex, tokRegex.lastIndex, 'Syntax error'];
		} else if (match.index!=prev_lastIndex) {
			// start of this isn't end of last
			return [prev_lastIndex, match.index, 'Syntax error: illegal character(s)'];
		} else {
			var tokIdx=0;
			for (var i=0; i<match.length; i++) {
				if (''==match[i]) tokIdx++;
			}

			var tokType=gKablIdxTokMap[tokIdx];

			switch (tokType) {
			case 'newline': case 'comment':
				// ignore
				break;
			case undefined:
				break;
			default:
				rulesTok.push(new KablToken(
					tokType, match[0], match.index, match.lastIndex
				));
			}
		}

		if (tokRegex.lastIndex>=rules.length) {
			done=true;
		} else {
			prev_lastIndex=tokRegex.lastIndex;
		}
	}

	if (checkOnly) {
		return true;
	}

	var rulesObj={};

	return rulesObj;
}
