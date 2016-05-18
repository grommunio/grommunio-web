Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.AbstractQuickItemWidget
 * @extends Zarafa.core.ui.widget.Widget
 *
 * Widget which can be used to quickly create a MAPI item.
 * This can be used to quickly create a mail, task, appointment,
 * sticky note, while using a minimum set of input fields.
 */
Zarafa.widgets.quickitems.AbstractQuickItemWidget = Ext.extend(Zarafa.core.ui.widget.Widget, {
	/**
	 * The record as created by {@link #createRecord} which is currently
	 * loaded in the widget.
	 * @property
	 * @type Ext.data.Record
	 * @protected
	 */
	record : undefined,

	/**
	 * @cfg {Object} Configuration object for the instantiation of the
	 * {@link Zarafa.core.ui.MessageContentPanel} in the {@link #wrap} property.
	 */
	wrapCfg : undefined,

	/**
	 * The embedded {@link Zarafa.core.ui.MessageContentPanel} which handles
	 * the sending/saving of the {@link #record}.
	 * @property
	 * @type Zarafa.core.ui.MessageContentPanel
	 * @protected
	 */
	wrap : undefined,

	/**
	 * @cfg {Boolean} resetOnSave {@link #reset} the widget when client recieves confirmation of message is saved.
	 */
	resetOnSave : true,

	/**
	 * @cfg {Boolean} resetOnSend {@link #reset} the widget when client recieves confirmation of message is sent.
	 */
	resetOnSend : true,

	/**
	 * @cfg {Boolean} hasDialog True if a {@link #tools} button should be added for opening the record
	 * inside a dialog (See {@link #dialog}).
	 */
	hasDialog : true,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.wrapCfg = Ext.applyIf(config.wrapCfg || {}, {
			stateful : false,
			height : 200,
			closeOnSave : false,
			closeOnSend : false
		});

		config.wrapCfg.recordComponentPluginConfig = Ext.applyIf(config.wrapCfg.recordComponentPluginConfig || {}, {
			useShadowStore : false // We put the record into the shadowstore ourselves.
		});

		this.wrap = new Zarafa.core.ui.MessageContentPanel(config.wrapCfg);
		// The wrap will have the recordcomponentupdater plugin installed,
		// we hack the 'update' and 'updateRecord' functions to this widget
		// to ensure the widget can update itself.
		this.wrap.update = this.update.createDelegate(this);
		this.wrap.updateRecord = this.updateRecord.createDelegate(this);

		Ext.applyIf(config, {
			name : 'quickitem',
			layout : 'fit',
			items : [this.wrap]
		});

		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the widget, this will add the 'plus' button to the {@link #tools}
	 * which can open the record in a new content panel.
	 * @protected
	 */
	initWidget : function()
	{
		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.initWidget.apply(this, arguments);

		if (this.hasDialog) {
			this.tools.unshift({
				id : 'plus',
				handler : this.dialog,
				scope : this
			});
		}
	},

	/**
	 * Initialize the events
	 * @protected
	 */
	initEvents : function()
	{
		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.initEvents.apply(this, arguments);

		this.mon(this, 'afterlayout', this.onAfterFirstLayout, this, { single : true });

		if (this.resetOnSave) {
			// Defer to ensure the all 'aftersaverecord' event handlers have completed
			// before we reset the content of the widget.
			this.mon(this.wrap, 'aftersaverecord', this.reset, this, { buffer : 1 });
		}
		if (this.resetOnSend) {
			// Defer to ensure the all 'aftersendrecord' event handlers have completed
			// before we reset the content of the widget.
			this.mon(this.wrap, 'aftersendrecord', this.reset, this, { buffer : 1 });
		}
	},

	/**
	 * Abandon editing of the record inside the widget and continue editing by
	 * {@link Zarafa.core.data.UIFactory#openCreateRecord opening it in a new dialog}.
	 * Afterwards it will {@link #reset} this widget.
	 * @private
	 */
	dialog : function()
	{
		this.wrap.inputAutoFocusPlugin.beginFocusEl.focus();
		this.wrap.saveRecord(false);
		Zarafa.core.data.UIFactory.openCreateRecord(this.record);

		// The record is now owned by the dialog, so clear our reference.
		this.record = null;
		this.reset();
	},

	/**
	 * This will {@link #createRecord create a new} {@link #record} and will
	 * {@link Zarafa.core.ui.MessageContentPanel#setRecord set it} to the {@link #wrap}.
	 * protected
	 */
	reset : function()
	{
		var store = container.getShadowStore();

		// Remove the old record from the Shadow Store
		if (this.record) {
			store.remove(this.record, true);
		}

		// Create a new record, put it into the shadowStore
		this.record = this.createRecord();
		store.add(this.record);

		// Load the record
		this.wrap.setRecord(this.record);
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * Subclasses must implement this function.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : Ext.emptyFn,

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 * Subclasses must implement this function.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : Ext.emptyFn,

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 * Subclasses must implement this function.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : Ext.emptyFn,

	/**
	 * Event handler which is fired for the first {@link #afterlayout} event.
	 * This will check if the {@link Zarafa.core.Container#getHierarchyStore hierarchy}
	 * has been loaded already, or if we need to wait a bit more. When the hierarchy is
	 * loaded the widget will be {@link #reset}.
	 * @private
	 */
	onAfterFirstLayout : function()
	{
		var hierarchy = container.getHierarchyStore();
		if (!hierarchy.getDefaultStore()) {
			this.mon(hierarchy, 'load', this.reset, this, { single : true });
		} else {
			this.reset();
		}
	},

	/**
	 * Called when the widget is being destroyed. If a {@link #record} is still
	 * active, this will {@link Zarafa.core.data.ShadowStore#remove remove} the
	 * {@link #record} from the {@link Zarafa.core.data.ShadowStore ShadowStore}.
	 * @protected
	 */
	onDestroy : function()
	{
		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.onDestroy.apply(this, arguments);

		if (this.record) {
			container.getShadowStore().remove(this.record, true);
		}
	}
});
