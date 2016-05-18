Ext.namespace('Zarafa.note.dialogs');

/**
 * @class Zarafa.note.dialogs.NoteEditContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.noteeditcontentpanel
 *
 * this class is used to create/view note edit content panel
 */
Zarafa.note.dialogs.NoteEditContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype	: 'zarafa.noteeditcontentpanel',
			layout	: 'fit',
			title : _('Note'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			confirmClose : true,
			items: [ this.createPanel() ]
		});

		Zarafa.note.dialogs.NoteEditContentPanel.superclass.constructor.call(this,config);
	},

	/**
	 * Add the main Window Panel to the content panel. This will contain
	 * a {@link Zarafa.core.ui.ContentPanelToolbar ContentPanelToolbar} and a {@link Zarafa.note.dialogs.NoteEditPanel NoteEditPanel}.
	 * @return {Object} The configuration object for the main panel.
	 * @private
	 */
	createPanel : function()
	{
		//Add toolbar and text area in window panel
		return {
			iconCls		: 'icon_folder_note',
			border		: false,
			tbar		: {
				xtype : 'zarafa.noteedittoolbar'
			},
			xtype		: 'zarafa.noteeditpanel',
			layout		: 'fit'
		};
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if(contentReset === true) {
			this.inputAutoFocusPlugin.setAutoFocus('zarafa.editorfield');
		}
		this.updateIconFromRecord(record);
		this.updateTitleFromRecord(record);
	},

	/**
	 * Update this panel's icon class from the record that it contains
	 * First obtains the icon class from a mapping, then calls {@link #setIcon}
	 * 
	 * @param {Zarafa.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord : function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Zarafa.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
	},
	
	/**
	 * When record has been updated, title also has to be - for instance if we have the subject 
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Zarafa.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord : function(record)
	{
		var subject = record.get('subject');
		if(!Ext.isEmpty(subject)){
			this.setTitle(subject);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	}
});

//Register note content panel
Ext.reg('zarafa.noteeditcontentpanel', Zarafa.note.dialogs.NoteEditContentPanel);
