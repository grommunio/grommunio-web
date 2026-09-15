Ext.namespace('Grommunio.settings.data');

/**
 * @class Grommunio.settings.data.KeyboardSettings
 * @extends Grommunio.core.Enum
 *
 * Enum containing the keyboard settings modes.
 *
 * @singleton
 */
Grommunio.settings.data.KeyboardSettings = Grommunio.core.Enum.create({
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
