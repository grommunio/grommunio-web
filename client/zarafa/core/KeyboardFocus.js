Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.KeyboardFocus
 * @singleton
 *
 * Marks the body with "k-keyboard" while the user navigates with the
 * keyboard, so focus rings only show up after a key was pressed and not
 * for the focus the application sets itself after loading.
 */
Zarafa.core.KeyboardFocus = {
	/**
	 * @param {Document} doc The document to watch
	 */
	init: function(doc)
	{
		doc.addEventListener('keydown', function(event) {
			var key = event.key;
			if (key === 'Tab' || key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Enter' || key === ' ') {
				doc.body.classList.add('k-keyboard');
			}
		}, true);
		doc.addEventListener('mousedown', function() {
			doc.body.classList.remove('k-keyboard');
		}, true);
	}
};
