Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 *
 * this class will be used to create a contact panel
 * @xtype zarafa.contactcontentpanel
 */
Zarafa.contact.dialogs.ContactContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * The parser object which will be used to parse and combine different parts of name, address, phone number.
	 * @property
	 * @type Zarafa.contact.data.ContactDetailsParser
	 */
	contactParser : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.contactcontentpanel',
			layout : 'fit',
			title : _('Contact'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			closeOnSave : true,
			confirmClose : true,
			items : this.createPanel()
		});

		Zarafa.contact.dialogs.ContactContentPanel.superclass.constructor.call(this, config);

		this.initContactDetailsParser();
	},

	/**
	 * Add the main Window Panel to the content panel.
	 * This will contain a {@link Zarafa.core.ui.ContentPanelToolbar ContentPanelToolbar}
	 * and a {@link Zarafa.contact.dialogs.ContactPanel ContactPanel}.
	 * @private
	 */
	createPanel : function()
	{
		// Create a new panel and add it.
		return [{
			xtype : 'zarafa.contactpanel',
			tbar : {
				xtype: 'zarafa.contacttoolbar'
			}
		}];
	},

	/**
	 * Initialize contact details parser, which will be used to parse name, phone and address info
	 * by default {@link Zarafa.contact.data.ContactDetailsParser ContactDetailsParser} is used but
	 * user can extend this object and use it's own custom parser using insertion points.
	 */
	initContactDetailsParser : function()
	{
		var parserType = container.getSharedComponent(Zarafa.core.data.SharedComponentType['contact.detailsparser']);
		if (parserType) {
			this.contactParser = new parserType();
		}
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if(contentReset){
			this.updateIconFromRecord(record);
		}
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
		var display_name = record.get('display_name');
		if(!Ext.isEmpty(display_name)){
			this.setTitle(display_name);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	}
});

// register panel
Ext.reg('zarafa.contactcontentpanel', Zarafa.contact.dialogs.ContactContentPanel);
