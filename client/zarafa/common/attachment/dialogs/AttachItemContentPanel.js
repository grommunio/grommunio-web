Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.AttachItemContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.attachitemcontentpanel
 *
 * This content panel will be used to show hierarchy and a grid to select messages, selected messages
 * can be added to message as an embedded attachment.
 */
Zarafa.common.attachment.dialogs.AttachItemContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * The MAPIFolder which was selected the last time this panel was opened.
	 * This is used when {@link #stateful} is enabled.
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 */
	last_selected_folder : undefined,

	/**
	 * The Radio item which was selected the last time this panel was opened.
	 * This is used when {@link #stateful} is enabled.
	 * @property
	 * @type String
	 */
	last_selected_radio : undefined,

	/**
	 * @cfg {Zarafa.core.data.MAPIRecord} record record in which we will add embedded attachment if user is adding it as attachment.
	 */
	record : undefined,

	/**
	 * @cfg {Zarafa.common.ui.EditorField} editor editor in which we will be adding message as text if user has selected to add text in body.
	 */
	editor : undefined,

	/**
	 * The LoadMask object which will be shown when the {@link #record} is being opened, and
	 * the dialog is waiting for the server to respond with the desired data. This will only
	 * be set if {@link #loadMask} is undefined.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Insert item'),
			layout : 'fit',
			items : [{
				xtype : 'zarafa.attachitempanel',
				record : config.record,
				editor : config.editor
			}]
		});

		Zarafa.common.attachment.dialogs.AttachItemContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Obtain the {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} which should be selected by
	 * default. This will use {@link #last_selected_folder} if provided, otherwise will default inbox folder from
	 * {@link Zarafa.core.Container#getHierarchyStore hierarchy}.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The default selected folder
	 */
	getSelectedFolder : function()
	{
		if(!this.last_selected_folder) {
			var hierarchy = container.getHierarchyStore();
			this.last_selected_folder = hierarchy.getDefaultFolder('inbox');
		}

		return this.last_selected_folder;
	},

	/**
	 * Obtain the radio group item inputValue which should be selected by default.
	 * This will use {@link #last_selected_radio} if provided, otherwise will default to 'attachment'.
	 * @return {String} The default selected radio item
	 */
	getSelectedRadioItem : function()
	{
		if(!this.last_selected_radio) {
			this.last_selected_radio = 'attachment';
		}

		return this.last_selected_radio;
	},

	/**
	 * Mark the given folder as selected, this will update {@link #last_selected_folder}
	 * and will call {@link #saveState} if this panel is {@link #stateful}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 */
	setFolderInState : function(folder)
	{
		this.last_selected_folder = folder;
		if(this.stateful !== false) {
			this.saveState();
		}
	},

	/**
	 * Mark the given radio item as selected, this will update {@link #last_selected_radio}
	 * and will call {@link #saveState} if this panel is {@link #stateful}.
	 * @param {Ext.form.Radio} radioItem The selected radio item
	 */
	setRadioItemInState : function(radioItem)
	{
		// don't save radio selection in state settings, we are unsure we should have state setting for this
		this.last_selected_radio = radioItem.inputValue;
		if(this.stateful !== false) {
			this.saveState();
		}
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.common.attachment.dialogs.AttachItemContentPanel.superclass.getState.call(this);

		if(this.last_selected_folder) {
			state.last_selected_folder = this.last_selected_folder.get('entryid');
		}

		if(this.last_selected_radio) {
			state.last_selected_radio = this.last_selected_radio;
		}

		return state;
	},

	/**
	 * Apply the given state to this object activating the properties which were previously
	 * saved in {@link Ext.state.Manager}.
	 * @param {Object} state The state object
	 * @protected
	 */
	applyState : function(state)
	{
		if(state && state.last_selected_folder) {
			this.last_selected_folder = container.getHierarchyStore().getFolder(state.last_selected_folder);
			delete state.last_selected_folder;
		}

		// we don't want to support selection radio from state at this time
		delete state.last_selected_radio;

		Zarafa.common.attachment.dialogs.AttachItemContentPanel.superclass.applyState.call(this, state);
	},

	/**
	 * If {@link #showLoadMask} is enabled, this function will display the {@link #loadMask}.
	 * @protected
	 */
	showLoadMask : function()
	{
		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.el);
		}

		this.loadMask.show();
	},

	/**
	 * If {@link #showLoadMask} is enabled, and {@link #showLoadMask} has been
	 * called to display the {@link #loadMask} this function will disable the loadMask.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.loadMask) {
			this.loadMask.hide();
		}
	},

	/**
	 * Function will be used to get instance of store which should be used to get data from a particular folder.
	 * Function will use bidding process of contexts to find context which will be loaded when folder is selected in hierarchy,
	 * after getting the context we can easily get an instance of the store, but instead we will need a new instance of the store
	 * so we will create a new instance of the store by using the constructor.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that should be used for bidding process.
	 * @return {Zarafa.core.data.ListModuleStore} store that will be used to load data in {@link Zarafa.common.attachment.dialogs.AttachItemGrid AttachItemGrid}.
	 * @private
	 */
	getStoreByFolder : function(folder)
	{
		// find context which can successfully bid for this particular folder
		var context = container.getContextByFolder(folder);

		// get store instance from context
		var store = context.getModel().getStore();

		if(!store) {
			// if we are not able to get the store then fallback to MailStore
			// this will normally happen with IPM_SUBTREE of default store
			store = new Zarafa.mail.MailStore();
		}

		// we will get the instance but instead we need to create a new instance of the store
		store = new store.constructor({
			// make sure that store is not registered with IPMStoreMgr as we don't want to propogate updates from other stores
			// because this store is used in a modal dialog
			standalone : true,

			// pass the folder from which we need to load the data
			folder : folder,

			// destroy store when folder selection is changed
			// and store is not needed anymore
			autoDestroy : true
		});

		return store;
	},

	/**
	 * Function will be used to get instance of {@link Zarafa.common.ui.grid.ColumnModel ColumnModel}. Function will use
	 * bidding process to get instance of column model.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that should be used for bidding process.
	 * @return {Zarafa.core.data.ListModuleStore} store that will be used to show columns in {@link Zarafa.common.attachment.dialogs.AttachItemGrid AttachItemGrid}.
	 * @private
	 */
	getColumnModelByFolder : function(folder)
	{
		// find the correct column model for showing in grid, this will use bidding process
		var componentType = Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel'];
		var columnModel = container.getSharedComponent(componentType, folder);

		return new columnModel();
	},

	/**
	 * Function will be used to get instance of {@link Zarafa.common.attachment.dialogs.AttachItemBaseRenderer Renderer}. Function will use
	 * bidding process to get instance of renderer.
	 * @param {Zarafa.core.data.IPMRecord} record record that is selected and should use for bidding process.
	 * @private
	 */
	getRendererByMessage : function(record)
	{
		// find the correct renderer for getting text data from record, this will use bidding process
		var componentType = Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer'];
		var renderer = container.getSharedComponent(componentType, record);

		return new renderer();
	}
});

Ext.reg('zarafa.attachitemcontentpanel', Zarafa.common.attachment.dialogs.AttachItemContentPanel);