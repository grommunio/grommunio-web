(function() {
	/*
	 * We must set the default value of the bufferResize property
	 * to something more appropriate to our needs.
	 */
	Ext.override(Ext.Container, {
		bufferResize : false
	});
})();
