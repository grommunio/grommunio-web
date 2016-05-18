Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.ViewModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different viewing modes of the mail context.
 * 
 * @singleton
 */
Zarafa.mail.data.ViewModes = Zarafa.core.Enum.create({
	/**
	 * Don't show the preview panel
	 * @property
	 * @type Number
	 */
	NO_PREVIEW : 0,

	/**
	 * Show the preview panel to the right
	 * @property
	 * @type Number
	 */
	RIGHT_PREVIEW : 1,

	/**
	 * Show the preview panel in the bottom
	 * @property
	 * @type Number
	 */
	BOTTOM_PREVIEW : 2,

	/**
	 * Show the search results
	 * @property
	 * @type Number
	 */
	SEARCH : 3,

	/**
	 * Show the live scroll results
	 * @property
	 * @type Number
	 */
	LIVESCROLL : 4,

	/**
	 * Function was used to check that current view mode
	 * was one of the view mode from {@link #NO_PREVIEW}, 
	 * {@link #RIGHT_PREVIEW} and {@link #BOTTOM_PREVIEW}.
	 *
	 * @param {Zarafa.mail.data.ViewModes} viewMode the viewMode which currently selected.
	 * @return return true if current view mode is {@link #NO_PREVIEW}, {@link #RIGHT_PREVIEW}
	 * and {@link #BOTTOM_PREVIEW} else return false.
	 */
	isMainViewMode : function(viewMode) 
	{
		return viewMode === this.NO_PREVIEW || viewMode === this.RIGHT_PREVIEW || viewMode === this.BOTTOM_PREVIEW;
	}
});
