Ext.namespace('Grommunio.core.ui');

/**
 * @class Grommunio.core.ui.ToolbarButton
 * @extends Ext.Button
 * @xtype grommunio.toolbarbutton
 *
 * Special implementation for the {@link Ext.Button button}
 * which connects to the Mail {@link Ext.Panel panel} for the
 * currently active {@link Grommunio.core.Context context}.
 * Using this link, the {@link Ext.Button button} can be disabled
 * or enabled depending on the number of currently selected
 * {@link Grommunio.core.data.IPMRecord records}.
 *
 * Also this class makes it easier for the {@link Ext.Button button}
 * to request the currently selected {@link Grommunio.core.data.IPMRecord records}
 * on which it can perform an action.
 *
 * FIXME: This should somehow be merged with Grommunio.core.ui.menu.ConditionalItem.
 */
Grommunio.core.ui.ToolbarButton = Ext.extend(Ext.Button, {
	/**
	 * @cfg {Boolean} emptySelectOnly This button must only be enabled
	 * if no record is selected
	 */
	emptySelectOnly: false,
	/**
	 * @cfg {Boolean} nonEmptySelectOnly This button must only be enabled
	 * if one or more records are selected.
	 */
	nonEmptySelectOnly: false,
	/**
	 * @cfg {Boolean} singleSelectOnly This button must only be enabled
	 * if a single record is selected
	 */
	singleSelectOnly: false,
	/**
	 * @cfg {Boolean} multiSelectOnly This button must only be enabled
	 * if multiple records are selected.
	 */
	multiSelectOnly: false,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.toolbarbutton'
		});

		Ext.apply(this, config);

		Grommunio.core.ui.ToolbarButton.superclass.constructor.call(this, config);

		var model = this.model || container.getCurrentContext().getModel();
		if (Ext.isDefined(model)) {
			this.onRecordSelectionChange(model, model.getSelectedRecords());
			this.mon(model, 'recordselectionchange', this.onRecordSelectionChange, this);
		}
	},

	/**
	 * Event handler which is triggered when the current {@link Grommunio.core.data.IPMRecord record}
	 * selection changes. This will then evaluate if the {@link Ext.Button button} must be
	 * enabled or disabled.
	 *
	 * @param {Grommunio.core.ContextModel} model this model.
	 * @param {Grommunio.core.data.Record[]} records The selected records
	 */
	onRecordSelectionChange: function(model, records)
	{
		if (this.emptySelectOnly) {
			if (Ext.isDefined(records) && (!Array.isArray(records) || records.length > 0)) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		} else if (this.nonEmptySelectOnly) {
			if (!Ext.isDefined(records) || (Array.isArray(records) && records.length === 0)) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		} else if (this.singleSelectOnly) {
			if (!Ext.isDefined(records) || (Array.isArray(records) && records.length !== 1)) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		} else if (this.multiSelectOnly) {
			if (!Ext.isDefined(records) || (!Array.isArray(records) || records.length === 1)) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		}
	}
});

Ext.reg('grommunio.toolbarbutton', Grommunio.core.ui.ToolbarButton);
