Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.SuggestionListView
 * @extends Ext.DataView
 * @xtype zarafa.freebusysuggestionlistview
 *
 * The SuggestionList shows the list of suggested times
 * at which an appointment can be held, this view will only
 * display the possible times for a particular date. Loading
 * of data (and date selection) occurs outside of this view.
 */
Zarafa.common.freebusy.ui.SuggestionListView = Ext.extend(Ext.DataView, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var suggestionBlockStore = config.model ? config.model.getSuggestionBlockStore() : undefined;

		Ext.applyIf(config, {
			deferEmptyText : false,
			emptyText: '<div class="zarafa-freebusy-suggestionrow emptytext">' + _('No suggestions available') + '</div>',
			tpl: new Ext.XTemplate(
				'<tpl for=".">',
				'<div class="x-btn zarafa-freebusy-suggestionrow" id="zarafa-freebusy-suggestionrow-{[xindex]}">',
					'<div class="x-btn-small x-btn-icon-small-left">',
						'<em class="" class="x-unselectable" unselectable="on">',
							'<button type="button" class=" x-btn-text">',
								'<img class="x-freebusy-suggestionrow-icon" src="' + Ext.BLANK_IMAGE_URL + '" />',
								'{[this.formatTime(values.start)]} - {[this.formatTime(values.end)]}',
							'</button>',
						'</em>',
					'</div>',
				'</div>',
				'</tpl>',
			{
				formatTime : function(time)
				{
					// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
					return new Date(time * 1000).format(_('G:i'));
				}

			}),
			store: suggestionBlockStore,
			itemSelector: 'div.zarafa-freebusy-suggestionrow'
		});

		Zarafa.common.freebusy.ui.SuggestionListView.superclass.constructor.call(this, config);

		this.mon(this.model, 'suggestionblockstorechange', this.onSuggestionBlockStoreChange, this);
	},

	/**
	 * Event listener which is triggered when a new SuggestionBlockStore has been
	 * loaded on the {@link Zarafa.common.freebusy.data.FreebusyModel FreebusyModel} class.
	 *
	 * @param {Ext.data.Store} store The new store which has been set
	 */
	onSuggestionBlockStoreChange : function(store)
	{
		this.bindStore(store);
	}
});

Ext.reg('zarafa.freebusysuggestionlistview', Zarafa.common.freebusy.ui.SuggestionListView);
