Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsInboxNavigationWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsinboxnavigationwidget
 *
 * The Webapp Inbox Navigation widget
 */
Zarafa.settings.ui.SettingsInboxNavigationWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.settingsinboxnavigationwidget',
			title : _('Inbox navigation'),
			layout : 'form',
			items : [{
				xtype : 'displayfield',
				hideLabel : true,
				value : _('I want to navigate through my items by using.')
			},{
				xtype : 'radiogroup',
				name : 'zarafa/v1/contexts/mail/enable_live_scroll',
				ref : 'liveScroll',
				hideLabel : true,
				columns : 1,
				style : { marginBottom : '10px'},
				items : [{
					xtype : 'radio',
					name : 'enablescroll',
					inputValue : 'true',
					boxLabel : _('Infinite Scroll') + '<span class="zarafa-settings-category-general-liveScroll">(' + _('WebApp automatically loads additional items when you scroll down') + ')</span>'
				},{
					xtype : 'radio',
					name : 'enablescroll',
					inputValue : 'false',
					boxLabel : _('Pagination') + '<span class="zarafa-settings-category-general-liveScroll">(' + _('WebApp displays items on pages and you can use navigation controls to navigate') + ')</span>'
				}],
				listeners : {
					change : this.onRadioChange,
					scope : this
				}
			},
			this.createPageSizeField()]
		});

		Zarafa.settings.ui.SettingsInboxNavigationWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Creates a composite field for the page size. Uses a different label depending
	 * on whether the user has set to use infinite scroll or pagination.
	 * @return {Zarafa.common.ui.CompositeField}
	 */
	createPageSizeField : function()
	{
		var enableScroll = Ext.isDefined(this.liveScroll) ? this.liveScroll.getValue().getRawValue() === 'true' : true;
		var fieldLabel = enableScroll ?	_('Load items in blocks of {A}') : _('Load {A} items per page.');

		var pageSizeStore = {
			xtype : 'jsonstore',
			autoDestroy : true,
			fields : ['size'],
			data : [{
				'size' : 50
			},{
				'size' : 100
			},{
				'size' : 150
			},{
				'size' : 200
			}]
		};

		return new Zarafa.common.ui.CompositeField({
				xtype : 'zarafa.compositefield',
				plugins : ['zarafa.splitfieldlabeler'],
				ref: 'pageSizeContainer',
				fieldLabel : fieldLabel,
				items : [{
					labelSplitter : '{A}',
					xtype : 'combo',
					name : 'zarafa/v1/main/page_size',
					ref : 'pageSize',
					width : 55,
					hideLabel : true,
					store : pageSizeStore,
					mode : 'local',
					triggerAction : 'all',
					displayField : 'size',
					valueField : 'size',
					lazyInit : false,
					forceSelection : true,
					editable : false,
					autoSelect : true,
					listeners : {
						select : this.onPageSizeSelect,
						scope : this
					}
				}]
			});
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function (settingsModel)
	{
		this.model = settingsModel;
		this.liveScroll.setValue(settingsModel.get(this.liveScroll.name));
		this.pageSizeContainer.pageSize.setValue(settingsModel.get(this.pageSizeContainer.pageSize.name));
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function (settingsModel)
	{

		var enableScroll = this.liveScroll.getValue().inputValue === 'true';

		settingsModel.beginEdit();
		settingsModel.set(this.liveScroll.name, enableScroll);
		settingsModel.set(this.pageSizeContainer.pageSize.name, this.pageSizeContainer.pageSize.getValue());
		settingsModel.endEdit();
	},

	/**
	 * event handler which is fired when the value of "Enable Endless scroll" checkbox has been changed.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @private
	 */
	onRadioChange : function (field, radio)
	{
		var enableScroll = radio.inputValue === 'true';

		// Let's change the label of the pageSize component
		// We cannot simply change it and call doLayout, because the compositeField
		// has created a few child components to display the field. So we must
		// destroy the existing component and create brand new one.
		var pageSize = this.pageSizeContainer.pageSize.getValue();
		this.pageSizeContainer.destroy();
		this.pageSizeContainer = this.createPageSizeField();
		this.pageSizeContainer.pageSize.setValue(pageSize);
		this.add(this.pageSizeContainer);
		this.doLayout();

		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== enableScroll) {
				this.model.set(field.name, enableScroll);
			}
		}
	},

	/**
	 * Event handler which is fired when a page size in the {@link Ext.form.ComboBox combobox}
	 * has been selected.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 */
	onPageSizeSelect : function (field, record)
	{
		if (this.model) {
			if (this.model.get(field.name) !== field.getValue()) {
				this.model.set(field.name, field.getValue());
			}
		}
	}
});

// Infinite scroll is called live scroll in the code

Ext.reg('zarafa.settingsinboxnavigationwidget', Zarafa.settings.ui.SettingsInboxNavigationWidget);
