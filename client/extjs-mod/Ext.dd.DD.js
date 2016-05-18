Ext.override(Ext.dd.DD, {
	/**
	 * When set to true, the utility automatically tries to scroll the browser
	 * window when a drag and drop element is dragged near the viewport boundary.
	 * Defaults to false. Overriden because in webapp we will never need to drag anything out of window.
	 * @property scroll
	 * @type boolean
	 */
	scroll : false
});