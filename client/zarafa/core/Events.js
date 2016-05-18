Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.Events
 * Utility class for handling special events.
 * @singleton
 */
Zarafa.core.Events = {
	/**
	 * The list of fields and the corresponding {@link Ext.util.Observable}
	 * objects which are used to register the event handlers. Use
	 * {@link #registerListener} and {@link #unregisterListener} to add/remove
	 * {@Link Ext.util.Observable} instances. Use {@link #getListener}
	 * to obtain a {@link Ext.util.Observable} instance.
	 * @property
	 * @type Object
	 * @private
	 */
	listeners : {},

	/**
	 * Register a {@link Ext.util.Observable} instance for the given
	 * {@link Ext.form.Field}/{@link Ext.Element} pair to the {@link #listeners}
	 * object.
	 * @param {Ext.form.Field} field The register for which the observable is added
	 * @param {Ext.Element} el The element for which the the observable is added
	 * @param {Ext.util.Observable} observable The observable to register
	 * @private
	 */
	registerListener : function(field, el, observable)
	{
		var observables = Zarafa.core.Events.listeners[field.id];
		if (observables) {
			observables.push(observable);
		} else {
			Zarafa.core.Events.listeners[field.id] = [ observable ];
		}
	},

	/**
	 * Unregister a previously {@link #registerListener registered}
	 * {@link Ext.util.Observable} from the {@link #listeners}.
	 * @param {Ext.form.Field} field The register to which the observable belongs
	 * @param {Ext.Element} el The element to which the observable belongs
	 * @private
	 */
	unregisterListener : function(field, el)
	{
		var observables = Zarafa.core.Events.listeners[field.id];
		if (observables) {
			for (var i = 0, len = observables.length; i < len; i++) {
				var observable = observables[i];
				if (observable.el === el) {
					observables.splice(i, 1);
					if (observables.length === 0) {
						delete Zarafa.core.Events.listeners[field.id];
					}
				}
			}
		}
	},

	/**
	 * Obtain a previously {@link #registerListener registered}
	 * {@link Ext.util.Observable} from the {@link #listeners}.
	 * @param {Ext.form.Field} field The register to which the observable belongs
	 * @param {Ext.Element} el The element to which the observable belongs
	 * @private
	 */
	getListener : function(field, el)
	{
		var observables = Zarafa.core.Events.listeners[field.id];
		if (!observables) {
			return undefined;
		}

		for (var i = 0, len = observables.length; i < len; i++) {
			var observable = observables[i];
			if (observable.el === el) {
				return observable;
			}
		}

		return undefined;
	},

	/**
	 * Add a special event handler to the given field to catch
	 * 'paste' events. There are multiple ways to paste text into
	 * a textfield.
	 * 1) contextmenu
	 * 2) Ctrl-V (shortcut depending on OS)
	 * 3) Drag & Drop text
	 *
	 * Support for catching these options depends severely on the browser,
	 * and thus this special event handler will serve as compatibility
	 * handler to handle the various cases correctly.
	 *
	 * @param {Ext.form.Field} field The field on which to listen for
	 * paste events.
	 * @param {Ext.Element} el The element on which the event should be registered
	 * @param {Function} fn The callback function to be called when text
	 * has been pasted. This function has no arguments (See {@link Ext.util.Observable#on}).
	 * @param {Object} scope The scope in which the functon will be called (See {@link Ext.util.Observable#on}).
	 * @param {Object} obj (optional) Additional options (See {@link Ext.util.Observable#on}).
	 */
	addPasteEventHandler : function(field, el, fn, scope, obj)
	{
		// Check if this field has already been used to register
		// an event handler for pasting. If that is not the case
		// we need to construct a new Ext.util.Observable object
		// for the field and add the event handlers.
		var observable = Zarafa.core.Events.getListener(field, el);
		if (!Ext.isDefined(observable)) {
			var noOn = !Ext.isFunction(el.on);
			observable = new Ext.util.Observable();
			observable.field = field;
			observable.el = el;
			observable.hasFocus = field.hasFocus;
			observable.originalValue = field.getValue();
			observable.addEvents('paste');

			// Register the event handler for paste events. This will ensure
			// the input element will be resized when pasting.
			// Opera doesn't support the paste event, and thus we need to listen
			// to the 'keyup' event to check if a 'Ctrl-V' is pressed.
			if (Ext.isOpera) {
				if (noOn) {
					el.addEventListener('keyup', this.onPasteKeyUp.createDelegate(observable));
				} else {
					field.mon(el, 'keyup', this.onPasteKeyUp, observable);
				}
			} else {
				if (noOn) {
					el.addEventListener('paste', this.onPaste.createDelegate(observable));
				} else {
					field.mon(el, 'paste', this.onPaste, observable);
				}
			}

			// A special kind of pasting is dragging & dropping text into
			// the boxfield. There really isn't a true event handler for that,
			// as it isn't pasting, but neither is it typing. So use the mouse
			// to detect such changes.
			//
			// For some reason the 'mouseup' event is not being triggered when
			// the user drops the text into the input field. So we must use
			// the event which is fired a bit later.
			if (noOn) {
				el.addEventListener('mouseover', this.onPasteMouseOver.createDelegate(observable));
			} else {
				field.mon(el, 'mouseover', this.onPasteMouseOver, observable);
			}
			field.on('blur', this.onPasteBlur, observable);

			Zarafa.core.Events.registerListener(field, el, observable);
		}

		observable.addListener('paste', fn, scope, obj);
	},

	/**
	 * Removes the event handler as registered by {@link #addPasteEventHandler}.
	 *
	 * @param {Ext.form.Field} field The field on which the event was registered
	 * @param {Ext.Element} el The element on which the event should be registered
	 * @param {Function} fn The function to unregister
	 * @param {Object} scope The scope for the function.
	 */
	removePasteEventHandler : function(field, el, fn, scope)
	{
		var observable = Zarafa.core.Events.getListener(field, el);
		if (Ext.isDefined(observable)) {
			observable.removeListener('paste', fn, scope);
			// If this was the last event handler, delete
			// the Observable instance.
			if (!observable.hasListener('paste')) {
				Zarafa.core.Events.unregisterListener(field, el);
			}
		}
	},

	/**
	 * As Opera doesn't have the 'paste' browser event we are mimicking the behavior
	 * here by having a global 'keyup' event handler. This event will simply check
	 * if 'Ctrl-V has been pressed and will fire the event handler.
	 *
	 * This function is called in the scope of an {@link Ext.util.Observable}.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onPasteKeyUp : function(key, e)
	{
		// There are references online which indicate that Opera doesn't detect
		// the Ctrl key properly and the keyCode is 0. But Opera 11 seems to
		// behave correctly...
		if (key.ctrlKey === true && key.keyCode === Ext.EventObject.V) {
			this.fireEvent('paste');
		}
	},

	/**
	 * Event handler for the 'paste' event on the {@link #el input element}.
	 * This will start the {@link #onPastePoll} function to wait for the contents
	 * to be pasted so it can fire the event handler.
	 *
	 * This function is called in the scope of an {@link Ext.util.Observable}.
	 *
	 * @private
	 */
	onPaste : function()
	{
		Zarafa.core.Events.onPastePoll.call(this, this.field, this.field.getValue(), 5);
	},

	/**
	 * The 'paste' event on an input element is fired before the text which must
	 * be pasted is added into the input field. There is no cross-browser solution
	 * to access the text before it is put into the input field, hence polling is used
	 * to wait for the input field to be updated with the new text, so it can fire
	 * the event handler.
	 *
	 * This function is called in the scope of an {@link Ext.util.Observable}.
	 *
	 * @param {Ext.form.Field} field The field to poll for the new value
	 * @param {String} oldValue The original value of the input element
	 * @param {Number} limit The number of polling tries left
	 * @private
	 */
	onPastePoll : function(field, oldValue, limit)
	{
		if (limit === 0) {
			return;
		} else if (field.getValue() === oldValue) {
			Zarafa.core.Events.onPastePoll.defer(1, this, [field, oldValue, --limit]);
			return;
		}
		this.fireEvent('paste');
		this.originalValue = this.field.getValue();
	},

	/**
	 * Event handler which is fired when the Mouse is being moved over the
	 * input field. This will check if the input field has been magically
	 * changed without the user pressing any button. If that happens, then
	 * the user has dragged text into the input element and we need to
	 * fire the event handler.
	 *
	 * This function is called in the scope of an {@link Ext.util.Observable}.
	 *
	 * @private
	 */
	onPasteMouseOver : function()
	{
		if (this.hasFocus === false) {
			if (this.originalValue !== this.field.getValue()) {
				this.field.focus();
				this.fireEvent('paste');
				this.originalValue = this.field.getValue();
			}

			this.hasFocus = true;
		}
	},

	/**
	 * Event handler which is fired when the registered field is being
	 * {@link Ext.form.Field#blur blurred}. This will store the value
	 * currently in the editor so during {@link #onPasteMouseOver} we can
	 * check if text has been dropped into the editor.
	 * @private
	 */
	onPasteBlur : function()
	{
		this.hasFocus = false;
		this.originalValue = this.field.getValue();
	}
};
