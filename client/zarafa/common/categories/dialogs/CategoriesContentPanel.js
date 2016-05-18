Ext.namespace('Zarafa.common.categories.dialogs');

/**
 * @class Zarafa.common.categories.dialogs.CategoriesContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.categoriescontentpanel
 *
 * ContentPanel for users to edit the categories on a given {@link Zarafa.core.data.IPMRecord record}
 */
Zarafa.common.categories.dialogs.CategoriesContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.core.ui.IPMRecord[]} record The record(s) for which the
	 * categories must be configured
	 */
	record : undefined,
	/**
	 * @cfg {Boolean} autoSave Automatically save all changes on the
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} to the
	 * {@link Zarafa.core.data.IPMStore IPMStore}.
	 */
	autoSave : true,
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.categoriescontentpanel',
			layout: 'fit',
			title: _('Categories'),
			width : 400,
			height: 400,
			items: [{
				xtype: 'zarafa.categoriespanel',
				record: config.record,
				ref: 'categoriesPanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Zarafa.common.categories.dialogs.CategoriesContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 *
	 * This will apply the current categories to all {@link Zarafa.core.data.IPMRecord records}
	 * and will close the panel.
	 * @private
	 */
	onOk : function()
	{
		var categoryInput = this.categoriesPanel.getCategoriesTextArea();
		var categoryString = categoryInput.getValue();

		if (Ext.isEmpty(this.record)) {
			this.close();
			return;
		}

		Ext.each(this.record, function(record) {
			record.set('categories', categoryString);
		}, this);

		if (this.autoSave) {
			this.record[0].getStore().save(this.record);
		}

		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 *
	 * This will close the panel without saving
	 * @private
	 */
	onCancel : function()
	{
		this.close();
	}
});

Ext.reg('zarafa.categoriescontentpanel', Zarafa.common.categories.dialogs.CategoriesContentPanel);
