/**
 * @class CanvasRenderingContext2D
 * @extends Object
 * 
 * Some convenience methods for the default canvas 2D context. These allow of drawing
 * circles, lines, text with auto-wrapping, etc. 
 */
if (!!document.createElement('canvas').getContext)
{
	/**
	 * Creates a circular path on the canvas.
	 * @param {Number} x center horizontal position.
	 * @param {Number} y center vertical position.
	 * @param {Number} radius circle radius.
	 */
	CanvasRenderingContext2D.prototype.circle = function(x, y, radius)
	{
		this.beginPath();
		this.arc(x, y, radius, 0, Math.PI*2, true); 
		this.closePath();
	};
	
	/**
	 * Strokes a straight line between two points.
	 * @param {Number} x1 horizontal component of the start point. 
	 * @param {Number} y1 vertical component of the start point.
	 * @param {Number} x2 horizontal component of the end point.
	 * @param {Number} y2 vertical component of the end point.
	 */
	CanvasRenderingContext2D.prototype.strokeLine = function(x1, y1, x2, y2)
	{
		this.beginPath();
		this.moveTo(x1, y1);
		this.lineTo(x2, y2);
		this.stroke();
	};

	/**
	 * Gets the font size from CSS font specifier string. font property of canvas object contains font specification.
	 * @return {Number} current font size of the text
	 */
	CanvasRenderingContext2D.prototype.getFontSize = function()
	{
		var fontSizeRegExp = new RegExp('([0-9]*)p[tx]');
		return parseInt(fontSizeRegExp.exec(this.font)[1], 10);
	};

	/**
	 * Draws a string of text.
	 * @param {String} text text to draw.
	 * @param {Number} x horizontal position.
	 * @param {Number} y vertical position.
	 * @param {Number} maxWidth (optional) maximum width in pixels. 
	 */
	CanvasRenderingContext2D.prototype.drawText = function(text, x, y, maxWidth)
	{
		if (maxWidth) {
			this.fillText(text, x, y, maxWidth);
		} else {
			this.fillText(text, x, y);
		}
	};

	/**
	 * Draws a string of wrapped text. 
	 * @param {String} text text to draw.
	 * @param {Number} x horizontal position.
	 * @param {Number} y vertical position.
	 * @param {Number} width width.
	 * @param {Number} lineHeight number of pixels to advance down after each line break.
	 * @param {Number} maxHeight (optional) maximum height in pixels
	 * @param {Number} clipX (optional) The number of pixels horizontally that should be clipped (from the left-top corner).
	 * @param {Number} clipY (optional) The number of pixels vertically that should be clipped (from the left-top corner).
	 * @return {Number} Total height of the drawn text
	 */
	CanvasRenderingContext2D.prototype.drawWrappedText = function(text, x, y, width, lineHeight, maxHeight, clipX, clipY)
	{
		// If the text contains '\n' characters, we have to split the text up
		// into individual lines which we can then draw on the canvas.
		while (text[text.length - 1] === '\n') {
			text = text.substr(0, text.length - 1);
		}
		var lines = text.split('\n');
		if (lines.length > 1) {
			var totalHeight = 0;

			for (var i = 0; i < lines.length; i++) {
				var offset = this.drawWrappedText(lines[i], x, y, width, lineHeight, maxHeight, clipX, clipY);
				y += offset;
				totalHeight += offset;
				maxHeight -= offset;
			}

			return totalHeight;
		}

		// split the text into words
		var words = text.split(' ');
		
		// number of pixels to advance horizontally after drawing a single word
		var spaceWidth = this.textWidth(' ');

		// Check the clipping options
		clipX = clipX || 0;
		clipY = clipY || 0;

		// render each word individually
		var tx = x + clipX;
		var ty = y;
		for (var i = 0, len = words.length; i < len; i++) {
			var word = words[i];
			var wordWidth = this.textWidth(word);

			// Test if the word will fit on this line
			if (((tx - x) + wordWidth) >= width && tx !== x) {
				var moveLine = true;

				// It doesn't fit, check if it will
				// fit if we move to the next line
				if (wordWidth >= width) {
					// It won't, lets see if at least half
					// the word will fit the current line
					if (((tx - x) + (wordWidth / 2)) < width) {
						// It will, just print it
						moveLine = false;
					}
				}

				if (moveLine) {
					ty += lineHeight;
					if (ty > clipY) {
						clipX=0;
					}
					tx = x + clipX;
					// See if we are going to write the next line
					// across the limit
					if ((ty - y) > maxHeight) {
						break;
					}
				}
			}

			this.drawText(word, tx, ty);
			tx += wordWidth + spaceWidth;
		}

		// Calculate the written height, this means that the current
		// offset must be substracted by the start offset. And finally
		// we need to add a lineHeight, as we have written at least
		// 1 line.
		return ty - y + lineHeight;
	};

	/**
	 * Measures the height of a text when wrapped to a certain width. 
	 * @param {String} text text to draw.
	 * @param {Number} width width.
	 * @param {Number} lineHeight number of pixels to advance down after each line break.
	 * @return {Number} height of the text
	 */
	CanvasRenderingContext2D.prototype.textHeight = function(text, width, lineHeight)
	{
		// If the text contains '\n' characters, we have to split the text up
		// into individual lines which we can then draw on the canvas.
		while(text[text.length - 1] === '\n') {
			text = text.substr(0, text.length - 1);
		}
		var lines = text.split('\n');
		if (lines.length > 1) {
			var totalHeight = 0;

			for (var i = 0; i < lines.length; i++) {
				var offset = this.textHeight(lines[i], width, lineHeight);
				totalHeight += offset;
			}

			return totalHeight;
		}

		// split the text into words
		var words = text.split(' ');
		
		// number of pixels to advance horizontally after drawing a single word
		var spaceWidth = this.textWidth(' ');
		
		// render each word individually
		var tx = 0;
		var ty = 0;
		for (var i = 0, len = words.length; i < len; i++) {
			var word = words[i];
			var wordWidth = this.textWidth(word);

			// Test if the word will fit on this line
			if ((tx + wordWidth) >= width && tx !== 0) {
				var moveLine = true;

				// It doesn't fit, check if it will
				// fit if we move to the next line
				if (wordWidth >= width) {
					// It won't, lets see if at least half
					// the word will fit the current line
					if ((tx + (wordWidth / 2)) < width) {
						// It will, just print it
						moveLine = false;
					}
				}

				if (moveLine) {
					tx = 0;
					ty += lineHeight;
				}
			}

			tx += wordWidth + spaceWidth;
		}
		ty += lineHeight;
		return ty;
	};

	/**
	 * Measures a piece of text.
	 * @param {String} text text to measure.
	 * @return {Number} the width in pixels of the given text string if rendered with the current font. 
	 */
	CanvasRenderingContext2D.prototype.textWidth = function(text)
	{
		return this.measureText(text).width;
	};
	
	/**
	 * Converts the hexidecimal RGB notation (#FFAA00) to a decimal notation using the rgba 
	 * function. It will output a string that can be used in defining colors and opacity in Canvas. 
	 * By default it will return rgba(0,0,0,0) if no or incorrect values are passed. This is a black
	 * and completely transparent rgba() value.
	 * @param {String} str Hexidecimal RGB notation like #FFAA00. The '#' is optional, the rest of 
	 * the strings needs to contain 6 characters.
	 * @param {Number} opacity (Optional) Will set the opacity in the rgba function. Defaults to 1.
	 * @return {String} The rgba() notation. 
	 */
	CanvasRenderingContext2D.prototype.convertHexRgbToDecRgba = function(str, opacity)
	{
		// The regex ensures that the input has at least 6 RGB characters and the preceeding # is optional
		if(Ext.isString(str) && str.search(/#?[A-F0-9]{6}/i) === 0){
			if(!Ext.isNumber(opacity)){
				opacity = 1;
			}

			var decRGB = [];
			str = str.replace('#','');
			decRGB[0] = parseInt(str.substr(0, 2), 16);
			decRGB[1] = parseInt(str.substr(2, 2), 16);
			decRGB[2] = parseInt(str.substr(4, 2), 16);
			return 'rgba('+decRGB[0]+','+decRGB[1]+','+decRGB[2]+','+opacity+')';
		}

		// Will return a black, completely transparent rgba() value
		return 'rgba(0,0,0,0)';
	};
}
