Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.ViewModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different viewing modes of the files context.
 *
 * @singleton
 */
Grommunio.plugins.files.data.ViewModes = Grommunio.core.Enum.create({

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
