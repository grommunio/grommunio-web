Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.SearchField
 * @extends Ext.form.TriggerField
 * @xtype zarafa.searchfield
 *
 * This class can be used to construct a search field with start and stop buttons and we can listen
 * for events to do search specific processing. this search can be local or remote so it is abstracted
 * away from this component.
 */
Zarafa.common.ui.SearchField = Ext.extend(Ext.form.TriggerField, {

	/**
	 * @cfg {String} searchIndicatorClass The CSS class which must be applied to the {@link #el}
	 * during {@link #updateEditState} to indicate that the field is busy searching.
	 */
	searchIndicatorClass : 'zarafa-tbar-loading',

	/**
	 * @cfg {Boolean} renderedSearchPanel The renderedSearchPanel indicates that 
	 * {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel} 
	 * was rendered or not. it will gets true if {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel} 
	 * renders else false.
	 */
	renderedSearchPanel : false,

	/**
	 * @cfg {String} errorMsgEmpty The error text to display if the search query is empty.
	 */
	errorMsgEmpty : _('Please enter text to start search.'),

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
			triggerClass : 'icon_search'
		});

		this.addEvents(
			/**
			 * @event beforestart
			 * Handler will be called when user has clicked on start trigger (trigger2),
			 * and function is about to begin its execution.
			 * event handler can return false to abort further execution.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 * @return {Boolean} false to prevent the search from starting
			 */
			'beforestart',
			/**
			 * @event start
			 * Handler will be called when user has clicked on start trigger (trigger2),
			 * and function has already been executed. This event can be used to actually
			 * start search operation on a {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 */
			'start',
			/**
			 * @event beforereset
			 * Handler will be called when user has clicked on stop trigger (trigger1),
			 * and function is about to begin its execution.
			 * event handler can return false to abort further execution.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 * @return {Boolean} false to prevent the search from stopping
			 */
			'beforestop',
			/**
			 * @event reset
			 * Handler will be called when user has clicked on stop trigger (trigger1),
			 * and function has already been executed. This event can be used to stop
			 * search process on {@link Zarafa.core.data.ListModuleStore ListModuleStore}
			 * and reload with normal data.
			 * @param {Zarafa.common.ui.SearchField} SearchField object of search field component.
			 */
			'stop'
		);

		Zarafa.common.ui.SearchField.superclass.constructor.call(this, config);
	},

	/**
	 * Initialises the component.
	 * This will listen to some special key events registered on the Trigger Field
	 * @protected
	 */
	initComponent : function()
	{
		Zarafa.common.ui.SearchField.superclass.initComponent.call(this);

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
			this.doStop();
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
				container.getNotifier().notify('error.search', _('Error'), this.errorMsgEmpty);
				return false;
			}

			if(!this.isRenderedSearchPanel()) {
				var componentType = Zarafa.core.data.SharedComponentType['common.search'];
				Zarafa.core.data.UIFactory.openLayerComponent(componentType, [], {
					'searchText' : this.getValue(),
					'parentSearchField' : this
				});
			}

			this.doStart();
			this.fireEvent('start', this);
		}
	},

	/**
	 * Apply a {@link #emptyText} onto this component
	 * @param {String} text The emptyText which should be applied
	 */
	setEmptyText : function(text)
	{
		if (Ext.isEmpty(this.getRawValue())) {
			this.setRawValue(text);
		}
		this.emptyText = text;
	},

	/**
	 * Obtain the {@link Zarafa.common.ui.SearchField#emptyText emptyText} string
	 * which must be applied to {@link #this.searchTextfield}.
	 * 
	 * @param {Zarafa.core.data.MAPIFolder} folder The folder which will be searched through.
	 * @return {String} The emptyText string to be applied
	 * @private
	 */
	getEmptySearchText : function(folder)
	{
		if(folder) {
			var folderName = folder.get('display_name');
			var userName = folder.getMAPIStore().get('mailbox_owner_name');
			var emptyText = String.format(_('Search in "{0} - {1}"'), folderName, userName);
			return emptyText;
		}
	},

	/**
	 * Update this component to display that this component is
	 * currently busy searching.
	 */
	doStart : function()
	{
		this.el.addClass([this.searchIndicatorClass]);
	},

	/**
	 * Update this component to display that this component is currently
	 * no longer searching.
	 */
	doStop : function()
	{
		this.el.removeClass([this.searchIndicatorClass]);
	},

	/**
	 * Function was used to identify that search panel was rendered or not.
	 * @return {Boolean} return true when search panel was rendered else false.
	 */
	isRenderedSearchPanel : function()
	{
		return this.renderedSearchPanel;
	}
});

Ext.reg('zarafa.searchfield', Zarafa.common.ui.SearchField);
