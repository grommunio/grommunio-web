Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.AccountStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype filesplugin.accountstore
 *
 * This store will hold all Files accounts that a user owns.
 */
Zarafa.plugins.files.data.AccountStore = Ext.extend(Zarafa.core.data.ListModuleStore, {

	/**
	 * @constructor
	 */
	constructor: function (config)
	{
		config = Ext.applyIf(config || {}, {
			preferredMessageClass: 'IPM.FilesAccount',
			autoLoad: true,
			autoSave: true,
			defaultSortInfo: {
				field: 'account_sequence',
				direction: 'asc'
			}
		});

		Zarafa.plugins.files.data.AccountStore.superclass.constructor.call(this, config);

		this.addEvents(
			/**
			 * @event reorder
			 * Fires when order of a configured account is changed in
			 * {@link Zarafa.plugins.files.settings.ui.AccountGrid AccountGrid}
			 *
			 * @param {Zarafa.plugins.files.data.AccountRecord} firstAccount which reorder.
			 * @param {Zarafa.plugins.files.data.AccountRecord} secondAccount which reorder.
			 */
			'reorder'
		);
	}
});

Ext.reg('filesplugin.accountstore', Zarafa.plugins.files.data.AccountStore);