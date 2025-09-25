Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Auto-complete combo box that offers user and group recipients from Seafile.
 */
Zarafa.plugins.files.backend.Seafile.ui.UserGroupPredictorField = Ext.extend(
	Ext.form.ComboBox,
	{
		constructor: function (e) {
			var t = new Ext.data.ArrayStore({
				proxy: new Ext.data.HttpProxy({
					method: 'GET',
					url: container.getBasePath() + 'index.php',
				}),
				method: 'GET',
				baseParams: {
					load: 'custom',
					name: 'files_get_recipients',
					id: e.recordId,
				},
				id: 1,
				fields: ['display_name', 'shareWith', 'object_type'],
			});
			e = e || {};
			Ext.applyIf(e, {
				store: t,
				displayField: 'display_name',
				typeAhead: false,
				forceSelection: true,
				triggerAction: 'query',
				itemId: 'predictor',
				mode: 'remote',
				minChars: 2,
				emptyText: _('Type to search'),
				loadingText: _('Loading...'),
				listEmptyText: _('No results'),
				itemSelector: 'div.ugpredic_search_item',
				tpl: new Ext.XTemplate(
					'<tpl for=".">',
					'<div class="ugpredic_search_item">',
					'<h3>',
					'<tpl if="object_type == Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.USER"><span><div class="shareicon_16_user">&nbsp;</div></span></tpl>',
					'<tpl if="object_type == Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.GROUP"><span><div class="shareicon_16_group">&nbsp;</div></span></tpl>',
					'{display_name:htmlEncode}',
					'</h3>',
					'</div>',
					'</tpl>',
					'</tpl>',
				),
				onSelect: this.onSuggestionSelect,
				listeners: {
					invalid: this.onInvalid,
					scope: this,
				},
			});
			Zarafa.plugins.files.backend.Seafile.ui.UserGroupPredictorField.superclass.constructor.call(
				this,
				e,
			);
		},
		onSuggestionSelect: function (e) {
			this.setRawValue(e.get('display_name'));
			this.ownerCt.type.setValue(
				e.get('object_type') ==
					Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.USER
					? 'user'
					: 'group',
			);
			this.collapse();
		},
		onInvalid: function () {
			if (this.isExpanded()) {
				this.store.removeAll();
				this.collapse();
			}
		},
	},
);
Ext.reg(
	'filesplugin.seafile.usergrouppredictorfield',
	Zarafa.plugins.files.backend.Seafile.ui.UserGroupPredictorField,
);
