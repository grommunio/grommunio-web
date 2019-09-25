Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.EnableFocusPlugin
 * @extends Object
 * @ptype zarafa.enablefocusplugin
 *
 * Normally div elements or span elements are not able to listen keyboard events because they
 * are non focusable elements,
 * So this plugin will add anchor element under the component's element, Which will get focus
 * when user clicks on the field, and anchor field will listen key events and will relay it to
 * parent component.
 * Adding this plugin to {@link Ext.Container} will intercept {@link Ext.Container#focus} event and
 * do focus handling itself.
 */
Zarafa.core.plugins.EnableFocusPlugin = Ext.extend(Object, {
	/**
	 * We are creating this element as anchor element, div elements can't get focus so we won't be able to
	 * handle keyboard in the panel, so when panel gets clicked we will set focus on this anchor element,
	 * to get keyboard events.
	 * @property
	 * @type Ext.Element
	 */
	focusEl : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.Component} field The component on which the plugin is installed
	 */
	init : function(field)
	{
		this.field = field;
		field.enableFocusPlugin = this;

		// override focus method of field to our own implementation
		// so focusing field should also transfer focus to the focusEl
		// and we can just ignore handling of focus in field
		this.field.focus = this.field.focus.createInterceptor(this.focus, this);

		this.field.on('render', this.onRender, this);
	},

	/**
	 * Function will intercept focus of the {@link Ext.Component Component} and will set it to
	 * {@link #focusEl} so we can listen for the key events and do keyboard handling.
	 * This function will return boolean value to indicate that intercepted function should be called or not,
	 * If the plugin is able to focus then it will return false and field's focus method will not be called
	 * and if plugin is not able to do focus then it will return true so field's focus method will be called.
	 * This return value is only used when this function is called as interceptor function.
	 * @private
	 */
	focus : function()
	{
		if(this.field.rendered && !this.field.isDestroyed) {
			if(this.focusEl) {
				// Creating a selection will also be seen as a click (because it is), but
				// Firefox will drop the current selection when we set the focus to the focusEl.
				// Fortunately FireFox has implemented most of the Selection api. So we can get
				// the current selection and put it back after we focus the focusEl.
				var selection = this.field.getEl().dom.ownerDocument.getSelection();
				var ranges = [];
				// Get all selection ranges
				if ( selection && selection.isCollapsed===false && selection.getRangeAt && selection.addRange ){
					for ( var i=0; i<selection.rangeCount; i++ ){
						ranges.push(selection.getRangeAt(i));
					}
				}

				this.focusEl.focus();

				// Add all ranges to the selection again
				Ext.each(ranges, function(range){
					selection.addRange(range);
				});

				// we have handled focus here so don't allow intercepted function to do its handling
				return false;
			}
		}

		// intercepted function will do its default handling
		return true;
	},

	/**
	 * Event handler for the {@link Ext.Component#render render} event
	 * on the {@link #field}. This will add anchor element under the component's element.
	 * This will add a mouse-click listener on field when it is clicked it will set focus
	 * on {@link #focusEl}, so once focus is set on {@link #focusEl} keyboard events can be
	 * listened by the components which register this plugin.
	 */
	onRender : function()
	{
		if(this.field) {
			var element = this.field.getEl();

			// this element allows the panel to be focused for keyboard events
			this.focusEl = element.createChild({
				tag : 'a',
				href : '#',
				// Disable tab-index, and position it somewhere where it cannot be seen
				// by the user. This will make the element completely invisible for the
				// user while we can benefit from the focus capabilities.
				tabindex : -1,
				style : 'position: absolute; left:-10000px; top:-10000px;'
			});

			this.focusEl.swallowEvent('click', true);

			this.field.mon(element, {
				click : this.onFieldClick,
				scope : this
			});
		}
	},

	/**
	 * Event handler which is fired when user clicks anywhere on panel,
	 * this will set the focus on {@link #focusEl} so that keyboard events can be fired on the component.
	 * @param {Ext.EventObject} eventObj The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} element The target of the event.
	 * @param {Object} opt The options configuration passed to the event call.
	 * @private
	 */
	onFieldClick : function(eventObj, element, opt)
	{
		var focusedElement = Ext.get(document.activeElement);
		var clickedElement = Ext.get(element);

		/*
		 * Here we need to handle Keyevents that are fired on this component so we
		 * need to set focus on this element, now if any of the sub-component
		 * already has focus then we don't need to set focus on this component,
		 * as Keyevents will be propagated to this component, So here we are checking
		 * that whether user has clicked on any input field e.g. textfield, or focus
		 * is set on any sub-component.
		 */
		if(focusedElement != clickedElement) {
			var fieldEl = this.field.getEl();

			if(!fieldEl.contains(focusedElement)) {
				this.focus();
			}
		}
	}
});

Ext.preg('zarafa.enablefocusplugin', Zarafa.core.plugins.EnableFocusPlugin);
