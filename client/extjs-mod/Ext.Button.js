(function() {
 	var orig_onClick = Ext.Button.prototype.onClick;

	Ext.override(Ext.Button, {
		/*
		 * Fix issue that when the Button is pressed the focus is not moved
		 * away from the current input field. This is an issue which exists
		 * on some browsers (at least Firefox), while other browsers (Chrome)
		 * are safe.
		 */
		onClick : function(e)
		{
			// Copy the original event, during focus() and blur() the
			// 'e' will be changed to the input element that is being
			// blurred. Hence we create a copy which we will pass to
			// the original function.
			var origEvent = new Ext.EventObjectImpl(e);
			this.focus();

			orig_onClick.call(this, origEvent);

			// Ensure that we have remove the focus again to prevent
			// the button from remaining blurred. Note that the event
			// handler for the button might have destroyed the button
			// (e.g. the Ok or cancel button in a dialog which closes
			// the dialog).
			if (!this.isDestroyed) {
				this.blur();
			}
		},

		/* Override default ext.js template, which uses tables for buttons.
		 * This way buttons are easier to handle, and the code is much cleaner and leaner.
		 * The scheme is <div><div><em><button>
		 * The two containers are needed because Ext.JS applies various classes for icons, etc.
		 * The em element is used for applying the arrow of split buttons, and for making buttons unselectable.
		 */
		template:new Ext.Template(
			'<div id="{4}" class="x-btn {3}"><div class="{1}">',
			'<em class="{2}" class="x-unselectable" unselectable="on"><button type="{0}"></button></em>',
			'</div></div>')
	});
})();
