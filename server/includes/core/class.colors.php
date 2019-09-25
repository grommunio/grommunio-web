<?php

/**
 * Utility class for color conversions
 */
class Colors {
	/**
	 * Creates a lighter color
	 * @param String|Object $color A hexstring or color object (array with r, g, b keys)
	 * @param Float $percentage the percentage with which the luminance of the color
	 * should be changed
	 * @return String A hexstring with the new color (including '#')
	 */
	public static function lighter($color, $percentage) {
		$hsl = Colors::rgb2hsl($color);
		$hsl['l'] += $percentage;
		if ( $hsl['l'] > 100 ) {
			$hsl['l'] = 100;
		} elseif ( $hsl['l'] < 0 ) {
			$hsl['l'] = 0;
		}

		$rgb = Colors::hsl2rgb($hsl);
		return Colors::colorObject2string($rgb);
	}

	/**
	 * Creates a darker color
	 * @param String|Object $color A hexstring or color object (array with r, g, b keys)
	 * @param Float $percentage the percentage with which the luminance of the color
	 * should be changed
	 * @return String A hexstring with the new color (including '#')
	 */
	public static function darker($color, $percentage) {
		return Colors::lighter($color, -$percentage);
	}

	/**
	 * Sets the luminance to a certain value.
	 * @param String|Object $color A hexstring or color object (array with r, g, b keys)
	 * @param Float $percentage the percentage to which the luminance of the color
	 * should be set
	 * @return String A hexstring with the new color (including '#')
	 */
	public static function setLuminance($color, $percentage) {
		$hsl = Colors::rgb2hsl($color);
		$hsl['l'] = $percentage;
		if ( $hsl['l'] > 100 ) {
			$hsl['l'] = 100;
		} elseif ( $hsl['l'] < 0 ) {
			$hsl['l'] = 0;
		}

		$rgb = Colors::hsl2rgb($hsl);
		return Colors::colorObject2string($rgb);
	}

	/**
	 * Transforms a hexstring into a color object (array with r, g, b keys)
	 * @param String $color A hexstring or color object (array with r, g, b keys)
	 * @return Array An array with values for r, g, b
	 */
	public static function colorString2Object($color) {
		if ( substr($color, 0, 1) === '#' ) {
			$color = substr($color, 1);
		}

		if ( strlen($color) === 3 ) {
			$red = intval(substr($color, 0, 1).substr($color, 0, 1), 16);
			$green = intval(substr($color, 1, 1).substr($color, 1, 1), 16);
			$blue = intval(substr($color, 2, 1).substr($color, 2, 1), 16);
		} else {
			$red = intval(substr($color, 0, 2), 16);
			$green = intval(substr($color, 2, 2), 16);
			$blue = intval(substr($color, 4, 2), 16);
		}

		return [
			'r' => $red,
			'g' => $green,
			'b' => $blue,
		];
	}

	/**
	 * Transforms a color object (array with r, g, b keys) into a hexstring
	 * @param Array $color An array with values for r, g, b
	 * @return String  A hexstring or color object (array with r, g, b keys)
	 */
	public static function colorObject2string($color) {
		$r = dechex($color['r']);
		if ( strlen($r) === 1 ) {
			$r = '0'.$r;
		}
		$g = dechex($color['g']);
		if ( strlen($g) === 1 ) {
			$g = '0'.$g;
		}
		$b = dechex($color['b']);
		if ( strlen($b) === 1 ) {
			$b = '0'.$b;
		}
		return '#' . $r . $g . $b;
	}

	/**
	 * Transforms an red-green-blue color to a hue-saturation-luminence color object
	 * See http://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/ for
	 * more information
	 * @param Array $color An array with values for r, g, b
	 * @return Array An array with values for h, s, l
	 */
	public static function rgb2hsl($color) {
		if ( is_string($color) ) {
			$color = Colors::colorString2Object($color);
		}

		$min = min([$color['r'], $color['g'], $color['b']]);
		$max = max([$color['r'], $color['g'], $color['b']]);
		$lum = (100/255) * ($min + $max) / 2;

		if ( $min === $max ) {
			// greyscale
			return [
				'h' => 0,
				's' => 0,
				'l' => $lum,
			];
		}

		if ( $lum < 50 ) {
			$sat = 100*($max-$min)/($max+$min);
		} else {
			$sat = 100*($max/255-$min/255)/(2-$max/255-$min/255);
		}

		if ( $max === $color['r'] ) {
			$hue = ($color['g']-$color['b'])/($max-$min);
		} elseif ( $max === $color['g'] ) {
			$hue = 2 + ($color['b']-$color['r'])/($max-$min);
		} else {
			$hue = 4 + ($color['r']-$color['g'])/($max-$min);
		}
		$hue *= 60;
		if ( $hue < 0 ) {
			$hue += 360;
		}

		return [
			'h' => $hue,
			's' => $sat,
			'l' => $lum,
		];
	}

	/**
	 * Transforms an hue-saturation-luminence to a red-green-blue color color object
	 * See http://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/ for
	 * more information
	 * @param Array $color An array with values for h, s, l
	 * @return Array An array with values for r, g, b
	 */
	public static function hsl2rgb($color) {
		$hue = $color['h'];
		$sat = $color['s'];
		$lum = $color['l'];

		if ( $color['s'] === 0 ) {
			// greyscale
			return [
				'r' => $lum * (255/100),
				'g' => $lum * (255/100),
				'b' => $lum * (255/100),
			];
		}

		$temp1 = $lum/100 < 0.5 ? ($lum/100)*(1+$sat/100) : ($lum+$sat-$lum*$sat/100)/100;
		$temp2 = 2*$lum/100 - $temp1;

		$tempr = $hue/360 + 0.333;
		if ( $tempr > 1 ) {
			$tempr -= 1;
		}
		$tempg = $hue/360;
		$tempb = $hue/360 - 0.333;
		if ( $tempb < 0 ) {
			$tempb += 1;
		}

		if ( 6*$tempr < 1 ) {
			$red = $temp2 + ($temp1-$temp2)*6*$tempr;
		} elseif ( 2*$tempr < 1 ) {
			$red = $temp1;
		} elseif ( 3*$tempr < 2 ) {
			$red = $temp2 + ($temp1-$temp2)*(0.666-$tempr)*6;
		} else {
			$red = $temp2;
		}

		if ( 6*$tempg < 1 ) {
			$green = $temp2 + ($temp1-$temp2)*6*$tempg;
		} elseif ( 2*$tempg < 1 ) {
			$green = $temp1;
		} elseif ( 3*$tempg < 2 ) {
			$green = $temp2 + ($temp1-$temp2)*(0.666-$tempg)*6;
		} else {
			$green = $temp2;
		}

		if ( 6*$tempb < 1 ) {
			$blue = $temp2 + ($temp1-$temp2)*6*$tempb;
		} elseif ( 2*$tempb < 1 ) {
			$blue = $temp1;
		} elseif ( 3*$tempb < 2 ) {
			$blue = $temp2 + ($temp1-$temp2)*(0.666-$tempb)*6;
		} else {
			$blue = $temp2;
		}

		return [
			'r' => 255*$red,
			'g' => 255*$green,
			'b' => 255*$blue,
		];
	}

	/**
	* Returns the luma value (brightness perception)
	* See http://stackoverflow.com/a/12043228
	* @param String|Array $color A hexstring or a color object (rgb or hsl)
	* @return Float luma value
	*/
	static public function getLuma($color)
	{
		if ( is_string($color) ) {
			$color = Colors::colorString2Object($color);
		} elseif ( !isset($color['r']) && isset($color['h']) ) {
			// assume that this is an hsl color
			$color = Colors::hsl2rgb($color);
		}

		$luma = 0.2126 * $color['r'] + 0.7152 * $color['g'] + 0.0722 * $color['b']; // per ITU-R BT.709

		return $luma;
	}

	/**
	 * Translates a css color value to a hex color value. So rgb, rgba and
	 * color keywords will be translated to their hex counterparts.
	 * @param String $color The color that needs to be translated
	 * @return String The hex color value
	 */
	static public function getHexColorFromCssColor($color) {
		$color = strtolower($color);
		if ( isset(Colors::$keyWords[$color]) ) {
			return Colors::$keyWords[$color];
		}
		if ( preg_match('/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/', $color) ) {
			// Already a hex color
			return $color;
		}
		if ( preg_match('/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/', $color, $m) ) {
			$r = intval($m[1]);
			$g = intval($m[2]);
			$b = intval($m[3]);
			if ( $r < 0 || $r > 255 || $g < 0 || $g > 255 | $b < 0 || $b > 255 ) {
				// Not a valid color
				return null;
			}
			return Colors::colorObject2string(['r'=>$r, 'g'=>$g, 'b'=>$b]);
		}

		// Not a valid color
		// Note: alpha-numeric channels are not supported (i.e. rgba(x, x, x, x) or #xxxxxxxx or #xxxx)
		return null;
	}

	/**
	 * Color keywords. Taken from https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
	 */
	static public $keyWords = [
		'black' => '#000000',
		'silver' => '#c0c0c0',
		'gray' => '#808080',
		'white' => '#ffffff',
		'maroon' => '#800000',
		'red' => '#ff0000',
		'purple' => '#800080',
		'fuchsia' => '#ff00ff',
		'green' => '#008000',
		'lime' => '#00ff00',
		'olive' => '#808000',
		'yellow' => '#ffff00',
		'navy' => '#000080',
		'blue' => '#0000ff',
		'teal' => '#008080',
		'aqua' => '#00ffff',
		'orange' => '#ffa500',
		'aliceblue' => '#f0f8ff',
		'antiquewhite' => '#faebd7',
		'aquamarine' => '#7fffd4',
		'azure' => '#f0ffff',
		'beige' => '#f5f5dc',
		'bisque' => '#ffe4c4',
		'blanchedalmond' => '#ffebcd',
		'blueviolet' => '#8a2be2',
		'brown' => '#a52a2a',
		'burlywood' => '#deb887',
		'cadetblue' => '#5f9ea0',
		'chartreuse' => '#7fff00',
		'chocolate' => '#d2691e',
		'coral' => '#ff7f50',
		'cornflowerblue' => '#6495ed',
		'cornsilk' => '#fff8dc',
		'crimson' => '#dc143c',
		'cyan' => '#00ffff',
		'darkblue' => '#00008b',
		'darkcyan' => '#008b8b',
		'darkgoldenrod' => '#b8860b',
		'darkgray' => '#a9a9a9',
		'darkgreen' => '#006400',
		'darkgrey' => '#a9a9a9',
		'darkkhaki' => '#bdb76b',
		'darkmagenta' => '#8b008b',
		'darkolivegreen' => '#556b2f',
		'darkorange' => '#ff8c00',
		'darkorchid' => '#9932cc',
		'darkred' => '#8b0000',
		'darksalmon' => '#e9967a',
		'darkseagreen' => '#8fbc8f',
		'darkslateblue' => '#483d8b',
		'darkslategray' => '#2f4f4f',
		'darkslategrey' => '#2f4f4f',
		'darkturquoise' => '#00ced1',
		'darkviolet' => '#9400d3',
		'deeppink' => '#ff1493',
		'deepskyblue' => '#00bfff',
		'dimgray' => '#696969',
		'dimgrey' => '#696969',
		'dodgerblue' => '#1e90ff',
		'firebrick' => '#b22222',
		'floralwhite' => '#fffaf0',
		'forestgreen' => '#228b22',
		'gainsboro' => '#dcdcdc',
		'ghostwhite' => '#f8f8ff',
		'gold' => '#ffd700',
		'goldenrod' => '#daa520',
		'greenyellow' => '#adff2f',
		'grey' => '#808080',
		'honeydew' => '#f0fff0',
		'hotpink' => '#ff69b4',
		'indianred' => '#cd5c5c',
		'indigo' => '#4b0082',
		'ivory' => '#fffff0',
		'khaki' => '#f0e68c',
		'lavender' => '#e6e6fa',
		'lavenderblush' => '#fff0f5',
		'lawngreen' => '#7cfc00',
		'lemonchiffon' => '#fffacd',
		'lightblue' => '#add8e6',
		'lightcoral' => '#f08080',
		'lightcyan' => '#e0ffff',
		'lightgoldenrodyellow' => '#fafad2',
		'lightgray' => '#d3d3d3',
		'lightgreen' => '#90ee90',
		'lightgrey' => '#d3d3d3',
		'lightpink' => '#ffb6c1',
		'lightsalmon' => '#ffa07a',
		'lightseagreen' => '#20b2aa',
		'lightskyblue' => '#87cefa',
		'lightslategray' => '#778899',
		'lightslategrey' => '#778899',
		'lightsteelblue' => '#b0c4de',
		'lightyellow' => '#ffffe0',
		'limegreen' => '#32cd32',
		'linen' => '#faf0e6',
		'magenta' => '#ff00ff',
		'mediumaquamarine' => '#66cdaa',
		'mediumblue' => '#0000cd',
		'mediumorchid' => '#ba55d3',
		'mediumpurple' => '#9370db',
		'mediumseagreen' => '#3cb371',
		'mediumslateblue' => '#7b68ee',
		'mediumspringgreen' => '#00fa9a',
		'mediumturquoise' => '#48d1cc',
		'mediumvioletred' => '#c71585',
		'midnightblue' => '#191970',
		'mintcream' => '#f5fffa',
		'mistyrose' => '#ffe4e1',
		'moccasin' => '#ffe4b5',
		'navajowhite' => '#ffdead',
		'oldlace' => '#fdf5e6',
		'olivedrab' => '#6b8e23',
		'orangered' => '#ff4500',
		'orchid' => '#da70d6',
		'palegoldenrod' => '#eee8aa',
		'palegreen' => '#98fb98',
		'paleturquoise' => '#afeeee',
		'palevioletred' => '#db7093',
		'papayawhip' => '#ffefd5',
		'peachpuff' => '#ffdab9',
		'peru' => '#cd853f',
		'pink' => '#ffc0cb',
		'plum' => '#dda0dd',
		'powderblue' => '#b0e0e6',
		'rosybrown' => '#bc8f8f',
		'royalblue' => '#4169e1',
		'saddlebrown' => '#8b4513',
		'salmon' => '#fa8072',
		'sandybrown' => '#f4a460',
		'seagreen' => '#2e8b57',
		'seashell' => '#fff5ee',
		'sienna' => '#a0522d',
		'skyblue' => '#87ceeb',
		'slateblue' => '#6a5acd',
		'slategray' => '#708090',
		'slategrey' => '#708090',
		'snow' => '#fffafa',
		'springgreen' => '#00ff7f',
		'steelblue' => '#4682b4',
		'tan' => '#d2b48c',
		'thistle' => '#d8bfd8',
		'tomato' => '#ff6347',
		'turquoise' => '#40e0d0',
		'violet' => '#ee82ee',
		'wheat' => '#f5deb3',
		'whitesmoke' => '#f5f5f5',
		'yellowgreen' => '#9acd32',
		'rebeccapurple' => '#663399',
	];
}
