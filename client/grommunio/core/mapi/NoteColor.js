Ext.namespace("Grommunio.core.mapi");

/**
 * @class Grommunio.core.mapi.NoteColor
 * @extends Grommunio.core.Enum
 *
 * Enumerates to Note Color values
 *
 * @singleton
 */
Grommunio.core.mapi.NoteColor = Grommunio.core.Enum.create({

	// sticky notes
	'note_blue': 0,
	'note_green': 1,
	'note_pink': 2,
	'note_yellow': 3,
	'note_white': 4,

	/**
	 * Function returns color name as a string.
	 *
	 * @param {Object} value The data value for the cell.
	 * @return {String} return the color name.
	 */
	getColorText: function(value)
	{
		var colorValue = "";

		switch(parseInt(value, 10))
		{
			case this.note_blue:
				colorValue = _('Blue');
				break;
			case this.note_green:
				colorValue = _('Green');
				break;
			case this.note_pink:
				colorValue = _('Pink');
				break;
			case this.note_white:
				colorValue = _('White');
				break;
			case this.note_yellow:
			/* falls through */
			default:
				colorValue = _('Yellow');
				break;
		}

		return colorValue;
	},

	/**
	 * Returns the color value for an icon index.
	 *
	 * @param {Number} iconIndex The icon index.
	 * @return {Number} The color value.
	 */
	getColorValue: function(iconIndex)
	{
		var color = Grommunio.core.mapi.IconIndex.getName(iconIndex);
		return this[color];
	}
});
