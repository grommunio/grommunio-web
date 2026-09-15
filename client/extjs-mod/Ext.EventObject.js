/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	/*
	 * Extend the EventObjectImp with additional keycodes.
	 */
	Ext.apply(Ext.EventObjectImpl.prototype, {
		SEMI_COLON: 186,
		EQUAL_SIGN: 187,
		COMMA: 188,
		DASH: 189,
		PERIOD: 190,
		FORWARD_SLASH: 191,
		OPEN_BRACKET: 219,
		BACK_SLASH: 220,
		CLOSE_BRACKET: 221,
		SINGLE_QUOTE: 222
	});

	var orig_setEvent = Ext.EventObject.setEvent;

	/*
	 * We override this function because we want different behavior for the
	 * metaKey than Ext. Ext sets the ctrlKey to true when the metaKey is
	 * pressed. On OSX we want the CMD key (metaKey) to act as the ctrlKey
	 * and the real ctrlKey not. However Safari/macOS reserve several CMD shortcuts,
	 * including CMD + R and CMD + M, before a web application can handle them.
	 * Use the physical Control key in Safari so those application shortcuts
	 * remain available. On Windows/Linux we don't want the metaKey to
	 * behave like the ctrlKey.
	 *
	 * @param {Event} e The Browser event object
	 *
	 * @return {Ext.EventObject} The normalized event object
	 */
	Ext.EventObject.setEvent = function(e)
	{
		e = orig_setEvent.call(this, e);

		if (Ext.isMac) {
			if (Ext.isSafari) {
				e.ctrlKey = e.browserEvent.ctrlKey || false;
			}
			else if (e.ctrlKey && !e.browserEvent.metaKey) {
				e.ctrlKey = false;
			}
		}
		if (!Ext.isMac) {
			e.ctrlKey = e.browserEvent.ctrlKey || false;
		}

		return e;
	};
})();
