Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.Box
 * @extends Ext.BoxComponent
 * @xtype zarafa.box
 *
 * The Box which is used by {@link Zarafa.common.ui.BoxField} components
 * to display the boxes inside itself. This box is dediciated to the BoxField
 * and cannot be used seperately.
 */
Zarafa.common.ui.Box = Ext.extend(Ext.BoxComponent, {
	/**
	 * @cfg {Ext.data.Record} record The record which is bound to this box.
	 */
	record : undefined,

	/**
	 * @cfg {Zarafa.common.ui.BoxField} parent The boxfield
	 * in which this box is being displayed.
	 */
	parent: undefined,

	/**
	 * The {@link Ext.Element} which contains the icon for this box,
	 * this will is filled during the {@link #updateIcons} function.
	 * @property
	 * @type Ext.Element
	 */
	iconEl : undefined,

	/**
	 * The {@link Ext.Element} which contains the text contents for this box,
	 * this is filled with the {@link #textTpl} template.
	 * @property
	 * @type Ext.Element
	 */
	textEl : undefined,

	/**
	 * The {@link Ext.Element} which contains the delete button for this box.
	 * @property
	 * @type Ext.Element
	 */
	delBtnEl : undefined,

	/**
	 * @cfg {Boolean} editable False when none of the buttons or user actions is
	 * allowed to change the record inside this box.
	 */
	editable : true,

	/**
	 * @cfg {Boolean} enableButtons True if {@link #renderButtons} should be called
	 * which will create the buttons inside the box.
	 */
	enableButtons : true,

	/**
	 * @cfg {Boolean} enableIcons True if {@link #renderIcons} should be called
	 * which will create the icon inside the box.
	 */
	enableIcons : true,

	/**
	 * @cfg {String} hoverCls The CSS class which will be applied to {@link #el} when
	 * the cursor is hovering over this component.
	 */
	hoverCls : 'x-zarafa-boxfield-item-hover',

	/**
	 * @cfg {String} focusCls The CSS class which will be applied to {@link #el} when
	 * the component has been selected.
	 */
	focusCls : 'x-zarafa-boxfield-item-focus',

	/**
	 * @cfg {String} textCls The CSS class which will be applied to the {@link #textEl} when
	 * the component is rendered.
	 */
	textCls : 'x-zarafa-boxfield-item-text',

	/**
	 * @cfg {String} iconCls The CSS class which will be applied to the {@link #iconEl} when
	 * the component is rendered.
	 */
	iconCls : 'x-zarafa-boxfield-item-icon',

	/**
	 * @cfg {String} btnCls The CSS class which will be applied to the {@link #btnEl} when
	 * the component is rendered.
	 */
	btnCls : 'x-zarafa-boxfield-item-close',

	/**
	 * @cfg {String} btnHoverCls The CSS class which will be applied to the {@link #btnEl} when
	 * the cursor is hovering over the button.
	 */
	btnHoverCls : 'x-zarafa-boxfield-item-close-hover',

	/**
	 * @cfg {String/Ext.XTemplate} textTpl <b>Required.</b> The template or template string
	 * which must be applied to the {@link #textEl inner span} of the box.
	 * The template arguments are have been returned by {@link #collectData}.
	 */
	textTpl : undefined,

	/**
	 * Similar to {@link #isDestroying} only this is only set when
	 * {@link #doDestroy} has been called with animation enabled.
	 * Because of the animation, the actual {@link #isDestroying}
	 * will be set a bit later. During this period we should still block
	 * all events.
	 * @property
	 * @type Boolean
	 */
	isAnimDestroying : false,

	/**
	 * @cfg {Boolean} enableTextSelection Enable text selection in the {@link #el},
	 * this will prevent {@link Ext.Element#unselectable} to be called on {@link #el}.
	 */
	enableTextSelection : false,

	/**
	 * @cfg {Number} maximum length of text allowed before truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringStartLength : 30,

	/**
	 * @cfg {Number} maximum length of text allowed after truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringEndLength : 30,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			autoEl : {
				tag: 'li',
				cls: 'x-zarafa-boxfield-item'
			}
		});

		Zarafa.common.ui.Box.superclass.constructor.call(this, config);

		if (Ext.isString(this.textTpl)) {
			this.textTpl = new Ext.XTemplate(this.textTpl, {
				compiled : true,
				ellipsisStringStartLength : this.ellipsisStringStartLength,
				ellipsisStringEndLength : this.ellipsisStringEndLength
			});
		}
	},

	/**
	 * Function called during the {@link #render rendering} of this component. This
	 * will call {@link #renderBox} and {@link #renderButtons} to generate the two
	 * basic elements of which the box consists of.
	 * @param {Ext.Container} ct The container in which the component is being rendered.
	 * @param {NUmber} position The position within the container where the component will be rendered.
	 * @private
	 */
	onRender : function(ct, position)
	{
		Zarafa.common.ui.Box.superclass.onRender.call(this, ct, position);

		if (this.enableTextSelection !== true) {
			this.el.unselectable();
		}

		if (this.enableIcons === true) {
			this.renderIcons();
		}

		this.renderBox();

		if (this.enableButtons === true) {
			this.renderButtons();
		}

		if (Ext.isDefined(this.record)) {
			this.update(this.record);
		}

		this.el.addClassOnOver(this.hoverCls);

		this.mon(this.el, 'click', this.onClick, this);
		this.mon(this.el, 'contextmenu', this.onContextMenu, this);
		this.mon(this.el, 'dblclick', this.onDblClick, this);
	},

	/**
	 * Function called after the {@link #render rendering} of this component.
	 * This will hide the {@link #delBtnEl} when the {@link #editable} flag is false
	 * @param {Ext.Container} ct The container in which the component is being rendered.
	 * @private.
	 */
	afterRender : function(ct)
	{
		Zarafa.common.ui.Box.superclass.afterRender.call(this, ct);
		this.delBtnEl.setVisible(this.editable);
	},
	
	/**
	 * Set the {@link #editable} flag, making the box non-editable.
	 * @param {Boolean} value The new editable status.
	 */
	setEditable : function(value)
	{
		if (this.editable !== value) {
			this.editable = value;
			this.delBtnEl.setVisible(this.editable);
		}
	},

	/**
	 * Renders the {@link #iconEl} into the main {@link #el} element.
	 * This element will be used to render the icon into the box. This function
	 * will only be called when {@link #enableIcons} is true.
	 * @private
	 */
	renderIcons : function()
	{
		this.iconEl = this.el.createChild({
			tag : 'span',
			cls : this.iconCls
		});
	},

	/**
	 * Renders the {@link #textEl} into the main {@link #el} element.
	 * This element will contain the actual contents which is being updated
	 * during {@link #update}.
	 * @Private
	 */
	renderBox : function()
	{
		this.textEl = this.el.createChild({
			tag : 'span',
			cls : this.textCls
		});
	},

	/**
	 * Setup the buttons of the box. This will be done after the template is done rendering. At that
	 * point we can start adding event listeners to the DOM elements. This function will only be
	 * called when {@link #enableButtons} is true.
	 * @private
	 */
	renderButtons: function()
	{
		this.renderRemoveButton();
	},

	/** 
	 * Sets event listeners on the remove button of the box. This is done in a separate function 
	 * than in {@link #initButtons initButtons} so it can easily be overwritten if needed.
	 * @private
	 */
	renderRemoveButton: function()
	{
		this.delBtnEl = this.el.createChild({
			tag : 'span',
			cls : this.btnCls
		});

		this.delBtnEl.addClassOnOver(this.btnHoverCls);
		this.mon(this.delBtnEl, 'click', this.onClickRemove, this);
	},

	/**
	 * Enables the focus on this component.
	 */
	focus: function()
	{
		Zarafa.common.ui.Box.superclass.focus.call(this);
		this.el.addClass(this.focusCls);
		this.parent.doBoxFocus(this);
	},

	/**
	 * Removes the focus on this component.
	 */
	blur: function()
	{
		Zarafa.common.ui.Box.superclass.blur.call(this);
		this.el.removeClass(this.focusCls);
		this.parent.doBoxBlur(this);
	},

	/**
	 * @return {Boolean} Returns true if this box currently has focus.
	 */
	hasFocus : function()
	{
		return this.el.hasClass(this.focusCls);
	},

	/**
	 * Called when the user has clicked on the remove button.
	 * @private
	 */
	onClickRemove: function()
	{
		if (!this.isAnimDestroying && !this.isDestroying) {
			// Set focus on parent element.
			this.parent.focus();
			this.parent.doBoxRemove(this);
		}
	},

	/**
	 * Called when the user has clicked on the element.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onClick: function(e)
	{
		e.stopEvent();
		if (!this.isAnimDestroying && !this.isDestroying) {
			this.parent.doBoxClick(this);
		}
	},

	/**
	 * Called when the user requested the contextmenu of the element.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onContextMenu : function(e)
	{
		e.stopEvent();
		if (!this.isAnimDestroying && !this.isDestroying) {
			this.parent.doBoxContextMenu(this);
		}
	},

	/**
	 * Called when the user has doubleclicked on the element.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onDblClick : function(e)
	{
		e.stopEvent();
		if (!this.isAnimDestroying && !this.isDestroying) {
			this.parent.doBoxDblClick(this);
		}
	},

	/**
	 * Function which can be overriden to provide custom formatting for the given {@link Ext.data.Record}
	 * to the {@link #update} function. The data object returned here is used by the {@link #textTpl template}
	 * to render the contents of the box.
	 * @param {Ext.data.Record} record The record which is going to be rendered
	 * @return {Object} The data object which can be passed to {@link #textTpl}.
	 * @private
	 */
	prepareData: function(record)
	{
		return record.data;
	},

	/**
	 * Function which can be overriden to provide custom icon rendering for the given {@link Ext.data.Record}
	 * to the {@link #iconEl} element. The string returned here is the CSS class which will be set on the
	 * {@link #iconEl}.
	 * @param {Ext.data.Record} record The record which is going to be rendered
	 * @return {String} The CSS class which must be applied to the {@link #iconEl}.
	 * @private
	 */
	prepareIcon : function(record)
	{
		return Zarafa.common.ui.IconClass.getIconClass(record);
	},

	/**
	 * Update the {@link #textEl inner HTML} of this component using the {@link #textTpl template}.
	 * @param {Ext.data.Record} record The Ext.data.Record which data must be applied to the template
	 */
	update: function(record)
	{
		this.textTpl.overwrite(this.textEl, this.prepareData(record));

		if (this.enableIcons === true) {
			var icon_class = this.prepareIcon(record);
			if (!Ext.isEmpty(icon_class)) {
				this.iconEl.addClass(icon_class);
			}
		}
		
		this.parent.sizeContainer();
	},

	/**
	 * Event handler which is fired when the box is being resized. This will determine
	 * what the desired with of the text should be, to ensure that the buttons (if available)
	 * will be positioned completely at the right.
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 * @private
	 */
	onResize : function(adjWidth, adjHeight, rawWidth, rawHeight)
	{
		if (Ext.isNumber(rawWidth)) {
			if (!Ext.isNumber(adjWidth)) {
				adjWidth = rawWidth;
			}
			adjWidth -= (this.el.getMargins('lr') +
						 this.iconEl.getWidth() + this.iconEl.getFrameWidth('lr') + this.iconEl.getMargins('lr') +
						 this.delBtnEl.getWidth() + this.delBtnEl.getFrameWidth('lr') + this.delBtnEl.getMargins('lr') +
						 this.getResizeEl().getFrameWidth('lr') + this.getResizeEl().getMargins('lr'));

			// Adjust the text width according to expand button as well, if it is defined.
			if(Ext.isDefined(this.expandBtnEl)){
				adjWidth -= (this.expandBtnEl.getWidth() + this.expandBtnEl.getFrameWidth('lr') + this.expandBtnEl.getMargins('lr'));
			}

			this.textEl.setWidth(adjWidth);
		}
	},

	/**
	 * Wrapper around the {@link #destroy} function which supports
	 * the animating of the event.
	 *
	 * @param {Boolean} animate True to enable the animation of the
	 * box removal.
	 */
	doDestroy : function(animate)
	{
		if (animate === true) {
			this.isAnimDestroying = true;
			this.getEl().hide({
				duration: 0.2,
				callback: function() { 
					this.destroy();
					this.parent.sizeContainer();
				},
				scope: this
			});
		} else {
			this.destroy();
			this.parent.sizeContainer();
		}
	}
});

Ext.reg('zarafa.box', Zarafa.common.ui.Box);
