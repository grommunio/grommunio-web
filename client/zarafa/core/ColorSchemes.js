Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.ColorSchemes
 * @singleton
 * 
 * An object that can be used to handle color schemes.
 * Color schemes are used by {@link Zarafa.core.Context contexts}
 * that can display different folders in one view. Currently only
 * the {@link Zarafa.calendar.CalendarContext calendar context}
 * is such a context.
 * 
 * It has methods to create color schemes based on a single color
 * and to add complete color schemes.
 */
Zarafa.core.ColorSchemes = {
	
	/**
	 * An array with the fields that represent a color available in 
	 * a color scheme. The fields have a name that can be used a key
	 * in a color scheme, and a weight (percentage) that will be used
	 * to create these color based on the base color of a color scheme.
	 * Fields can be added using the function {@link #addField}. When
	 * a field is added, all existing color schemes will also get the
	 * new field.
	 * @property
	 * @type Object[]
	 * @private
	 */
	fields : [
		{
			name : 'base',
			weight : 1
		}
	],
	
	/**
	 * The list of color schemes. Contexts can add color schemes
	 * using the function {@link #createColorScheme} or {@link #addColorScheme}.
	 * @property
	 * @type Object[]
	 * @private
	 */
	colorSchemes : [],
	
	/**
	 * Adds a field to the {@link #fields colorScheme fields}
	 * @param {Object|Array} field An object with properties name (mandatory) and 
	 * weight (the weight of the color as ratio of the base color of the color
	 * scheme) or color (an RGB hex value that will be used as color for this field
	 * (e.g. '#0067AC')), or an array with field objects.
	 */
	addField : function(field)
	{
		var i;
		
		if ( Array.isArray(field) ){
			for ( i=0; i<field.length; i++ ){
				this.addField(field[i]);
			}
			return;
		}
		
		this.fields.push(field);
		
		// Add the color to existing color schemes
		for ( i =0; i<this.colorSchemes.length; i++ ){
			if ( !Ext.isDefined(this.colorSchemes[i][field.name]) ){
				if ( Ext.isDefined(field.color) ){
					this.colorSchemes[i][field.name] = field.color;
				}else if ( Ext.isDefined(field.weight) ){
					this.colorSchemes[i][field.name] = this.createColor(this.colorSchemes[i].base, field.weight);
				}
			}
		}
	},
	
	/**
	 * Converts a hexadecimal RGB color value into an object with
	 * red, green, and blue fields
	 * @param {String} hexColor A hexadecimal RGB color value
	 * (e.g. '#0067AC for Kopano Blue)
	 * @return {Object} An object with decimal red, green, and blue values
	 * @private
	 */
	hexToRgb : function(hexColor)
	{
		return {
			red: parseInt(hexColor.substring(1,3), 16),
			green: parseInt(hexColor.substring(3,5), 16),
			blue: parseInt(hexColor.substring(5,7), 16)
		};
	},
	
	/**
	 * Converts an RGB object into a hexadecimal RGB color value
	 * @param {Object} rgbObj An decimal RGB color object
	 * @return {String} A hexadecimal RGB color value
	 */
	rgbToHex : function(rgbObj)
	{
		// function that will convert a number to a hexadecimal string (between 0 and 255) 
		const _toHex = function(n) {
			n = parseInt(n,10);
			if (isNaN(n)) {
				return "00";
			}
			n = Math.max(0,Math.min(n,255));
			return "0123456789ABCDEF".charAt((n-n%16)/16) + "0123456789ABCDEF".charAt(n%16);
		};
		
		return '#' + _toHex(rgbObj.red)+_toHex(rgbObj.green)+_toHex(rgbObj.blue);
	},
	
	/**
	 * Creates a color for a color scheme based on the baseColor of
	 * that scheme and a weight factor.
	 * @param {String} baseColor A hexadecimal RGB color value
	 * @param {Number} colorWeight A value that defines the new color
	 * as related to the baseColor. Should be between 0 and 1.
	 * @return {String} A hexadecimal RGB color value
	 * @private
	 */
	createDarkColor : function(baseColor, colorWeight)
	{
		var rgbBaseColor = this.hexToRgb(baseColor);
		
		var rgbColor = {
			red : rgbBaseColor.red * colorWeight,
			green : rgbBaseColor.green * colorWeight,
			blue : rgbBaseColor.blue * colorWeight
		};
		
		return this.rgbToHex(rgbColor);
	},
	
	/**
	 * Creates a color for a color scheme based on the baseColor of
	 * that scheme and a weight factor.
	 * @param {String} baseColor A hexadecimal RGB color value
	 * @param {Number} colorWeight A value that defines the new color
	 * as related to the baseColor. Should be larger than 1.
	 * @return {String} A hexadecimal RGB color value
	 * @private
	 */
	createLightColor : function(baseColor, colorWeight)
	{
		var rgbBaseColor = this.hexToRgb(baseColor);
		
		var rgbColor = {
			red : 255 - (255-rgbBaseColor.red) * (255-128*colorWeight) / 127,
			green : 255 - (255-rgbBaseColor.green) * (255-128*colorWeight) / 127,
			blue : 255 - (255-rgbBaseColor.blue) * (255-128*colorWeight) / 127
		};
		
		return this.rgbToHex(rgbColor);
	},
	
	/**
	 * Creates a color for a color scheme based on the baseColor of
	 * that scheme and a weight factor.
	 * @param {String} baseColor A hexadecimal RGB color value
	 * @param {Number} colorWeight A value that defines the new color
	 * as related to the baseColor. Between 0 and 1 for a color that is darker
	 * than the baseColor. Larger then 1 for a color that is lighter
	 * than the baseColor.
	 * @return {String} A hexadecimal RGB color value
	 * @private
	 */
	createColor : function(baseColor, colorWeight)
	{
		var rgbBaseColor = this.hexToRgb(baseColor);
		
		if ( Math.max(rgbBaseColor.red, rgbBaseColor.green, rgbBaseColor.blue) > 127 ){
			return this.createLightColor(baseColor, colorWeight);
		}else{
			return this.createDarkColor(baseColor, colorWeight);
		}
	},
	
	/**
	 * Creates a color scheme based on a single base color
	 * 
	 * @param {String} name The unique name for this color scheme
	 * (can be used to identify the color scheme)
	 * @param {String} displayName The name of the color scheme that
	 * will be used if a name for the color scheme must be shown 
	 * to the user.
	 * @param {String} baseColor an RGB hexadecimal color value 
	 * (e.g. '#0067AC for Kopano Blue)
	 */
	createColorScheme : function(name, displayName, baseColor)
	{
		var i;
		
		if ( Array.isArray(name) ){
			for ( i=0; i<name.length; i++ ){
				this.createColorScheme(name[i]);
			}
			
			return;
		}
		
		if ( Ext.isObject(name) ){
			displayName = name.displayName;
			baseColor = name.baseColor || name.base;
			name = name.name;
		}
		
		var colorScheme = {
			name : name,
			displayName : displayName,
			base : baseColor
		};
		
		// Loop through all the fields and create a color for it in this scheme
		for ( i=0; i<this.fields.length; i++ ){
			if ( this.fields[i].name !== 'base' ){
				if ( Ext.isDefined(this.fields[i].color) ){
					colorScheme[this.fields[i].name] = this.fields[i].color;
				}else{
					colorScheme[this.fields[i].name] = this.createColor(baseColor, this.fields[i].weight);
				}
			}
		}
		
		if ( !Ext.isDefined(this.getColorScheme(name)) ){
			this.colorSchemes.push(colorScheme);
		}
	},
	
	/**
	 * Adds a complete color scheme to the color scheme list
	 * @param {Object} colorScheme
	 */
	addColorScheme : function(colorScheme)
	{
		// Simple check
		if ( !Ext.isDefined(colorScheme.name) || !Ext.isDefined(colorScheme.displayName) || !Ext.isDefined(colorScheme.base) ){
			// Missing necessary properties for a valid color scheme
			// So don't add the color scheme.
			return;
		}
		
		// Create colors that are not available in the passed color scheme
		for ( var i=0; i<this.fields.length; i++ ){
			if ( !Ext.isDefined(colorScheme[this.fields[i].name]) ){
				if ( Ext.isDefined(this.fields[i].color) ){
					colorScheme[this.fields[i].name] = this.fields[i].color;
				}else{
					colorScheme[this.fields[i].name] = this.createColor(colorScheme.base, this.fields[i].weight);
				}
			}
		}
		
		this.colorSchemes.push(colorScheme);
	},
	
	/**
	 * Adds the color schemes and additional color schemes that are defined 
	 * in the config.php/default.php
	 */
	addColorSchemesFromConfig : function()
	{
		var i;
		var colorSchemes = container.getServerConfig().getColorSchemes();
		if ( colorSchemes && Array.isArray(colorSchemes) ){
			for ( i=0; i<colorSchemes.length; i++ ){
				this.addColorScheme(colorSchemes[i]);
			}
		}
		var additionalColorSchemes = container.getServerConfig().getAdditionalColorSchemes();
		if ( additionalColorSchemes && Array.isArray(additionalColorSchemes) ){
			for ( i=0; i<additionalColorSchemes.length; i++ ){
				this.addColorScheme(additionalColorSchemes[i]);
			}
		}
	},
	
	/**
	 * Returns the color scheme with the passed name if found,
	 * or undefined otherwise
	 * @param {String} colorSchemeName The name of the color scheme
	 * @return {Object|undefined} A color scheme or undefined if not found
	 */
	getColorScheme : function(colorSchemeName)
	{
		for ( var i=0; i<this.colorSchemes.length; i++ ){
			if ( this.colorSchemes[i].name === colorSchemeName ){
				return this.colorSchemes[i];
			}
		}
		
		return undefined;
	},
	
	/**
	 * Returns the array with all defined color schemes
	 * @return {Object[]} An array with all defined color schemes
	 */
	getColorSchemes : function()
	{
		return this.colorSchemes;
	},
	
	/**
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and l in the set [0, 1].
	 *
	 * @param {Number}  r       The red color value
	 * @param {Number}  g       The green color value
	 * @param {Number}  b       The blue color value
	 * @return {Array}           The HSL representation
	 */
	rgbToHsl : function(r, g, b)
	{
		if ( arguments.length === 1 && r.substr(0,1) === '#' ){
			var rgb = this.hexToRgb(r);
			r = rgb.red;
			g = rgb.green;
			b = rgb.blue;
		}
		
	    r /= 255;
	    g /= 255;
	    b /= 255;
	    var max = Math.max(r, g, b), min = Math.min(r, g, b);
	    var h, s, l = (max + min) / 2;
	
	    if ( max === min ) {
	        h = s = 0; // achromatic
	    }else{
	        var d = max - min;
	        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	        switch(max){
	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	            case g: h = (b - r) / d + 2; break;
	            case b: h = (r - g) / d + 4; break;
	        }
	        h /= 6;
	    }
	
	    return [h, s, l];
	},
	
	/**
	 * Returns the luma value (brightness perception)
	 * See http://stackoverflow.com/a/12043228
	 * @param   {Number}  r       The red color value
	 * @param   {Number}  g       The green color value
	 * @param   {Number}  b       The blue color value
	 * @return {Number} luma value
	 */
	getLuma : function(r, g, b)
	{
		if ( arguments.length === 1 && r.substr(0,1) === '#' ){
			var rgb = this.hexToRgb(r);
			r = rgb.red;
			g = rgb.green;
			b = rgb.blue;
		}
		
		var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
		
		return luma;
	}
};

Zarafa.onReady(function(){
		// Load the color schemes that are defined in the config
		Zarafa.core.ColorSchemes.addColorSchemesFromConfig();
});
