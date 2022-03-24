Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.ViewModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different viewing modes of the files context.
 *
 * @singleton
 */
Zarafa.plugins.files.data.ViewModes = Zarafa.core.Enum.create({

	/**
	 * Don't show the preview panel
	 * @property
	 * @type Number
	 */
	NO_PREVIEW: 0,

	/**
	 * Show the preview panel to the right
	 * @property
	 * @type Number
	 */
	RIGHT_PREVIEW: 1,

	/**
	 * Show the preview panel in the bottom
	 * @property
	 * @type Number
	 */
	BOTTOM_PREVIEW: 2
});
