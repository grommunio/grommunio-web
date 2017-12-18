describe('ColorSchemes', function() {

	describe('rgb/hex/hsl functions', function() {
		const rgb = {
			red: 0,
			green: 103,
			blue: 172
		};
		const hex = "#0067AC";
		const hsl = [0.5668604651162791, 1, 0.33725490196078434];

		it('can convert hex to rgb', function() {
			expect(Zarafa.core.ColorSchemes.hexToRgb(hex)).toEqual(rgb);
		});

		it('can convert rgb to hex', function() {
			expect(Zarafa.core.ColorSchemes.rgbToHex(rgb)).toBe(hex);
		});

		it('should return the same result when chained', function() {
			expect(Zarafa.core.ColorSchemes.hexToRgb(Zarafa.core.ColorSchemes.rgbToHex(rgb))).toEqual(rgb);
		});

		it('should convert rgb to hsl', function() {
			expect(Zarafa.core.ColorSchemes.rgbToHsl(hex)).toEqual(hsl);
			expect(Zarafa.core.ColorSchemes.rgbToHsl(rgb.red, rgb.green, rgb.blue)).toEqual(hsl);
		});
	});

	describe('colorscheme', function() {
		const name = "kopanoblue";
		const displayName = "Kopano Blue";
		const baseColor = "#0067AC";

		beforeEach(function() {
			Zarafa.core.ColorSchemes.colorSchemes = [];
		});

		it('should return undefined on unknown colorscheme', function() {
			expect(Zarafa.core.ColorSchemes.getColorScheme(name)).toBeUndefined();
		});

		it('should create the color scheme', function() {
			Zarafa.core.ColorSchemes.createColorScheme(name, displayName, baseColor);
			expect(Zarafa.core.ColorSchemes.getColorScheme(name)).not.toBeUndefined();
			expect(Zarafa.core.ColorSchemes.getColorScheme(name).name).toBe(name);

			expect(Zarafa.core.ColorSchemes.getColorSchemes()).not.toBeUndefined();
		});

		it('should add a color scheme', function() {
			Zarafa.core.ColorSchemes.addColorScheme({name: name, displayName: displayName, base: baseColor});
			expect(Zarafa.core.ColorSchemes.getColorScheme(name).name).toBe(name);
		});

		it('should not add an invalid color scheme', function() {
			Zarafa.core.ColorSchemes.addColorScheme({});
			Zarafa.core.ColorSchemes.addColorScheme({name: name, displayName: displayName, baseColor: baseColor});
			Zarafa.core.ColorSchemes.addColorScheme({name: name, displayNam: displayName, base: baseColor});
			Zarafa.core.ColorSchemes.addColorScheme({nam: name, displayName: displayName, base: baseColor});

			expect(Zarafa.core.ColorSchemes.getColorSchemes()).toEqual([]);
		});

		it('should return [] when there are no colorschemes', function() {
			expect(Zarafa.core.ColorSchemes.getColorSchemes()).toEqual([]);
		});
	});
});
