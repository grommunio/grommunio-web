Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.PreviewPanel
 * @extends Ext.Panel
 * @xtype zarafa.previewpanel
 *
 * Panel that shows a preview of a {@link Zarafa.core.data.IPMRecord message}.
 */
Zarafa.core.ui.PreviewPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert previewpanel.toolbar.left
	 * Insertions point for inserting buttons in previewpane's toolbar on left side.
	 * @param {Zarafa.core.ui.PreviewPanel} panel This panel
	 * @param {Zarafa.core.ContextModel} model The contextmodel ({@link #model}).
	 */

	/**
	 * @insert previewpanel.toolbar.right
	 * Insertions point for inserting buttons in previewpane's toolbar on right side.
	 * @param {Zarafa.core.ui.PreviewPanel} panel This panel
	 * @param {Zarafa.core.ContextModel} model The contextmodel ({@link #model}).
	 */

	/**
	 * @cfg {Zarafa.core.ContextModel} model The model for which this
	 * PreviewPanel is being loaded.
	 */
	model : undefined,

	/**
	 * Reference to the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent} plugin
	 * which is used to send update events to all child {@link Ext.Container containers}
	 * in this container. This field is initialized by the
	 * {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent} itself.
	 *
	 * @property
	 * @type Zarafa.core.plugins.RecordComponentPlugin
	 */
	recordComponentPlugin : undefined,

	/**
	 * @cfg {Object} Configuration object which will be used
	 * to instantiate the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent}.
	 * See the plugin for the available configuration options.
	 */
	recordComponentPluginConfig : undefined,

	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record (See {@link Zarafa.core.plugins.RecordComponentPlugin#record}).
	 */
	record : undefined,

	/**
	 * @cfg {Boolean} isLoadMaskShown true if load mask should be shown else false.
	 */
	isLoadMaskShown : false,

	/**
	 * The LoadMask object which will be shown when the {@link #record} is being opened, and
	 * the dialog is waiting for the server to respond with the desired data. This will only
	 * be set if {@link #showLoadMask} is true.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout : 'fit',
			stateful : true,
			minWidth : 200,
			minHeight : 200,
			xtype : 'zarafa.previewpanel'
		});

		config.tbar = Ext.applyIf(config.tbar || {}, {
			cls: 'zarafa-previewpanel-toolbar',
			xtype : 'zarafa.toolbar',
			hidden : true,
			items : []
		});

		var tbarItems = [
			container.populateInsertionPoint('previewpanel.toolbar.left', this, config.model),
			{xtype: 'tbfill'},
			config.tbar.items, // Default items in toolbar should be right aligned.
			container.populateInsertionPoint('previewpanel.toolbar.right', {scope : this, model : config.model})
		];

		config.tbar.items = Ext.flatten(tbarItems);
		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push(Ext.applyIf(config.recordComponentPluginConfig || {}, {
			ptype: 'zarafa.recordcomponentplugin',
			useShadowStore : true,
			allowWrite : false
		}));

		config.plugins.push({
			ptype: 'zarafa.recordcomponentupdaterplugin'
		}, {
			ptype : 'zarafa.enablefocusplugin'
		});

		if (container.getSettingsModel().get('zarafa/v1/contexts/mail/readflag_time_enable') === true) {
			config.plugins.push({
				ptype: 'zarafa.markasreadplugin'
			});
		}

		Zarafa.core.ui.PreviewPanel.superclass.constructor.call(this, config);

		if (this.model) {
			this.mon(this.model, 'previewrecordchange', this.onPreviewRecordChange, this);
		}

		this.on({
			'beforeloadrecord' : this.onBeforeLoadRecord,
			'loadrecord' : this.onLoadRecord,
			'exceptionrecord' : this.onExceptionRecord,
			'show' : this.onPreviewPanelShow,
			'expand' : this.onPreviewPanelShow,
			'scope' : this
		});
	},

	/**
	 * Called when the ContentPanel has been rendered.
	 * This activate the keymap on the element of this component after the normal operations of
	 * afterRender have been completed. It will activate by getting the xtype hierarchy from
	 * {@link #getXTypes} and format it into a string usable by the
	 * {@link Zarafa.core.KeyMapMgr KeyMapMgr}.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.core.ui.PreviewPanel.superclass.afterRender.apply(this, arguments);
		var xtypes = this.getXTypes();

		// The first part leading up to zarafa.previewpanel will be stripped
		xtypes = xtypes.replace('component/box/container/panel/zarafa.previewpanel','');

		// Then the "zarafa." will be stripped off from start, the xtype like "zarafa.previewpanel".
		xtypes = xtypes.replace(/\/zarafa\./g,'.');

		// Finally we string the "previewpanel" from all the xtypes. Otherwise each level will have
		// that "previewpanel" mentioned in them. Also we add previewpanel to the start as that sets
		// it apart from other components in the key mapping.
		xtypes = 'previewpanel' + xtypes.replace(/previewpanel/g, '');

		// This will activate keymaps with 'previewpanel.mail' so the component
		// will have all key events register with 'previewpanel', 'mail'
		Zarafa.core.KeyMapMgr.activate(this, xtypes);
	},

	/**
	 * See {@link Zarafa.core.plugins.RecordComponentPlugin#setRecord}.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to set
	 */
	setRecord : function(record)
	{
		for (var i = 0; i < this.toolbars.length; i++) {
			this.toolbars[i].setVisible(!!record);
		}

		if (this.recordComponentPlugin) {
			this.recordComponentPlugin.setRecord(record);
		}
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
	},

	/**
	 * Function for 'previewrecordchange' and 'show' events before setting record into component
	 * @param {Zarafa.core.data.MAPIRecord} record
	 * @private
	 */
	showRecordInPanel : function(record)
	{
		var panelConstructor;

		// Record is already loaded...
		if (this.record === record) {
			return;
		}

		// Check if same record is loaded again
		if (this.record && record && this.record.equals(record)) {
			return;
		}

		if (Ext.isDefined(record)) {
			panelConstructor = container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.preview'], record);
			if (panelConstructor && this.get(0) instanceof panelConstructor) {
				if(this.isLoadMaskShown){
					this.hideLoadMask();
				}
				this.setRecord(record);
				return;
			}
		}

		// Do a complete refresh, clearing all UI components
		// which might be active inside the panel.
		this.removeAll();

		if (panelConstructor) {
			this.add(new panelConstructor());
		}

		this.setRecord(record);
		this.doLayout();
		this.hideLoadMask();
	},

	/**
	 * Removes all components from this container. Additionally this function will also remove all the items from
	 * {@link Ext.Toolbar toolbar} also.
	 * @param {Boolean} autoDestroy (optional) True to automatically invoke the removed Component's {@link Ext.Component#destroy} function.
	 * Defaults to the value of this Container's {@link #autoDestroy} config.
	 * @return {Array} Array of the destroyed components
	 */
	removeAll : function(autoDestroy)
	{
		// remove toolbar items first
		var destroyedItems = [];
		if(this.getTopToolbar()) {
			destroyedItems.concat(this.getTopToolbar().removeAll.apply(this, arguments));
		}

		if(this.getBottomToolbar()) {
			destroyedItems.concat(this.getBottomToolbar().removeAll.apply(this, arguments));
		}

		destroyedItems.concat(Zarafa.core.ui.PreviewPanel.superclass.removeAll.apply(this, arguments));

		return destroyedItems;
	},

	/**
	 * Event handler which is trigggerd when the {@link Zarafa.core.ContextModel ContextModel} receives a new
	 * record for previewing (it fired the {@link Zarafa.core.ContextModel#previewrecordchange previewrecordchange} event).
	 * This updates the {@link Ext.Container previewpanel} with the selected record to be previewed.
	 *
	 * @param {Zarafa.core.ContextModel} model The context model.
	 * @param {Ext.data.Record} record The record which is selected for preview.
	 * @private
	 */
	onPreviewRecordChange : function(contextModel, record)
	{
		// Load record in preview panel
		if(this.isVisible()) {
			this.showRecordInPanel(record);
		}
	},

	/**
	 * If {@link #showLoadMask} is enabled, this function will display
	 * the {@link #loadMask}.
	 * @param {Boolean} errorMask True to show an error mask instead of the loading mask.
	 * @protected
	 */
	showLoadMask : function(errorMask)
	{
		if (this.isLoadMaskShown === true) {
			return;
		}
		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.el);
		}

		if (errorMask) {
			this.loadMask.showError();
		} else {
			this.loadMask.show();
			this.isLoadMaskShown = true;
		}
	},

	/**
	 * If {@link #showLoadMask} is enabled, and {@link #showLoadMask} has been
	 * called to display the {@link #loadMask} this function will disable the
	 * loadMask.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.isLoadMaskShown === false) {
			return;
		}

		if (this.loadMask) {
			this.loadMask.hide();
			this.isLoadMaskShown = false;
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#beforeloadrecord beforeloadrecord} event.
	 * This will call the {@link #showLoadMask} function to show the loadmask.
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 */
	onBeforeLoadRecord : function(panel, record)
	{
		this.showLoadMask();
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#loadrecord loadrecord} event.
	 * This will call the {@link #hideLoadMask} function to hide the loadmask.
	 *
	 * @param {Ext.Container} panel The panel to which the record belongs
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 */
	onLoadRecord : function(panel, record)
	{
		this.hideLoadMask();
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#exceptionrecord} event.
	 * This will call {@link #showLoadMask} to update it with a new error message.
	 *
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
	 */
	onExceptionRecord : function(type, action, options, response, record)
	{
		this.showLoadMask(true);
	},

	/**
	 * Event handler which is fired when this panel has been set to visible. Fetches previewRecord from
	 * the {@link Zarafa.core.ContextModel ContextModel} and displays into panel.
	 */
	onPreviewPanelShow : function()
	{
		if (Ext.isDefined(this.model)) {
			var record = this.model.getPreviewRecord();
			if (Ext.isDefined(record)) {
				this.showRecordInPanel(record);
			}
		}
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
	 * a custom name.
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved.
	 */
	getStateName : function()
	{
		return 'preview/' + Zarafa.core.ui.PreviewPanel.superclass.getStateName.call(this);
	}
});
Ext.reg('zarafa.previewpanel', Zarafa.core.ui.PreviewPanel);
