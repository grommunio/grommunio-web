Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.KQLParser
 * @singleton
 * @extends Object
 */
Zarafa.advancesearch.KQLParser = Ext.extend(Object, {
	lexer: null,

	/**
	 * Creates a tokenizer with rules to split strings into KQL tokens.
	 * The tokenizer is an instance of Tokenizr.
	 * See {@link https://github.com/rse/tokenizr}
	 * @return {Tokenizr} The tokenizer
	 */
	getLexer : function() {
		if ( this.lexer ) {
			return this.lexer;
		}

		// eslint-disable-next-line no-undef
		this.lexer = new Tokenizr();

		var keys = [
			'body',
			'attachment',
			'subject',
			'sender',
			'to',
			'cc',
			'bcc',
			'category'
		];
		var ops = [':', '=', '<>'];
		var boolOps = ['AND', 'OR', 'NOT'];

		var keyword = false;
		var operator = false;
		this.lexer.before(function(ctx, match, rule) {
			switch (rule.name) {
				case 'phrase':
				case 'word':
					if ( keyword === false ) {
						if ( boolOps.indexOf(match[1]) > -1 ) {
							ctx.accept('operator', {op: match[1]});
						} else {
							ctx.accept(rule.name, match[1]);
						}
					} else {
						// We found an expression
						ctx.accept('expression', {key: keyword, op: operator, val: match[1]});
						keyword = false;
						operator = false;
					}
					break;
				default:
					if ( keyword ) {
						ctx.accept('word', keyword);
						keyword = false;
						operator = false;
					}
			}
		});

		this.lexer.rule(/\(/, function(ctx, match) {
			ctx.accept('parenthesis', 'open');
			ctx.push('parens');
		}, 'parens');
		this.lexer.rule('parens', /\)/, function(ctx, match) {
			ctx.accept('parenthesis', 'close');
			ctx.pop();
		}, 'parensclose');
		this.lexer.rule(new RegExp('(' + keys.join('|') + ')(' + ops.join('|') + ')', 'i'), function(ctx, match) {
			ctx.ignore();
			keyword = match[1].toLowerCase();
			operator = match[2];
		}, 'keyword');
		this.lexer.rule(/"(.*?)"/, function(ctx, match) {
			ctx.ignore();
		}, 'phrase');
		this.lexer.rule(this.getWordRuleRegExp(), function(ctx, match) {
			ctx.ignore();
		}, 'word');
		this.lexer.rule(/[ \t\r\n]+/, function(ctx, match) {
			ctx.ignore();
		}, 'whitespace');
		// Ignore anything else
		this.lexer.rule(/./, function(ctx, match) {
			ctx.ignore();
		});

		return this.lexer;
	},

	/**
	 * Builds the Regular Expression that will be used by the lexer to find 'words'.
	 * It supports unicode characters, like letters with umlauts.
	 * @suppress {checkRegExp|suspiciousCode}
	 *
	 * @return {RegExp} A regular expression object
	 */
	getWordRuleRegExp : function() {
		// Test if we can use unicode regexps. (IE11 does not support it)
		// Otherwise we will match anything up till white space
		if ( typeof (/bla/).unicode === 'boolean' ) {
			var flags = 'iu';
			// Not all browsers that support unicode also support the \p{L} syntax,
			// so we will test for that too.
			try {
				// The following lines might look strange, but they written like this to
				// trick the closure compiler, because we can't seem to surpress the
				// checkRegExp and suspiousCode warnings.
				var f = 'ui';
				f = f.substr(0,1);
				var re = new RegExp('\\p{L}', f);
				re = '((?:\\p{L}|[a-z0-9_\\/@.!#$%&\'*+-=?^`{|}~])+)';
			} catch (e) {
				// The browser supports unicode, but not the shorthand syntax, so we must
				// explicitly tell which characters to match.
				// See https://stackoverflow.com/a/37668315 for more information on the following regexp
				re = '([a-z0-9\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC_\\/@.!#$%&\'*+-=?^`{|}~]+)';
			}
		} else {
			re = '([^\t\r\n\s]+)';
			flags = 'i';
		}

		return new RegExp(re, flags);
	},

	/**
	 * Helper function to tokenize a string without explicitly
	 * creating a {@link getLexer lexer}
	 * @param {String} query
	 * @return {Array|Boolean} An array of token objects or false when no KQL tokens were found
	 */
	tokenize : function(query) {
		var lexer = this.getLexer();

		lexer.input(query);

		// Turn off debugging of the tokenizr library
		// Turn it on when needed during development
		lexer.debug(false);

		var tokens = lexer.tokens();

		if ( !this.isKqlQuery(tokens) ) {
			return false;
		}

		return tokens;
	},

	/**
	 * Scans the tokens to see if the tokenized query can be considered a KQL query.
	 * It is regarded as one when an expression or operator is found.
	 *
	 * @param {String|Array} tokens The search query, either tokenized or just a plain string
	 * @return {Boolean} True if the query is a KQL query, false otherwise
	 */
	isKqlQuery: function(tokens) {
		if ( typeof tokens === 'string' ) {
			return Boolean(this.tokenize(tokens));
		}

		if ( !Array.isArray(tokens) ) {
			return false;
		}


		tokens = this.normalize(tokens);

		var expressionOrOperatorFound = tokens.some(function(t) {
			return typeof t === 'object' && (t.type === 'expression' || t.type === 'subquery' || t.type === 'operator');
		});

		return expressionOrOperatorFound;
	},

	/**
	 * Normalize the tokens if necessary
	 * We want something like <expression> <operator> <expression> <operator> etc
	 * but users are allowed to omit the AND between expressions and NOT is a special
	 * operator that needs to be preceded by another operator.
	 * Query parts within parenthesis will be moved into a so-called 'subquery' token
	 *
	 * @param {Object[]} Array of token objects
	 */
	normalize : function(tokens) {
		// make sure we don't change the original tokens
		tokens = JSON.parse(JSON.stringify(tokens));

		var t = [];
		var lastToken = null;
		while (tokens.length) {
			var token = tokens.shift();
			if ( token.type === 'operator' && token.value.op !== 'NOT' ) {
				if ( lastToken && (lastToken.type === 'expression' || lastToken.type === 'subquery') ) {
					// This is fine, add the token
					t.push(token);
				} else {
					// This is wrong. We'll should probably generate an error
					// Another option is to just drop this token. Let's do this
					// for now.
				}
			} else if ( token.type === 'operator' ) { // This is a NOT
				if ( lastToken && (lastToken.type === 'expression' || lastToken.type === 'subquery' || lastToken.type === 'parenthesis') ) {
					// An expression followed by a negated expression is regarded as joined
					// by an 'AND', so first push that
					t.push({type:'operator', value: {op: 'AND'}});
				}
				// We have a NOT, so we need an expression next and no NOT before this.
				if ( tokens.length && (tokens[0].type === 'operator' && tokens[0].value.op === 'NOT' ) ) {
					// Drop this NOT and the next one
					t.pop();
					tokens.shift();
				} else if ( tokens.length && (tokens[0].type === 'expression' || tokens[0].type === 'subquery' || (tokens[0].type === 'parenthesis' && tokens[0].value === 'open')) ) {
					tokens[0].negate = true;
				}
			} else if ( (token.type === 'expression' || token.type === 'subquery') ) {
				if ( lastToken && (lastToken.type === 'expression' || lastToken.type === 'subquery') ) {
					// An expression or subquery followed by an expression or subquery is
					// regarded as joined by an 'AND', so first push that
					t.push({type:'operator', value: {op: 'AND'}});
				}
				t.push(token);
			} else if ( token.type ==='parenthesis' && token.value === 'open' ) {
				// Find all tokens up till the closing parenthesis
				var subqueryTokens = [];
				var parensOpenCount = 1;
				while ( tokens.length && !(tokens[0].type === 'parenthesis' && tokens[0].value === 'close' && parensOpenCount === 1) ) {
					var tmpToken = tokens.shift();
					if ( tmpToken.type === 'parenthesis' && tmpToken.value === 'open' ) {
						parensOpenCount++;
					}
					if ( tmpToken.type === 'parenthesis' && tmpToken.value === 'close' ) {
						parensOpenCount--;
					}
					subqueryTokens.push(tmpToken);
				}
				if ( subqueryTokens.length === 0 || subqueryTokens[subqueryTokens.length -1].type === 'EOF') {
					// Something is wrong with the query! There is nothing in the parentheses or
					// we couldn't find the closing parenthesis. Let's just drop the subquery for now.
					// TODO: Show a message

				} else {
					// Create a subquery, but only if our subquery tokens contain more than one token.
					// Otherwise we can just drop the parenthesis
					subqueryTokens = this.normalize(subqueryTokens);
					if ( subqueryTokens.length > 1 ) {
						t.push({
							type: 'subquery',
							value: this.normalize(subqueryTokens),
							negate: token.negate
						});
					} else if (subqueryTokens.length === 1 ) {
						t.push(subqueryTokens[0]);
					}
				}
			}

			lastToken = t.length ? t[t.length - 1] : null;
		}

		// We can't end with an operator
		while ( t.length && t[t.length-1].type === 'operator' ) {
			t.pop();
		}

		return t;
	},

	/**
	 * Will process the tokens and move AND parts into subqueries.
	 * We now have tokens like <expression> OR <subquery> AND <expression>
	 * Since the AND takes presendence over OR we will move the AND with
	 * its expressions into a subquery so we will only have something like
	 * <expression> OR <subquery> OR <subquery>
	 * 					or
	 * <expression> AND <subquery> AND <subquery>
	 * (so only with the same operator)
	 * @param {Object[]} tokens Array of token objects
	 * @return {Object[]} Array of token objects
	 */
	flatten: function(tokens) {
		var pos = 0;
		var lastOperator;
		var lastOperatorPos;
		while ( pos < tokens.length ) {
			var token = tokens[pos];
			if ( token.type === 'subquery' ) {
				token.value = this.flatten(token.value);
			}
			if ( token.type === 'operator' && (token.value.op === 'AND' || token.value.op === 'OR') ) {
				if ( lastOperator && lastOperator !== token.value.op ) {
					// We must create a subquery
					if ( lastOperator === 'AND' ) {
						var subqueryTokens = tokens.splice(lastOperatorPos-1, pos+1);
						tokens.splice(lastOperatorPos-1, 0, {
							type: 'subquery',
							value: subqueryTokens
						});
						pos = pos - subqueryTokens.length + 1;
					} else {
						subqueryTokens = [];
						// eslint-disable-next-line max-depth
						while ( tokens[pos-1] && (!tokens[pos] || !(tokens[pos].type === 'operator' && tokens[pos].value === 'OR')) ) {
							subqueryTokens = subqueryTokens.concat(tokens.splice(pos-1, 1));
						}
						tokens.splice(pos-1, 0, {
							type: 'subquery',
							value: subqueryTokens
						});
						pos--;
					}
				} else {
					lastOperator = token.value.op;
					lastOperatorPos = pos;
				}
			}
			pos++;
		}

		return tokens;
	},

	/**
	 * Creates a restriction from a set of tokens
	 *
	 * @param {Array} tokens An array of token objects
	 * @return {Array} A Restriction array
	 */
	createTokenRestriction : function(tokens) {
		tokens = this.flatten(this.normalize(tokens));

		var propMap = {
			subject: ['subject'],
			body: ['body'],
			sender: ['sender_name', 'sender_email_address'],
			to: [{type:'recipient', recipientType: Zarafa.core.mapi.RecipientType.MAPI_TO}],
			cc: [{type:'recipient', recipientType: Zarafa.core.mapi.RecipientType.MAPI_CC}],
			bcc: [{type:'recipient', recipientType: Zarafa.core.mapi.RecipientType.MAPI_BCC}],
			category: ['categories'],
			attachment: [{type: 'attachment'}]
		};
		var res = [];

		// find the operator used in the restriction
		var op = tokens.filter(function(t) {
			return t.type === 'operator';
		});
		if ( op.length ) {
			op = op[0].value.op;
		} else {
			op = false;
		}

		tokens.forEach(function(token) {
			var curRes = [];
			if ( token.type === 'expression' ) {
				if ( !propMap[token.value.key] ) {
					return;
				}
				propMap[token.value.key].forEach(function(prop) {
					if ( typeof prop === 'string' ) {
						var r =	this.createStringRestriction(prop, token.value.val);
					} else if ( typeof prop === 'object' && prop.type === 'recipient' ) {
						r = this.createRecipientRestriction(prop.recipientType, token.value.val);
					} else if ( typeof prop === 'object' && prop.type === 'attachment' ) {
						r = this.createAttachmentRestriction(token.value.val);
					}

					curRes.push(r);
				}, this);
			} else if ( token.type === 'subquery' ) {
				curRes.push(this.createTokenRestriction(token.value));
			}

			if ( curRes.length > 1 ) {
				curRes = Zarafa.core.data.RestrictionFactory.createResOr(curRes);
			} else if ( curRes.length === 1 ) {
				curRes = curRes[0];
			}

			if ( curRes.length ) {
				if ( token.negate ) {
					curRes = Zarafa.core.data.RestrictionFactory.createResNot(curRes);
				}

				res.push(curRes);
			}
		}, this);

		if ( op === 'OR' ) {
			res = Zarafa.core.data.RestrictionFactory.createResOr(res);
		} else {
			res = Zarafa.core.data.RestrictionFactory.createResAnd(res);
		}

		return res;
	},

	/**
	 * Creates a text restriction on the given property
	 *
	 * @param {String} prop The property to set the restriction on
	 * @param {String} value The value the restriction will search for
	 * @return {Array} A Restriction array
	 */
	createStringRestriction : function(prop, value) {
		return Zarafa.core.data.RestrictionFactory.dataResContent(
			prop,
			Zarafa.core.mapi.Restrictions.FL_SUBSTRING | Zarafa.core.mapi.Restrictions.FL_IGNORECASE,
			value
		);
	},

	/**
	 * Creates a restriction on a recipient type
	 *
	 * @param {Number} recipientType The {@link Zarafa.core.mapi.RecipientType RecipientType}
	 * to put the restriction on
	 * @param {String} value The value the restriction will search for
	 * @return {Array} A Restriction array
	 */
	createRecipientRestriction : function(recipientType, value) {
		return Zarafa.core.data.RestrictionFactory.createResSubRestriction('PR_MESSAGE_RECIPIENTS',
			Zarafa.core.data.RestrictionFactory.createResAnd([
				Zarafa.core.data.RestrictionFactory.dataResProperty('PR_RECIPIENT_TYPE',
					Zarafa.core.mapi.Restrictions.RELOP_EQ,
					recipientType
				),
				Zarafa.core.data.RestrictionFactory.createResOr([
					this.createStringRestriction('PR_DISPLAY_NAME', value),
					this.createStringRestriction('PR_EMAIL_ADDRESS', value),
					this.createStringRestriction('PR_SMTP_ADDRESS', value)
				])
			])
		);
	},

	/**
	 * Creates a restriction on a attachment name
	 *
	 * @param {String} value The value the restriction will search for
	 * @return {Array} A Restriction array
	 */
	createAttachmentRestriction : function(value) {
		return Zarafa.core.data.RestrictionFactory.createResSubRestriction('PR_MESSAGE_ATTACHMENTS',
			this.createStringRestriction('PR_ATTACH_LONG_FILENAME', value)
		);
	}

});

Zarafa.advancesearch.KQLParser = new Zarafa.advancesearch.KQLParser();
