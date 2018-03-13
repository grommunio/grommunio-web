Ext.namespace('Zarafa.common.recipientfield.ui');

/**
 * @class Zarafa.common.recipientfield.ui.RecipientHoverCardButton
 * @extends Ext.Button
 * The base class for all button that render into {@link Zarafa.common.recipientfield.ui.RecipientHoverCard}.
 * RecipientHoverCardButton provides click event handler and hide parent card view
 * @xtype zarafa.recipienthovercardbutton
 */
Zarafa.common.recipientfield.ui.RecipientHoverCardButton = Ext.extend(Ext.Button, {

	/**
	 * @cfg {Number} clickHideDelay delay time in millisecond to hide parent card after click on button.
	 */
	clickHideDelay: 1,

	/**
	 * @cfg {Zarafa.common.recipientfield.ui.RecipientHoverCard} parentCard parent card view component.
	 */
	parentCard: undefined,

	/**
	 * @cfg {Object} clickHideDelayTimer contain defer time out object.
	 */
	clickHideDelayTimer : undefined,


	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			cls: 'k-recipient-hover-card-button zarafa-normal'
		});

		Zarafa.common.recipientfield.ui.RecipientHoverCardButton.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the component.
	 * It will register click event with given handler in config.
	 * @private
	 */
	initComponent: function ()
	{
		Zarafa.common.recipientfield.ui.RecipientHoverCardButton.superclass.initComponent.call(this);

		if (this.handler) {
			this.on("click", this.handler, this.scope);
		}
	},

	/**
	 * Function called during the {@link #render rendering} of this component.
	 * This will get parent card view component
	 * @param {Ext.Container} container The container in which the component is being rendered.
	 * @param {NUmber} position The position within the container where the component will be rendered.
	 * @private
	 */
	onRender: function (container, position)
	{
		Zarafa.common.recipientfield.ui.RecipientHoverCardButton.superclass.onRender.apply(this, arguments);
		var parentCard = this.findParentByType('zarafa.recipienthovercardview');
		if (parentCard) {
			this.parentCard = parentCard;
		}
	},

	/**
	 * Sets the function that will handle click events for this item (equivalent to passing in the {@link #handler}
	 * config property).  If an existing handler is already registered, it will be unregistered for you.
	 * @param {Function} handler The function that should be called on click
	 * @param {Object} scope The scope (<code>this</code> reference) in which the handler function is executed. Defaults to this menu item.
	 */
	setHandler: function (handler, scope)
	{
		if (this.handler) {
			this.un("click", this.handler, this.scope);
		}
		this.on("click", this.handler = handler, this.scope = scope);
	},

	/**
	 * Event handler handel click event it will fire click event of item and then
	 * call {@link #handelClick} to hide parent card view.
	 * @param e
	 */
	onClick: function (e)
	{
		if (!this.disabled && this.fireEvent("click", this, e) !== false) {
			this.handleClick(e);
		} else {
			e.stopEvent();
		}
	},

	/**
	 * Function which is set defer to hide parent card view.
	 */
	handleClick: function ()
	{
		this.clickHideDelayTimer = this.parentCard.hide.defer(this.clickHideDelay, this.parentCard, [true]);
	},

	/**
	 * Override to clear defer time out {@link #clickHideDelayTimer}
	 */
	beforeDestroy: function ()
	{
		clearTimeout(this.clickHideDelayTimer);
		Zarafa.common.recipientfield.ui.RecipientHoverCardButton.superclass.beforeDestroy.call(this);
	},

	/**
	 * @return {Ext.data.Record} record which was registered in {@link Zarafa.common.recipientfield.ui.RecipientHoverCard}.
	 */
	getRecords: function ()
	{
		return this.parentCard.records;
	}
});
Ext.reg('zarafa.recipienthovercardbutton', Zarafa.common.recipientfield.ui.RecipientHoverCardButton);