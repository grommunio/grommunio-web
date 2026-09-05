Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.ViewModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different viewing modes.
 *
 * @singleton
 */
Zarafa.common.data.ViewModes = Zarafa.core.Enum.create({
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
	BOTTOM_PREVIEW: 2,

	/**
	 * Show the search results
	 * @property
	 * @type Number
	 */
	SEARCH: 3,

	/**
	 * Show the live scroll results
	 * @property
	 * @type Number
	 */
	LIVESCROLL: 4,

	/**
	 * Checks whether the current view mode is {@link #NO_PREVIEW},
	 * {@link #RIGHT_PREVIEW}, or {@link #BOTTOM_PREVIEW}.
	 *
	 * @param {Zarafa.common.data.ViewModes} viewMode The currently selected view mode.
	 * @return {Boolean} True if the view mode is {@link #NO_PREVIEW},
	 * {@link #RIGHT_PREVIEW}, or {@link #BOTTOM_PREVIEW}; otherwise, false.
	 */
	isMainViewMode: function(viewMode)
	{
		return viewMode === this.NO_PREVIEW || viewMode === this.RIGHT_PREVIEW || viewMode === this.BOTTOM_PREVIEW;
	}
});
