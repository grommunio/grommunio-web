Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.RecordComponentUpdaterPlugin
 * @extends Object
 * @ptype zarafa.recordcomponentupdaterplugin
 *
 * This plugin is used on {@link Ext.Container Container} elements which
 * are placed as child (or grandchild) to a {@link Ext.Container Container} which
 * contains the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent} plugin.
 *
 * This plugin will hook into the {@link Zarafa.core.plugins.RecordComponentPlugin#setrecord setrecord}
 * {@link Zarafa.core.plugins.RecordComponentPlugin#updaterecord updaterecord} events and call
 * the {@link Ext.Container#update update} function with the {@link Ext.data.Record Record}
 * argument.
 */
Zarafa.core.plugins.RecordComponentUpdaterPlugin = Ext.extend(Object, {
	/**
	 * @cfg {Ext.Container} rootContainer (optional) The container on which
	 * the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent} plugin has been
	 * installed to which the container on which this plugin has been installed must
	 * listen to.
	 */
	rootContainer: undefined,
	/**
	 * The contained on which this plugin has been installed.
	 * @property
	 * @type Ext.Container
	 */
	field : undefined,
	/**
	 * True when the {@link #field} is {@link #onReadyComponent ready}.
	 * @property
	 * @type Boolean
	 */
	isReady : false,
	/**
	 * The record which is currently displayed in {@link #field}.
	 * @property
	 * @type Zarafa.core.data.IPMRecord
	 */
	record : undefined,
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
	 * @param {Ext.Component} The parent field to which this component is connected
	 */
	init : function(field)
	{
		this.field = field;
		field.recordComponentUpdaterPlugin = this;

		// Check if we already know our rootContainer.
		// If not, we have to wait for the 'added' event
		// to walk up the hierarchy tree to find a parent
		// which is the root container.
		if (this.rootContainer) {
			this.hookToRootContainer(this.rootContainer);
		} else if (field.rootContainer) {
			this.hookToRootContainer(field.rootContainer);
		} else {
			this.field.on('beforerender', this.onFirstBeforeRender, this, { single: true });
		}

		// If a layout is present on the component, then we must wait until the component
		// has been layed out. Otherwise rendering will be sufficient.
		if (Ext.isDefined(this.field.layout)) {
			this.field.on('afterlayout', this.onReadyComponent, this, { single : true });
		} else if (this.field.rendered !== true) {
			this.field.on('afterrender', this.onReadyComponent, this, { single : true });
		} else {
			this.onReadyComponent(this.field);
		}
	},

	/**
	 * This will set the {@link #rootContainer} for this plugin. The rootContainer is a
	 * {@link Ext.Container container} which has the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent}
	 * plugin installed.
	 *
	 * @param {Ext.Container} root The root container on which we must hook our events.
	 * @private
	 */
	hookToRootContainer : function(root)
	{
		this.rootContainer = root;

		// Obtain the record from the root container,
		// this prevents issues when the root container
		// has already been rendered and we have missed the
		// initial 'setrecord' event.
		this.record = root.recordComponentPlugin.getActiveRecord();

		this.field.mon(root, {
			'activate': this.onActivateRoot,
			'setrecord': this.onSetRecord,
			'loadrecord': this.onLoadRecord,
			'updaterecord': this.onUpdateRecord,
			'exceptionrecord': this.onExceptionRecord,
			'beforesaverecord': this.onBeforeSaveRecord,
			'beforesendrecord': this.onBeforeSendRecord,
			'beforeclose': this.onBeforeClose,
			'deactivate': this.onDeactivate,
			scope : this
		});
	},

	/**
	 * Event handler which is fired when the {@link #field} is being rendered
	 * When this happened, we start walking up the hierarchy tree to find the
	 * {@link #rootContainer} which contains the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent}
	 * from which we must listen for updates.
	 *
	 * @private
	 */
	onFirstBeforeRender : function()
	{
		var root = this.field;

		while (!(root.recordComponentPlugin instanceof Zarafa.core.plugins.RecordComponentPlugin)) {
			root = root.ownerCt;
			if (!Ext.isDefined(root)) {
				break;
			}
		}

		if (root) {
			this.hookToRootContainer(root);
		}
	},

	/**
	 * Called after the {@link #field component} has is ready for initialization by the plugin,
	 * depending on the type this can be on {@link Ext.Container#afterlayout} or {@link Ext.Component#afterrender}.
	 *
	 * This will load the current {@link Zarafa.core.data.IPMRecord Record} using
	 * the {@link Ext.Container#update} function.
	 *
	 * @param {Ext.Component} component This component
	 * @private
	 */
	onReadyComponent : function(component)
	{
		if (this.record) {
			this.field.update(this.record, true);
		}
		this.isReady = true;
	},

	/**
	 * Event handler which is fired for the {@link #rootContainer}#{@link Ext.Panel#activate activate}
	 * event. This will call the {@link Ext.Container#update} function to update the
	 * {@link #field} to which this plugin is attached. This ensures that any changes
	 * in data or UI which have occurred while the tab was deactivated are being forced
	 * into the UI again.
	 * @param {Ext.Panel} panel The panel which was activated
	 * @private
	 */
	onActivateRoot : function(panel)
	{
		if (this.record && this.isReady === true && this.field.isDestroyed !== true) {
			this.field.update(this.record, true);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#setrecord setrecord} event.
	 * This will call the {@link Ext.Container#update update} function
	 * to update the {@link #field} to which this plugin is attached.
	 *
	 * @param {Ext.Container} panel The panel to which the record was set
	 * @param {Zarafa.core.data.IPMRecord} record The record which was set
	 * @param {Zarafa.core.data.IPMRecord} oldrecord The oldrecord which was previously set
	 * @private
	 */
	onSetRecord : function(panel, record, oldrecord)
	{
		this.record = record;
		if (this.isReady === true) {
			this.field.update(record, true);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#loadrecord loadrecord} event.
	 * This will call the {@link Ext.Container#update update} function
	 * to update the {@link #field} to which this plugin is attached
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 */
	onLoadRecord : function(panel, record)
	{
		if (this.isReady === true && this.field.isDestroyed !== true) {
			this.field.update(record, true);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#updaterecord updaterecord} event.
	 * This will call the {@link Ext.Container#update update} function
	 * to update the {@link #field} to which this plugin is attached
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs
	 * @param {String} action write Action that ocurred. Can be one of
	 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
	 * {@link Ext.data.Record.COMMIT COMMIT}
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 */
	onUpdateRecord : function(panel, action, record)
	{
		if (this.isReady === true && this.field.isDestroyed !== true) {
			this.field.update(record, false);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#exceptionrecord exceptionrecord} event.
	 * This will call the {@link Ext.Container#doException doException} function if it is available.
	 * to update the {@link #field} to which this plugin is attached
	 * @param {String} type See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {String} action See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} options See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} response See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was subject of the request
	 * that encountered an exception.
	 * @param {String} error (Optional) Passed when a thrown JS Exception or JS Error is
	 * available.
	 * @private
	 */
	onExceptionRecord : function(type, action, options, response, record, error)
	{
		if (this.isReady === true && this.field.isDestroyed !== true) {
			if (Ext.isFunction(this.field.doException)){
				this.field.doException(type, action, options, response, record, error);
			}
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#beforesave beforesave} event.
	 * This will call the 'updateRecord' function to update the {@link #record} based on the
	 * information from the {@link #field}.
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs.
	 * @param {Zarafa.core.data.IPMRecord} record The record which is being saved.
	 * @return {Boolean} false if the operation failed, and the save action must be aborted.
	 * @private
	 */
	onBeforeSaveRecord : function(panel, record)
	{
		if (this.isReady === true && this.field.isDestroyed !== true) {
			if (Ext.isFunction(this.field.updateRecord)) {
				return this.field.updateRecord(record);
			}
		}
		return true;
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#beforesendrecord beforesendrecord} event.
	 * This will call the 'updateRecord' function to update the {@link #record} based on the
	 * information from the {@link #field}.
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs.
	 * @param {Zarafa.core.data.IPMRecord} record The record which is being saved.
	 * @return {Boolean} false if the operation failed, and the save action must be aborted.
	 * @private
	 */
	onBeforeSendRecord : function(panel, record)
	{
		if (this.isReady === true && this.field.isDestroyed !== true) {
			if (Ext.isFunction(this.field.updateRecord)) {
				return this.field.updateRecord(record);
			}
		}
		return true;
	},

	/**
	 * Event handler for the {@link Ext.Container#beforeclose} event.
	 * This will call the 'updateRecord' function to update the {@link #record} based on the
	 * information from the {@link #field}.
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs.
	 * @private
	 */
	onBeforeClose : function(panel)
	{
		if (this.isReady === true && this.field.isDestroyed !== true) {
			if (this.record && Ext.isFunction(this.field.updateRecord)) {
				return this.field.updateRecord(this.record);
			}
		}
		return true;
	},

	/**
	 * Event handler for the {@link Ext.Panel#deactivate} event.
	 * This will call the 'updateRecord' function to update the {@link #record} based on the
	 * information from the {@link #field}.
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs.
	 * @private
	 */
	onDeactivate : function(panel)
	{
		if (this.isReady === true && this.field.isDestroyed !== true) {
			if (this.record && Ext.isFunction(this.field.updateRecord)) {
				return this.field.updateRecord(this.record);
			}
		}
		return true;
	}
});

Ext.preg('zarafa.recordcomponentupdaterplugin', Zarafa.core.plugins.RecordComponentUpdaterPlugin);
