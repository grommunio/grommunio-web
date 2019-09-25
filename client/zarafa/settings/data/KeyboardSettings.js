Ext.namespace('Zarafa.settings.data');

/**
 * @class Zarafa.settings.data.KeyboardSettings
 * @extends Zarafa.core.Enum
 *
 * Enum containing the keyboard settings modes.
 *
 * @singleton
 */
Zarafa.settings.data.KeyboardSettings = Zarafa.core.Enum.create({
	/**
	 * Don't use Keyboard Shortcuts
	 * @property
	 * @type String
	 */
	NO_KEYBOARD_SHORTCUTS: 'disabled',

	/**
	 * All Keyboard Shortcuts
	 * @property
	 * @type String
	 */
	ALL_KEYBOARD_SHORTCUTS: 'full',

	/**
	 * Basic Keyboard Shortcuts
	 *
	 * @property
	 * @type String
	 */
	BASIC_KEYBOARD_SHORTCUTS: 'basic'
});
