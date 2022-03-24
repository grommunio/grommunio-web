Ext.namespace('Zarafa.plugins.files.backend.Owncloud.ui');

/**
 * @class Zarafa.plugins.files.backend.Owncloud.ui.UserGroupPredictorField
 * @extends Ext.form.ComboBox
 * @xtype filesplugin.owncloud.usergrouppredictorfield
 *
 * This ComboBox automatically searches for the correct user/group name.
 */
Zarafa.plugins.files.backend.Owncloud.ui.UserGroupPredictorField = Ext.extend(Ext.form.ComboBox, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		var recipientStore = new Ext.data.ArrayStore({
			proxy : new Ext.data.HttpProxy({
				method: 'GET',
				url: container.getBasePath() + 'index.php'
			}),
			method: 'GET',
			baseParams: {
				load: 'custom',
				name: 'files_get_recipients',
				id: config.recordId
			},
			id: 1,
			fields: [
				'display_name',
				'shareWith',
				'object_type'
			]
		});
		config = config || {};
		Ext.applyIf(config, {
			store: recipientStore,
			displayField: 'display_name',
			typeAhead: false,
			forceSelection: true,
			triggerAction: 'query',
			itemId: 'predictor',
			mode: 'remote',
			minChars: 2,
			emptyText: dgettext('plugin_filesbackendOwncloud', 'Type to search'),
			loadingText: dgettext('plugin_filesbackendOwncloud', 'Loading...'),
			listEmptyText: dgettext('plugin_filesbackendOwncloud', 'No results'),
			itemSelector: 'div.ugpredic_search_item',
			tpl: new Ext.XTemplate(
				'<tpl for=".">',
				'<div class="ugpredic_search_item">',
				'<h3>',
				'<tpl if="object_type == Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.USER"><span><div class="shareicon_16_user">&nbsp;</div></span></tpl>',
				'<tpl if="object_type == Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.GROUP"><span><div class="shareicon_16_group">&nbsp;</div></span></tpl>',
				'{display_name:htmlEncode}',
				'</h3>',
				'</div>',
				'</tpl>',
				'</tpl>'
			),
			onSelect: this.onSuggestionSelect,
			listeners : {
				invalid : this.onInvalid,
				scope : this
			}
		});

		Zarafa.plugins.files.backend.Owncloud.ui.UserGroupPredictorField.superclass.constructor.call(this, config);
	},

	/**
	 * OnSelect handler for the userGroupPredictor combo box
	 * @param record the selected record
	 */
	onSuggestionSelect: function(record) {
		this.setRawValue(record.get('display_name'));
		// also set the group field
		this.ownerCt['type'].setValue((record.get('object_type') == Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.USER) ? 'user' : 'group');
		this.collapse();
	},

	/**
	 * Function which is fire after the field has been marked as invalid.
	 * It will collapse suggestions list if it's open.
	 */
	onInvalid: function ()
	{
		if (this.isExpanded()) {
			this.store.removeAll();
			this.collapse();
		}
	}
});

Ext.reg('filesplugin.owncloud.usergrouppredictorfield', Zarafa.plugins.files.backend.Owncloud.ui.UserGroupPredictorField);
