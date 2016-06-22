Ext.namespace('Zarafa.common.dialogs');

/**
 * @class Zarafa.common.dialogs.CopyMoveContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.copymovecontentpanel
 *
 * This will display a {@link Zarafa.core.ui.ContentPanel contentpanel}
 * for copying or moving {@link Zarafa.core.data.MAPIRecord records}
 * to a different {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
 */
Zarafa.common.dialogs.CopyMoveContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.core.data.MAPIRecord} record The record(s) which are being
	 * copied or moved through this panel
	 */
	record : undefined,

	/**
	 * The MAPIFolder which was selected the last time this panel was opened.
	 * This is used when {@link #stateful} is enabled.
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 */
	last_selected_folder : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		var title;
		var objectType;
		if (config.record) {
			if (!Ext.isArray(config.record)) {
				config.record = [ config.record ];
			}

			objectType = config.record[0].get('object_type');
			switch (objectType) {
				case Zarafa.core.mapi.ObjectType.MAPI_FOLDER:
					title = _('Copy/Move Folder');
					break;
				case Zarafa.core.mapi.ObjectType.MAPI_MESSAGE:
				/* falls through*/
				default:
					title = _('Copy/Move Messages');
					break;
			}
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.copymovecontentpanel',
			// We don't need the autofocus plugin since we want the focus on the
			// selected tree node.
			useInputAutoFocusPlugin: false,
			layout: 'fit',
			title : title,
			width: 400,
			height: 350,
			cls: 'copymove-panel',
			items: [{
				xtype: 'zarafa.copymovepanel',
				record : config.record,
				objectType : objectType
			}]
		});

		Zarafa.common.dialogs.CopyMoveContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Obtain the {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} which should be selected by
	 * default. This will use {@link #last_selected_folder} if provided, otherwise will use the
	 * {@link #record} to obtain the corresponding default folder from the
	 * {@link Zarafa.core.Container#getHierarchyStore hierarchy}.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The default selected folder
	 */
	getSelectedFolder : function()
	{
		if (!this.last_selected_folder && !Ext.isEmpty(this.record)) {
			var hierarchy = container.getHierarchyStore();
			var record = this.record[0];

			if (record.get('container_class')) {
				this.last_selected_folder = hierarchy.getDefaultFolderFromContainerClass(record.get('container_class'));
			} else if (record.get('message_class')) {
				this.last_selected_folder = hierarchy.getDefaultFolderFromMessageClass(record.get('message_class'));
			}
		}

		return this.last_selected_folder;
	},

	/**
	 * Mark the given folder as selected, this will update {@link #last_selected_folder}
	 * and will call {@link #saveState} if this panel is {@link #stateful}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 */
	selectFolder : function(folder)
	{
		this.last_selected_folder = folder;
		if (this.stateful !== false) {
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
		var state = Zarafa.common.dialogs.CopyMoveContentPanel.superclass.getState.call(this);

		if (this.last_selected_folder) {
			state.last_selected_folder = this.last_selected_folder.get('entryid');
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
		if (state && state.last_selected_folder) {
			this.last_selected_folder = container.getHierarchyStore().getFolder(state.last_selected_folder);
			delete state.last_selected_folder;
		}

		Zarafa.common.dialogs.CopyMoveContentPanel.superclass.applyState.call(this, state);
	}
});

Ext.reg('zarafa.copymovecontentpanel', Zarafa.common.dialogs.CopyMoveContentPanel);
