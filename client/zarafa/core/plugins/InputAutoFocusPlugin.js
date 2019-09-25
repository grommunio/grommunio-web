Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.InputAutoFocusPlugin
 * @extends Object
 * @ptype zarafa.inputautofocusplugin
 *
 * A special plugin which, when placed on a {@link Ext.Panel} will
 * automatically select the first available Input element it can find.
 */
Zarafa.core.plugins.InputAutoFocusPlugin = Ext.extend(Object, {
	/**
	 * @cfg {Ext.Component} autoFocus The component which should
	 * be focused when the {@link #field} has been {@link Ext.Container#afterlayout layed out}
	 * or {@link Ext.Container#activate activated}.
	 */
	autoFocus : undefined,

	/**
	 * The field on which this plugin has been installed
	 * @property
	 * @type Ext.Container
	 */
	field : undefined,

	/**
	 * The extra {@link Ext.Element} which is inserted at the start of the {@link #field container},
	 * this is used to apply a {@link #doCyclicFocus cyclic focus} to prevent the focus
	 * to leave the {@link #field container}.
	 * @property
	 * @type Ext.Element
	 */
	beginFocusEl : undefined,

	/**
	 * The extra {@link Ext.Element} which is inserted at the end of the {@link #field container},
	 * this is used to apply a {@link #doCyclicFocus cyclic focus} to prevent the focus
	 * to leave the {@link #field container}.
	 * @property
	 * @type Ext.Element
	 */
	endFocusEl : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Called by the {@link Ext.Container} when the plugin is being registerd.
	 * @param {Ext.Container} field The field into which this plugin is installed
	 */
	init : function(field)
	{
		this.field = field;
		field.inputAutoFocusPlugin = this;

		this.field.on('afterrender', this.onAfterRender, this);
		this.field.on('afterlayout', this.onAfterFirstLayout, this, { single: true });
		this.field.on('destroy', this.onDestroy, this);
	},

	/**
	 * Event handler which is fired after the {@link #field} has been {@link Ext.Container#afterrender rendered}.
	 * This will create the {@link #beginFocusEl} and {@link #endFocusEl} elements to enable {@link #doCyclicFocus}
	 * cyclic focussing.
	 * @private
	 */
	onAfterRender : function()
	{
		this.beginFocusEl = Ext.DomHelper.insertBefore(this.field.el, {
			tag : 'a',
			href: '#',
			style: 'position: absolute; text-decoration: none; font-height: 1px; width: 1px; height: 1px; left:-10000px; top:-10000px;'
		}, true);
		this.beginFocusEl.dom.innerHTML = "&nbsp;";
		this.beginFocusEl.on('focus', this.onLimitFocussed, this);

		this.endFocusEl = Ext.DomHelper.insertAfter(this.field.el, {
			tag : 'a',
			href: '#',
			style: 'position: absolute; text-decoration: none; font-height: 1px; width: 1px; height: 1px; left:-10000px; top:-10000px;'
		}, true);
		this.endFocusEl.dom.innerHTML = "&nbsp;";
		this.endFocusEl.on('focus', this.onLimitFocussed, this);
		// Check if the field is a child of the Ext.Window, if a focus element exists on it,
		// then we need to intercept its focus and move it to the form
		var win = this.field.findParentByType('window');
		if (win && win.focusEl) {
			win.focusEl.on('focus', this.onDialogFocussed, this);
		}

	},

	/**
	 * Event hander which is fired after the {@link #field} has been {@link Ext.Container#afterlayout layed out}.
	 * This will check if the {@link #field} is a tab in a {@link Ext.TabPanel} or a normal {@link Ext.Container}.
	 * When it is a tab, it will wait for the {@link Ext.Container#activate tab-activation}, otherwise it will
	 * start the {@link #doAutoFocus}.
	 * @private
	 */
	onAfterFirstLayout : function()
	{
		if (Ext.isDefined(this.field.tabEl)) {
			this.field.on('activate', this.onActivate, this);
		} else {
			// This field isn't a tab, but perhaps one of the child elements is...
			var tabs = this.field.findBy(function(cmp) { return Ext.isDefined(cmp.tabEl); });
			if (!Ext.isEmpty(tabs)) {
				for (var i = 0, len = tabs.length; i < len; i++) {
					this.field.mon(tabs[i], 'activate', this.onActivate, this);
				}
			}
		}
	},

	/**
	 * Event handler which is fired after the {@link #field} has been {@link Ext.Container#activate activated}.
	 * This will start the {@link #doAutoFocus}.
	 * @private
	 */
	onActivate : function()
	{
		// Apply a 1ms delay, otherwise we cannot detect which input field
		// is hidden or not.
		this.doAutoFocus.defer(1, this);
	},

	/**
	 * Called when either the {@link #beginFocusEl} or {@link #endFocusEl} has been focussed.
	 * This will start the {@link #doCyclicFocus}.
	 * @param {Ext.EventObject} event The event object
	 * @param {HTMLElement} element The element which was focussed
	 * @private
	 */
	onLimitFocussed : function(event, element)
	{
		this.doCyclicFocus(this.beginFocusEl.dom === element);
	},

	/**
	 * Event handler which is called when the {@link #field} is being destroyed.
	 * This will automatically destroy the {@link #beginFocusEl} and {@link #endFocusEl}.
	 * @private
	 */
	onDestroy : function()
	{
		Ext.destroy(this.beginFocusEl);
		Ext.destroy(this.endFocusEl);
	},

	/**
	 * Change the {@link #autoFocus} property and automatically
	 * have the focus {@link #doAutoFocus} updated to this component.
	 * @param {Mixed} autoFocus The replacement for the {@link #autoFocus} object
	 */
	setAutoFocus : function(autoFocus)
	{
		this.autoFocus = autoFocus;
		this.doAutoFocus();
	},

	/**
	 * Called by {@link #onAfterFirstLayout} and {@link #onActivate}. If {@link #autoFocus} has been
	 * provided, this will apply the focus to that component, otherwise it will search for the first
	 * {@link #isFocusElement focussable element} inside the {@link #field container} (and the sub-containers).
	 * @private
	 */
	doAutoFocus : function()
	{
		var focusCmp;

		if (this.autoFocus) {
			if (Ext.isString(this.autoFocus)) {
				// Perhaps the string is a property on our field
				focusCmp = this.field[this.autoFocus];
				if (!focusCmp) {
					// Perhaps the string is a xtype of a child component
					var children = this.field.findByType(this.autoFocus);
					if (!Ext.isEmpty(children)) {
						focusCmp = children[0];
					}
				}
				if (!focusCmp) {
					// Perhaps the string is an ID of the HTML element
					focusCmp = Ext.get(this.autoFocus);
				}
			} else if (Ext.isElement(this.autoFocus) || Ext.isFunction(this.autoFocus.focus)) {
				focusCmp = this.autoFocus;
			}
		} else {
			focusCmp = this.findFocusElement(this.field);
			// If no focus element was found, then lets try
			// if we can focus on a button instead.
			if (!focusCmp) {
				focusCmp = this.findFocusElement(this.field, false, true);
			}
		}

		if (focusCmp) {
			focusCmp.focus.defer(1, focusCmp);
			if(focusCmp.events['setAutoFocusCursor']){
				focusCmp.fireEvent('setAutoFocusCursor', focusCmp.getEditor());
			}
		}
	},

	/**
	 * Called when the {@link #beginFocusEl} or {@link #endFocusEl} elements have been focussed.
	 * This will apply a cycle to the focus, making sure the focus will not leave the {@link #field}
	 * in which this plugin is installed.
	 * @param {Boolean} inverse Search for the last focussable item in the container rather then
	 * the first.
	 * @private
	 */
	doCyclicFocus : function(inverse)
	{
		var focusCmp;

		focusCmp = this.findFocusElement(this.field, inverse, true);
		if (focusCmp) {
			focusCmp.focus.defer(1, focusCmp);
		}
	},

	/**
	 * Search through the given container to search for the first {@link #isFocusElement focussable element}
	 * inside the given container (and the sub-containers).
	 * @param {Ext.Container} container The container through which we must search to find the first
	 * focussable element
	 * @param {Boolean} inverse True to search for the last Focus Element
	 * @param {Boolean} allowButton Allow a button to be considered an focussable input element
	 * @return {Ext.Component} The focussable component which was found in this container
	 * @private
	 */
	findFocusElement : function(container, inverse, allowButton)
	{
		var objects = [];

		if (container.topToolbar) {
			objects = objects.concat(container.topToolbar.items.items);
		}
		if (container.items) {
			objects = objects.concat(container.items.items);
		}
		if (container.buttons) {
			objects = objects.concat(container.buttons);
		}

		if (inverse) {
			objects.reverse();
		}

		for (var i = 0, len = objects.length; i < len; i++) {
			var item = objects[i];
			var focus;

			if (this.isContainer(item)) {
				if (item.isVisible()) {
					focus = this.findFocusElement(item, inverse, allowButton);
				}
			} else if (this.isFocusElement(item, allowButton)) {
				focus = item;
			}

			if (focus) {
				return focus;
			}
		}
	},

	/**
	 * Check if the given {@link Ext.Component} is a container which contains items through which
	 * we can search for a {@link #isFocusElement focussable element}.
	 * @param {Ext.Component} item The component we are checking if it is a container
	 * @return {Boolean} True if the item is a container, false otherwise
	 * @private
	 */
	isContainer : function(item)
	{
		return (item instanceof Ext.Container || item instanceof Ext.form.CompositeField);
	},

	/**
	 * Check if the given {@link Ext.Component} is a visible input-element which can be focussed.
	 * This includes that the size of the component is non-0, the element itself is visible and
	 * not readonly input element.
	 * @param {Ext.Component} item The component we are checking
	 * @param {Boolean} allowButton Allow a button to be considered an focussable input element
	 * @return {Boolean} True if the item is focussable, false otherwise
	 */
	isFocusElement : function(item, allowButton)
	{
		var el = item.btnEl || item.el;

		if (!el) {
			return false;
		}

		var disallowedType = (allowButton === true) ? /submit|reset|hidden/i : /button|submit|reset|hidden/i;
		var allowedTagname = (allowButton === true) ? /button|input|textarea|select/i : /input|textarea|select/i;

		return (el.dom.style.height !== '0px' &&
				el.dom.style.width !== '0px' &&
				el.dom.style.display !== 'none' &&
				el.dom.style.visibility !== 'hidden' &&
				!el.dom.disabled &&
				!el.dom.getAttribute('readonly') &&
				!disallowedType.test(el.dom.type) &&
				allowedTagname.test(el.dom.tagName));
	},

	/**
	 * Call this when Ext.JS moves the focus to its own focus element a#x-dlg-focus (see source of {@link Ext.Window#render})
	 * Call {@link #doAutoFocus} to move focus to the first form field
	 */
	onDialogFocussed : function()
	{
		this.doAutoFocus();
	}
});

Ext.preg('zarafa.inputautofocusplugin', Zarafa.core.plugins.InputAutoFocusPlugin);
