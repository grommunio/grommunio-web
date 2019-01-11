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
		// Test if we can use unicode regexps. (IE11 does not support it)
		// Otherwise we will match anything up till white space
		if ( typeof (/bla/).multiline === 'boolean' ) {
			var re = '((?:\\p{L}|[a-z0-9_\\/@.!#$%&\'*+-=?^`{|}~])+)';
			var flags = 'iu';
		} else {
			re = '([^\t\r\n\s]+)';
			flags = 'i';
		}
		this.lexer.rule(new RegExp(re, flags), function(ctx, match) {
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

		tokens = this.normalize([...tokens]);

		var expressionOrOperatorFound = tokens.some(function(t) {
			return typeof t === 'object' && (t.type === 'expression' || t.type === 'operator');
		});

		return expressionOrOperatorFound;
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
	 * Normalize the tokens if necessary
	 * We want something like <expression> <operator> <expression> <operator> etc
	 * but users are allowed to omit the AND between expressions and NOT is a special
	 * operator that needs to be preceded by another operator.
	 * Query parts within parenthesis will be moved into a so-called 'subquery' token
	 *
	 * @param {Object[]} Array of token objects
	 */
	normalize : function(tokens) {
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
				if ( subqueryTokens[subqueryTokens.length -1].type === 'EOF') {
					// Something is wrong with the query! We couldn't find the closing parenthesis.
					// Let's just drop the subquery for now.
					// TODO: Show a message

				} else {
					// Create a subquery
					t.push({
						type: 'subquery',
						value: this.normalize(subqueryTokens),
						negate: token.negate
					});
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

//AND subject=bla AND sender:jan AND cc:r.toussaint OR rtoussaint ronald
//subject=bla OR (sender=fabian AND subject=test)
//subject=bla OR (subject=test AND (sender=jan OR sender=fabian))
//(sender=fabian OR sender=jan) AND subject=bla
//(NOT sender=fabian OR sender=jan) AND subject=bla
//to=user1@localhost OR to:user2@localhost
//to=andreas AND to=userdsfsda
