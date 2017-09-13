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
	 * If the record(s) to which this dialog's actions will be applied, are copied to the
	 * {@link Zarafa.core.data.ShadowStore}, this will be set to true, so we know that we
	 * must delete them again when the dialog is destroyed.
	 * @property
	 * @type {Boolean}
	 */
	recordsCopied : false,

	/**
	 * @cfg {Function} callback the callback function to be called after applying categories to
	 * record. callback function is not empty function if original selected record or records are
	 * belongs to {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 */
	callback : Ext.emptyFn,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if ( Ext.isDefined(config.record) ){
			if ( !Array.isArray(config.record) ){
				config.record = [config.record];
			}

			// Create copies of the record(s) in the ShadowStore or they will lose the store when
			// the mail list refreshes. This is not necessary for records in the ShadowStore.
			if ( config.record[0].getStore() !== container.getShadowStore() ){
				config.record = config.record.map(function(record){
					var copy = record.copy();
					container.getShadowStore().add(copy);
					return copy;
				});
				this.recordsCopied = true;
			}
		}

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.categoriescontentpanel',
			layout: 'fit',
			title: _('Manage Categories'),
			width : 400,
			height: 400,
			items: [{
				xtype: 'zarafa.categoriespanel',
				record: config.record,
				ref: 'categoriesPanel',
				buttons: [{
					text: _('Apply'),
					handler: this.onApply,
					scope: this
				},{
					text: _('New'),
					handler: this.onNew,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}],
			listeners : {
				destroy: this.onDestroyPanel,
				scope: this
			}
		});

		Zarafa.common.categories.dialogs.CategoriesContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Apply" {@link Ext.Button button}
	 *
	 * This will apply the current categories to all {@link Zarafa.core.data.IPMRecord records}
	 * and will close the panel.
	 * @private
	 */
	onApply : function()
	{
		var categories = this.categoriesPanel.getSelectedCategories();
		var categoryString = categories.join('; ');

		if (Ext.isEmpty(this.record)) {
			this.close();
			return;
		}

		Ext.each(this.record, function(record) {
			record.set('categories', categoryString);
			// Since the new implementation of categories, labels are deprecated and will
			// also be displayed as categories. So if a label was set, we will need to remove it
			// otherwise it will be added again.
			if (record.get('label')) {
				record.set('label', 0);
			}
		}, this);

		if (this.autoSave) {
			this.record[0].getStore().save(this.record);
		}

		// Also save the changes that the user made to the categories
		var grid = this.categoriesPanel.categoriesGrid;
		var store = grid.getStore();
		// Check if standard categories are selected and it is
		// first time used then mark those categories to used.
		categories.forEach(function(category){
			var categoryIndex = store.findExactCaseInsensitive('category', category);
			var categoryRecord = store.getAt(categoryIndex);
			if(!Ext.isEmpty(categoryRecord.get('standardIndex')) && !categoryRecord.get('used')) {
				categoryRecord.set('used', true);
			}
		}, this);
		store.save();

		// Update the categoriesStore in Zarafa.common.categories.Util to make sure
		// the rendering is up to date.
		Zarafa.common.categories.Util.loadCategoriesStore();

		// Update the currently loaded stores
		if ( this.autoSave ){
			Zarafa.common.categories.Util.updateStoresAfterCategoryUpdate();
		}

		if (Ext.isFunction(this.callback)) {
			this.callback.call(this.scope || this);
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
	},

	/**
	 * Event handler which is raised when the user clicks the "New" {@link Ext.Button button}
	 *
	 * This will open the dialog to create a new category
	 * @private
	 */
	onNew : function()
	{
		Zarafa.common.Actions.openNewCategoryContent({
			store: this.categoriesPanel.categoriesGrid.getStore(),
			grid: this.categoriesPanel.categoriesGrid
		});
	},

	/**
	 * Event handler for the destroy event of the panel. Will remove the records that
	 * were created in the {@link Zarafa.core.data.ShadowStore}
	 */
	onDestroyPanel : function()
	{
		// If we didn't copy the records, then we don't have to remove them
		if ( !this.recordsCopied ){
			return;
		}

		var shadowStore = container.getShadowStore();

		// Suspend the events to not fire the destroy event
		shadowStore.suspendEvents();
		shadowStore.remove(this.record);
		shadowStore.resumeEvents();
	}
});

Ext.reg('zarafa.categoriescontentpanel', Zarafa.common.categories.dialogs.CategoriesContentPanel);
