Ext.ns('Zarafa.common.searchfield.ui');

/**
 * @class Zarafa.common.searchfield.ui.SearchTextField
 * @extends Ext.form.TextField
 * @xtype zarafa.searchtextfield
 *
 * This class can be used to construct a search field with start and stop buttons and we can listen
 * for events to do search specific processing. this search can be local or remote so it is abstracted
 * away from this component.
 */
Zarafa.common.searchfield.ui.SearchTextField = Ext.extend(Ext.form.TextField, {

	/**
	 * @cfg {String} searchIndicatorClass The CSS class which must be applied to the {@link #el}
	 * during {@link #updateEditState} to indicate that the field is busy searching.
	 */
	searchIndicatorClass : 'zarafa-tbar-loading',

	/**
	 * @cfg {Boolean} searchPanelRendered The searchPanelRendered indicates that
	 * {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel}
	 * was rendered or not. it will gets true if {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel}
	 * renders else false.
	 */
	searchPanelRendered : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(config, {
			validationEvent : false,
			validateOnBlur : false,
			cls: 'zarafa-searchfield',
			boxMaxWidth: 450,
			ref : 'searchTextField',
			listeners: {
				afterrender: function(searchField){
					searchField.getEl().set({
						placeholder: _('Search in..')
					});
				},
				scope: this
			}
		});

		this.addEvents(
			/**
			 * @event beforestart
			 * Handler will be called when user has clicked on start trigger,
			 * and function is about to begin its execution.
			 * event handler can return false to abort further execution.
			 * @param {Zarafa.common.searchfield.ui.SearchTextField} SearchField object of search field component.
			 * @return {Boolean} false to prevent the search from starting
			 */
			'beforestart',
			/**
			 * @event start
			 * Handler will be called when user has clicked on start trigger (trigger2),
			 * and function has already been executed. This event can be used to actually
			 * start search operation on a {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
			 * @param {Zarafa.common.searchfield.ui.SearchTextField} SearchField object of search field component.
			 */
			'start',
			/**
			 * @event beforestop
			 * Handler will be called when user has close the search tab.
			 * event handler can return false to abort further execution.
			 * @param {Zarafa.common.searchfield.ui.SearchTextField} SearchField object of search field component.
			 * @return {Boolean} false to prevent the search from stopping
			 */
			'beforestop',
			/**
			 * @event stop
			 * Handler will be called when user has close the search tab.
			 * This event can be used to stop search process on
			 * {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
			 * @param {Zarafa.common.searchfield.ui.SearchTextField} SearchField object of search field component.
			 */
			'stop'
		);

		Zarafa.common.searchfield.ui.SearchTextField.superclass.constructor.call(this, config);
	},

	/**
	 * Initialises the component.
	 * This will listen to some special key events registered on the Trigger Field
	 * @protected
	 */
	initComponent : function()
	{
		Zarafa.common.searchfield.ui.SearchTextField.superclass.initComponent.call(this);

		this.on('specialkey', this.onTriggerSpecialKey, this);
	},

	/**
	 * Event handler which is fired when the {@link Ext.EventObjectImp#ENTER} key was pressed,
	 * if the {@link #getValue value} is non-empty this will equal pressing the
	 * {@link #onTrigger1Click 'stop'} button, otherwise this will equal pressing the
	 * {@link #onTrigger2Click 'search'} button.
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Ext.EventObject} e The event for this event
	 * @private
	 */
	onTriggerSpecialKey : function(field, e)
	{
		if (e.getKey() == e.ENTER) {
			var textValue = this.getValue();
			if (Ext.isEmpty(textValue)) {
				this.stopSearch();
			} else {
				this.onTriggerClick();
			}
		}
	},

	/**
	 * Function handler function that will be used to stop search process.
	 * it will fire {@link #stop} event, that can be used to stop actual search process.
	 * other component can also do pre-processing before stop search process using
	 * {@link #beforestop} event.
	 * @protected
	 */
	stopSearch : function()
	{
		if (this.fireEvent('beforestop', this) !== false) {
			this.hideMask();
			this.fireEvent('stop', this);
		}
	},

	/**
	 * Trigger handler function that will be used to start search process.
	 * it will fire {@link #start} event, that can be used to start actual search process.
	 * other component can also do validation before starting search process using
	 * {@link #beforestart} event.
	 * @protected
	 */
	onTriggerClick : function()
	{
		if (this.fireEvent('beforestart', this) !== false) {
			if(Ext.isEmpty(this.getValue())) {
				this.focus();
				return false;
			}
			var searchFolder = this.searchContainer.searchFolderCombo.getValue();

			// Check if current selected folder is available in hierarchy tree,
			// If not then show warning message to user.
			if (!container.getHierarchyStore().getFolder(searchFolder)) {
				Ext.MessageBox.show({
					title: _('Kopano WebApp'),
					msg: _("The folder you are searching through no longer exists. Please select another folder"),
					icon: Ext.MessageBox.WARNING,
					buttons: Ext.MessageBox.OK
				});
				return false;
			}

			if(!this.searchPanelRendered) {
				var componentType = Zarafa.core.data.SharedComponentType['common.search'];
				Zarafa.core.data.UIFactory.openLayerComponent(componentType, [], {
					'searchText' : this.getValue(),
					'parentSearchField' : this,
					'parentSearchFolderCombo' : this.searchContainer.searchFolderCombo
				});
			}

			this.el.addClass(this.searchIndicatorClass);
			this.fireEvent('start', this);
		}
	},

	/**
	 * Function is used to hide the spinner field from search text field.
	 */
	hideMask : function()
	{
		this.el.removeClass([this.searchIndicatorClass]);
	}
});

Ext.reg('zarafa.searchtextfield', Zarafa.common.searchfield.ui.SearchTextField);
