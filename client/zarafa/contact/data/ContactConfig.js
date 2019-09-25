Ext.namespace('Zarafa.contact.data');

/**
 * @class Zarafa.contact.data.config
 * @singleton
 */
Zarafa.contact.data.config = {
	/**
	 * prefix options for the display name.
	 * @type Array
	 */
	Prefix : [
		[''],
		[_('Dr.')],
		[_('Miss')],
		[_('Mr.')],
		[_('Mrs.')],
		[_('Ms.')],
		[_('Prof.')]
	],

	/**
	 * suffix options for the display name.
	 * @type Array
	 */
	Suffix : [
		[''],
		['I'],
		['II'],
		['III'],
		[_('Jr.')],
		[_('Sr.')]
	],

	/**
	 * Carriage return (\r) value in UTF-8 hex format
	 * @type HexString
	 */
	CR : '\x0D',

	/**
	 * Line feed (\n) value in UTF-8 hex format
	 * @type HexString
	 */
	LF : '\x0A',

	/**
	 * Carriage return line feed (\r\n) value in UTF-8 hex format
	 * @type HexString
	 */
	CRLF : '\x0D\x0A',

	/**
	 * space value in UTF-8 hex format
	 * @type HexString
	 */
	SP : '\x20',

	/**
	 * non breaking space value in UTF-8 hex format
	 * @type HexString
	 */
	NBSP : '\xA0'
};
