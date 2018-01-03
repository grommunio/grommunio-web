/*
 * Test the Canvas Context
 */
describe('Canvas', function() {
	var canvas;
	var context;

	beforeAll(function() {
		canvas = Ext.getBody().createChild({
			tag : 'canvas'
		});

		context = canvas.dom.getContext('2d');
		context.font  = '8pt Arial';
	});

	afterAll(function() {
		canvas.remove();
	});

	/*
	 * Test if various shapes can be drawn using the utility functions
	 * which are provided by Kopano WebApp. We can't really test if they
	 * work, so we can only test if no JS error occurs...
	 */
	describe('Define Shapes', function() {

		it('can define a circle without errors', function() {
			const doAction = function() {
				context.circle(10, 10, 50);
			};

			expect(doAction).not.toThrow();
		});

		it('can draw a straight line', function() {
			const doAction = function() {
				context.strokeLine(10, 10, 200, 200);
			};

			expect(doAction).not.toThrow();
		});
	});

	/*
	 * Test if calculations of the text height are working.
	 */
	describe('Text Height', function() {
		const words = [];
		const prefix = [
			'From',
			'Go to',
			'See you at',
			'We will meet at',
			'Have you been to'
		];
		const places = [
			'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
			'Taumatawhakatangihangakoauauotamateapokaiwhenuakitanatahu',
			'Chargoggagoggmanchauggagoggchaubunagungamaugg',
			'Tweebuffelsmeteenskootmorsdoodgeskietfontein',
			'Ateritsiputeritsipuolilautatsijanka',
			'Pekwachnamaykoskwaskwaypinwanik',
			'Venkatanarasimharajuvaripeta',
			'Bovenendvankeelafsnysleegte',
			'Mamungkukumpurangkuntjunya',
			'Bullaunancheathrairaluinn',
			'Gasselterboerveenschemond',
			'Onafhankelijkheidsplein',
			'Kuchistiniwamiskahikan',
			'Parangaricutirimicuaro',
			'Drehideenglashanatooha',
			'Siemieniakowszczyzna',
			'Vanhankaupunginselka',
			'Newtownmountkennedy',
			'Cottonshopeburnfoot',
			'Nyugotszenterzsebet',
			'Thiruvananthapuram'
		];

		// Generate some sentences which ensure we obtain some
		// varying lengths and should cover quite a different
		// number of cases.
		for (var i = 0; i < prefix.length; i++) {
			for (var j = 0; j < places.length; j++) {
				words.push(prefix[i] + ' ' + places[j]);
			}
		}

		// We want to test all generated sentences for a particular number
		// of available widths of the canvas.
		const sizes = [ 150, 200, 250 ];

		// We want to test all generated sentences also in combination
		// with a particular x- or y-offset. This might bring up
		// differences between textHeight and drawWrappedText as both
		// receive the margins differently.
		const margins = [ 0, 10 ];
		const lineHeight = 12;

		// Generate all unittests
		for (var s = 0; s < sizes.length; s++) {
			for (var x = 0; x < margins.length; x++) {
				for (var y = 0; y < margins.length; y++) {
					for (var w = 0; w < words.length; w++) {
						// Generate the scope object
						var scope = {
							word : words[w],
							width : sizes[s],
							height : sizes[s],
							xoffset : margins[x],
							yoffset : margins[y]
						};

						// Generate the description for our test
						var description = '\'' + words[w] + '\'';
						description += ' with x-offset ' + margins[x];
						description += ' with y-offset ' + margins[y];
						description += ' for width ' + sizes[s];

						it('can correctly calculate the height of the text ' + description, function() {
							const width = this.width - (2 * this.xoffset);
							const height = this.height - (2 * this.yoffset);

							const h1 = context.textHeight(this.word, width, lineHeight);
							const h2 = context.drawWrappedText(this.word, this.xoffset, this.yoffset, width, lineHeight, height);

							// We demand that at least lines was filled,
							// there is no toBeGreaterOrEqualThat function,
							// hence the reverasl of toBeLessThat.
							expect(h1).not.toBeLessThan(lineHeight);

							// Ensure that textHeight and drawWrappedText
							// always return the same value.
							expect(h1).toEqual(h2);
						}.createDelegate(scope));
					}
				}
			}
		}
	});

	/*
	 * Test if calculations of the text height for multi-line sentences are working.
	 */
	describe('Multi-line Text Height', function() {
		const words = [
			'Do you want some coffee\nNo thanks',
			'Have you found a bug in the WebApp\nYes, I found an annoying bug'
		];

		// Generate all unittests
		for (const word of words) {
			it('can correctly calculate the height of the text ' + "'" + word + "'", function() {
				const lineHeight = 12;
				const h1 = context.textHeight(word, 250, lineHeight);
				const h2 = context.drawWrappedText(word, 0, 0, 250, lineHeight, 250);

				// We demand that at least 2 lines were filled,
				// there is no toBeGreaterOrEqualThat function,
				// hence the reverasl of toBeLessThat.
				expect(h1).not.toBeLessThan(2 * lineHeight);

				// Ensure that textHeight and drawWrappedText
				// always return the same value.
				expect(h1).toEqual(h2);
			});
		}
	});
});
