Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderPropertiesGeneralTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.folderpropertiesgeneraltab
 *
 * General tab in the {@link Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel}
 * that is used to show/change folder properties.
 */
Zarafa.hierarchy.dialogs.FolderPropertiesGeneralTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'zarafa.folderpropertiesgeneraltab',
			cls: 'tab-general',
			border: false,
			bodyStyle: 'background-color: inherit;',
			labelAlign: 'left',
			defaults: {
				border: false,
				xtype: 'panel',
				layout: 'form'
			},

			items: [
				this.createNameInfoPanel(),
				this.createDescriptionInfoPanel(),
				this.createContentInfoPanel()
			]
		});

		Zarafa.hierarchy.dialogs.FolderPropertiesGeneralTab.superclass.constructor.call(this, config);
	},
	/**
	 * @return {Object} Configuration object for the panel which shows folders properties
	 * @private
	 */
	createNameInfoPanel: function()
	{
		return {
			style: {
				borderBottomWidth: '1px',
				borderBottomStyle: 'solid'
			},
			items: [{
				xtype: 'displayfield',
				cls: 'display-name',
				name: 'display_name',
				htmlEncode: true,
				ref: 'displayField',
				hideLabel: true
			}],
			ref: 'nameInfoPanel'
		};
	},
	/**
	 * @return {Object} Configuration object for the panel which shows folders properties
	 * @private
	 */
	createDescriptionInfoPanel: function()
	{
		return {
			cls: 'description-panel',
			style: {
				borderBottomWidth: '1px',
				borderBottomStyle: 'solid'
			},
			defaults: {
				anchor: '100%'
			},
			items: [{
				xtype: 'displayfield',
				fieldLabel: _('Type'),
				htmlEncode: true,
				ref: 'folderTypeField'
			},{
				xtype: 'displayfield',
				fieldLabel: _('Location'),
				ref: 'locationField',
				htmlEncode: true
			},{
				xtype: 'textarea',
				fieldLabel: _('Description'),
				height: 72,
				name: 'comment',
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			}],
			ref: 'descriptionPanel'
		};
	},
	/**
	 * @return {Object} Configuration object for the panel which shows folders properties
	 * @private
	 */
	createContentInfoPanel: function()
	{
		return {
			cls: 'content-info-panel',
			border: false,
			items: [{
				xtype: 'displayfield',
				fieldLabel: _('Items'),
				htmlEncode: true,
				name: 'content_count'
			},{
				xtype: 'displayfield',
				fieldLabel: _('Unread'),
				htmlEncode: true,
				name: 'content_unread'
			},{
				xtype: 'zarafa.displayfield',
				fieldLabel: _('Size'),
				renderer: Ext.util.Format.fileSize,
				name: 'message_size'
			},{
				xtype : 'textfield',
				fieldLabel : _('Object ID'),
				anchor: '100%',
				readOnly: true,
				name : 'x_fidtext'
			}],
			buttonAlign: 'left',
			buttons: [{
				xtype: 'button',
				cls: 'zarafa-action',
				text: _('Folder size') + '...',
				handler: this.onFolderSize,
				scope: this
			}]
		};
	},

	/**
	 * Enable/disable/hide/unhide all {@link Ext.Component Components} within the {@link Ext.Panel Panel}
	 * using the given {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	updateUI: function(record, contentReset)
	{
		var layout = false;

		if (contentReset === true) {
			var container_class = record.get('container_class').substr(4).replace(/\./,"").toLowerCase();
			var icon = Zarafa.common.ui.IconClass.getIconClass(record);
			if ( container_class === 'appointment' ){
				var calendarContext = container.getContextByName('calendar');
				var calendarContextModel = calendarContext.getModel();
				var scheme = calendarContextModel.getColorScheme(record.get('entryid'));
				this.nameInfoPanel.displayField.addClass('folder-dialog-icon k-calendar-dialog-icon');
				this.nameInfoPanel.displayField.getEl().dom.style.setProperty('--k-calendar-color', scheme.base);
			} else {
				this.nameInfoPanel.displayField.addClass(String.format('folder-dialog-icon ' + icon));
			}

			var type = String.format(_('Folder containing {0} Items'), Zarafa.common.data.FolderContentTypes.getContentName(record.get('container_class')));
			this.descriptionPanel.folderTypeField.setValue(type);
			layout = true;

			this.descriptionPanel.locationField.setValue(record.getPath());
		}

		if (layout) {
			this.doLayout();
		}
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		this.record = record;
		this.updateUI(record, contentReset);
		this.getForm().loadRecord(record);

		var entryid = record.get('entryid');
		if (entryid) {
			var provider = entryid.substr(8, 32);
			var fdguid   = entryid.substr(44, 32);
			var fidgcv   = parseInt(entryid.substr(76, 12), 16);
			record.set('x_fidtext', fidgcv + "/0x" + fidgcv.toString(16) +
				"; dbguid=" + fdguid + "; store=" + provider);
		}
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	},

	/**
	 * Event handler which is fired when a field has been changed.
	 * This will update the corresponding field inside the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onFieldChange: function(field, newValue, oldValue)
	{
		this.record.set(field.getName(), newValue);
	},

	/**
	 * Event handler which is fired when the "Folder Size" button is pressed. This
	 * will open an dialog to display all folder sizes.
	 * @param {Ext.Button} btn The button which was pressed
	 * @private
	 */
	onFolderSize: function(btn)
	{
		Zarafa.hierarchy.Actions.openFolderSizeContent(this.record);
	}
});

Ext.reg('zarafa.folderpropertiesgeneraltab', Zarafa.hierarchy.dialogs.FolderPropertiesGeneralTab);
