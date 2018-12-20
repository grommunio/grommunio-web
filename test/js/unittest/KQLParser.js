describe('KQLParser', function() {
	describe('tokenize', function() {
		it('should not tokenize a simple word', function() {
			var tokens = Zarafa.advancesearch.KQLParser.tokenize('test');
			expect(tokens).toBe(false);
		});

		it('should correctly tokenize a simple subject expression', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('subject=test');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize a simple sender expression', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'sender',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('sender=test');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize a simple sender expression with an email address', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'sender',
						op: '=',
						val: 'hank.bla_bla@subdomain.test.com',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('sender=hank.bla_bla@subdomain.test.com');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize a simple body expression', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'body',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('body=test');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize a simple to expression', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'to',
						op: '=',
						val: 'hank.bla_bla@subdomain.test.com',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('to=hank.bla_bla@subdomain.test.com');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize a simple cc expression', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'cc',
						op: '=',
						val: 'hank.bla_bla@subdomain.test.com',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('cc=hank.bla_bla@subdomain.test.com');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize a simple bcc expression', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'bcc',
						op: '=',
						val: 'hank.bla_bla@subdomain.test.com',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('bcc=hank.bla_bla@subdomain.test.com');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize a simple category expression', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'category',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('category=test');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize AND\'ed expressions', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'sender',
						op: '=',
						val: 'someone',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('subject=test AND sender=someone');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize OR\'ed expressions', function() {
			var expectedTokens = [
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'OR',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'sender',
						op: '=',
						val: 'someone',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('subject=test OR sender=someone');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize negated expressions', function() {
			var expectedTokens = [
				{
					type: 'operator',
					value: {
						op: 'NOT',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('NOT subject=test');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize parenthesis', function() {
			var expectedTokens = [
				{
					type: 'parenthesis',
					value: 'open',
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'OR',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'bla',
					},
				},
				{
					type: 'parenthesis',
					value: 'close',
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'sender',
						op: '=',
						val: 'hank',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('(subject=test OR subject=bla) AND sender=hank');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly tokenize nested parenthesis', function() {
			var expectedTokens = [
				{
					type: 'parenthesis',
					value: 'open',
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'OR',
					},
				},
				{
					type: 'parenthesis',
					value: 'open',
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'bla',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'foo',
					},
				},
				{
					type: 'parenthesis',
					value: 'close',
				},
				{
					type: 'parenthesis',
					value: 'close',
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'sender',
						op: '=',
						val: 'hank',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('(subject=test OR (subject=bla AND subject=foo)) AND sender=hank');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should drop close parenthesis when not opened', function() {
			var expectedTokens = [
				{
					type: 'parenthesis',
					value: 'open',
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'OR',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'bla',
					},
				},
				{
					type: 'parenthesis',
					value: 'close',
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'sender',
						op: '=',
						val: 'hank',
					},
				},
				{
					type: 'EOF',
				},
			];

			var tokens = Zarafa.advancesearch.KQLParser.tokenize('(subject=test OR subject=bla)) AND sender=hank');
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});
	});

	describe('isKqlQuery', function() {
		it('should recognize a simple query as not being a KQL query', function() {
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('test')).toBe(false);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('something=test')).toBe(false);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('something=test and somethingelse=foo')).toBe(false);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('"something=test"')).toBe(false);
		});

		it('should recognize a query with an expression as a KQL query', function() {
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('subject=test')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('body=test')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('attachment=test')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('sender=test')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('to=test')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('cc=test')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('bcc=test')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('category=test')).toBe(true);
		});

		// These tests will fail until the processing of words and phrases has been implemented
		xit('should recognize a query with an operator as a KQL query', function() {
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('test OR foo')).toBe(true);
			expect(Zarafa.advancesearch.KQLParser.isKqlQuery('NOT test')).toBe(true);
		});
	});

	describe('normalize', function() {
		it('should correctly process OR operators', function() {
			var inputTokens = [
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'OR',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'bla',
					},
				},
			];

			var expectedTokens = [...inputTokens];
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should correctly process AND operators', function() {
			var inputTokens = [
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'bla',
					},
				},
			];

			var expectedTokens = [...inputTokens];
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should drop incorrect OR and AND operators', function() {
			var inputTokens = [
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'bla',
					},
				},
			];

			var expectedTokens = [...inputTokens];
			expectedTokens.splice(1, 1);
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});

			inputTokens = [
				{
					type: 'operator',
					value: {
						op: 'OR',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'test',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'AND',
					},
				},
				{
					type: 'expression',
					value: {
						key: 'subject',
						op: '=',
						val: 'bla',
					},
				},
				{
					type: 'operator',
					value: {
						op: 'OR',
					},
				},
			];

			expectedTokens = [...inputTokens];
			expectedTokens.splice(5, 1);
			expectedTokens.splice(3, 1);
			expectedTokens.splice(0, 1);
			tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should add an AND when expressions or subqueries are joined without an operator', function() {
			var inputTokens = [
				{type: 'expression'},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'expression'},
				{type: 'subquery'},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'subquery'},
			];

			var expectedTokens = [...inputTokens];
			// Remember that the NOT will be moved as negate property into the following expression/subquery
			expectedTokens.splice(1, 1, {type: 'operator', value: {op: 'AND'}});
			expectedTokens.splice(3, 0, {type: 'operator', value: {op: 'AND'}});
			expectedTokens.splice(5, 1, {type: 'operator', value: {op: 'AND'}});
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should only process NOT when followed by an expression or subquery', function() {
			var inputTokens = [
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'expression'},
			];

			var expectedTokens = [...inputTokens];
			// Remember that the NOT will be moved as negate property into the following expression/subquery
			expectedTokens.splice(0, 1);
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
			expect(tokens[0].negate).toBe(true);

			inputTokens = [
				{type: 'expression'},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'operator',	value: {op: 'AND'}},
				{type: 'expression'},
			];

			var expectedTokens = [...inputTokens];
			expectedTokens.splice(1, 1);
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
		});

		it('should remove double NOT\'s', function() {
			var inputTokens = [
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'expression'},
			];

			var expectedTokens = [...inputTokens];
			expectedTokens.splice(0, 2);
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
			expect(tokens[0].negate).toBeFalsy();

			inputTokens = [
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'expression'},
			];

			expectedTokens = [...inputTokens];
			expectedTokens.splice(0, 3);
			tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);

			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
			expect(tokens[0].negate).toBe(true);

		});

		it('should move parenthesised tokens into a subquery', function() {
			var inputTokens = [
				{type: 'parenthesis',	value: 'open'},
				{type: 'expression'},
				{type: 'operator',	value: {op: 'OR'}},
				{type: 'expression'},
				{type: 'parenthesis',	value: 'close'},
				{type: 'operator',	value: {op: 'AND'}},
				{type: 'expression'},
			];

			var expectedTokens = [...inputTokens];
			var expectedSubQueryTokens = expectedTokens.splice(0, 5, {type: 'subquery'});
			expectedSubQueryTokens.pop(); // Remove closing parenthesis
			expectedSubQueryTokens.shift(); // Remove opening parenthesis
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);
			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});

			// Now test if the subquery contains the correct tokens
			var subQueryTokens = tokens[0].value;
			expect(Array.isArray(subQueryTokens)).toBe(true);
			expect(subQueryTokens.length).toBe(expectedSubQueryTokens.length);
			subQueryTokens.forEach(function(expectedSubQueryToken, i) {
				for (let key in expectedSubQueryTokens) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedSubQueryToken[key]));
				}
			});
		});

		it('should be able to handle negated parenthesised tokens', function() {
			var inputTokens = [
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'parenthesis',	value: 'open'},
				{type: 'expression'},
				{type: 'operator',	value: {op: 'OR'}},
				{type: 'expression'},
				{type: 'parenthesis',	value: 'close'},
			];

			var expectedTokens = [...inputTokens];
			var expectedSubQueryTokens = expectedTokens.splice(0, 6, {type: 'subquery', negate: true});
			expectedSubQueryTokens.pop(); // Remove closing parenthesis
			expectedSubQueryTokens.shift(); // Remove NOT operator
			expectedSubQueryTokens.shift(); // Remove opening parenthesis
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);
			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});

			// Now test if the subquery contains the correct tokens
			var subQueryTokens = tokens[0].value;
			console.log(JSON.stringify(subQueryTokens));
			console.log(JSON.stringify(expectedSubQueryTokens));
			expect(Array.isArray(subQueryTokens)).toBe(true);
			expect(subQueryTokens.length).toBe(expectedSubQueryTokens.length);
			expectedSubQueryTokens.forEach(function(expectedSubQueryToken, i) {
				for (let key in expectedSubQueryToken) {
					expect(JSON.stringify(subQueryTokens[i][key])).toBe(JSON.stringify(expectedSubQueryToken[key]));
				}
			});
		});

		it('should move nested parenthesised tokens into nested subqueries', function() {
			var inputTokens = [
				{type: 'parenthesis',	value: 'open'},
				{type: 'parenthesis',	value: 'open'},
				{type: 'expression'},
				{type: 'operator',	value: {op: 'AND'}},
				{type: 'expression'},
				{type: 'parenthesis',	value: 'close'},
				{type: 'operator',	value: {op: 'OR'}},
				{type: 'expression'},
				{type: 'parenthesis',	value: 'close'},
				{type: 'operator',	value: {op: 'AND'}},
				{type: 'expression'},
			];

			var expectedTokens = [...inputTokens];
			var expectedSubQueryTokens = expectedTokens.splice(0, 9, {type: 'subquery'});
			expectedSubQueryTokens.pop(); // Remove closing parenthesis
			expectedSubQueryTokens.shift(); // Remove opening parenthesis
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);
			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});

			// Now test if the subquery contains the correct tokens
			var subQueryTokens = tokens[0].value;
			var expectedSubQuerySubQueryTokens = expectedSubQueryTokens.splice(0, 5, {type: 'subquery'});
			expectedSubQuerySubQueryTokens.pop(); // Remove closing parenthesis
			expectedSubQuerySubQueryTokens.shift(); // Remove opening parenthesis
			expect(Array.isArray(subQueryTokens)).toBe(true);
			expect(subQueryTokens.length).toBe(expectedSubQueryTokens.length);
			expectedSubQueryTokens.forEach(function(expectedSubQueryToken, i) {
				for (let key in expectedSubQueryTokens) {
					expect(JSON.stringify(subQueryTokens[i][key])).toBe(JSON.stringify(expectedSubQueryToken[key]));
				}
			});

			// Now test if the nested subquery contains the correct tokens
			var subQuerySubQueryTokens = subQueryTokens[0].value;
			expect(Array.isArray(subQuerySubQueryTokens)).toBe(true);
			expect(subQuerySubQueryTokens.length).toBe(expectedSubQuerySubQueryTokens.length);
			expectedSubQuerySubQueryTokens.forEach(function(expectedSubQuerySubQueryToken, i) {
				for (let key in expectedSubQuerySubQueryTokens) {
					expect(JSON.stringify(subQuerySubQueryTokens[i][key])).toBe(JSON.stringify(expectedSubQuerySubQueryToken[key]));
				}
			});
		});

		it('should remove operators at the begin or end', function() {
			var inputTokens = [
				{type: 'operator',	value: {op: 'OR'}},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'operator',	value: {op: 'OR'}},
				{type: 'expression'},
				{type: 'operator',	value: {op: 'AND'}},
				{type: 'expression'},
				{type: 'operator',	value: {op: 'AND'}},
				{type: 'operator',	value: {op: 'NOT'}},
				{type: 'operator',	value: {op: 'AND'}},
			];

			var expectedTokens = [...inputTokens];
			expectedTokens.shift();
			expectedTokens.shift();
			expectedTokens.shift();
			expectedTokens.pop();
			expectedTokens.pop();
			expectedTokens.pop();
			var tokens = Zarafa.advancesearch.KQLParser.normalize(inputTokens);
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBe(expectedTokens.length);
			expectedTokens.forEach(function(expectedToken, i) {
				for (let key in expectedToken) {
					expect(JSON.stringify(tokens[i][key])).toBe(JSON.stringify(expectedToken[key]));
				}
			});
			expect(tokens[0].negate).toBeUndefined();
		});

		console.log(JSON.stringify(Zarafa.advancesearch.KQLParser.normalize(Zarafa.advancesearch.KQLParser.tokenize('to=henk AND NOT (to=tous)'))))
	});
});
