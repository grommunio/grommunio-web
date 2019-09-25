Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.DistlistNotesTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.distlistnotestab
 *
 * This class is used to create layout of details tab panel.
 */
Zarafa.contact.dialogs.DistlistNotesTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.distlistnotestab',
			// Note Tab
			title : _('Notes'),
			layout : 'fit',
			items : [{
				xtype : 'zarafa.editorfield',
				useHtml : false,
				ref: 'editorField',
				plaintextName : 'body',
				listeners : {
					// Use the afterlayout event to place the placeholder attribute
					afterlayout: function(){
						this.editorField.getEditor().getEl().set({
							placeholder: _('Type your note here...')
						});
					},
					change : this.onPropertyChange,
					scope : this
				}
			}]
		});

		Zarafa.contact.dialogs.DistlistNotesTab.superclass.constructor.call(this, config);
	},

	/**
	 * Load record into form
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if(Ext.isEmpty(record)) {
			return;
		}

		this.record = record;

		this.getForm().loadRecord(this.record);
	},

	/**
	 * Update record from form, Get values from the form.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @private
	 */
	updateRecord : function(record)
	{
		this.getForm().updateRecord(record);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onPropertyChange : function(field, newValue, oldValue)
	{
		this.record.set(field.getName(), newValue);
	}
});

Ext.reg('zarafa.distlistnotestab', Zarafa.contact.dialogs.DistlistNotesTab);
