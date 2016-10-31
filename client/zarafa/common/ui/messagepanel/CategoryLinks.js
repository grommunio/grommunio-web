Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.CategoryLinks
 * @extends Ext.Container
 * @xtype zarafa.categorylinks
 *
 * Renders the categories as colored labels in the
 * {@link Zarafa.common.ui.messagepanel.MessageHeader}.
 */
Zarafa.common.ui.messagepanel.CategoryLinks = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record Holds the current record
	 */
	record: undefined,

	/**
	 * Holds the tooltip that will be used to show the full category name
	 * of truncated categories
	 * @property
	 * @type {Zarafa.common.categories.ui.Tooltip}
	 */
	tooltip : null,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config,{
			xtype: 'zarafa.categorylinks',
			border : false,
			anchor : '100%',
			cls : 'k-preview-header-categories',
			listeners: {
				render: this.onRenderCategoryLinks,
				scope: this
			}
		});

		Zarafa.common.ui.messagepanel.CategoryLinks.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the render event of the category links. Creates
	 * the {@link Zarafa.common.categories.ui.Tooltip tooltip object} that will
	 * be used to display truncated categories. And adds a listener for
	 * the contextmenu event.
	 */
	onRenderCategoryLinks : function()
	{
		// Create a tooltip for truncated categories
		this.tooltip = new Zarafa.common.categories.ui.Tooltip({
			target: this.el
		});

		// Create the contextmenu for the category labels
		this.mon(this.el, 'contextmenu', this.onContextMenu, this);
	},

	/**
	 * Event handler for the contextmenu event of the category labels. Will
	 * show the context menu if the click was on a label.
	 * @param {Ext.EventObject} event The event object
	 * @param {HtmlElement} targetElement The element on which the click happened
	 */
	onContextMenu : function(event, targetElement)
	{
		targetElement = Ext.get(targetElement);
		if ( targetElement.hasClass('k-category-block') ){
			Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.category'], [this.record], {
				category: targetElement.dom.textContent,
				position : event.getXY()
			});
		}
	},

	/**
	 * Update the {@link Zarafa.common.ui.messagepanel.CategoryLinks header} with the data
	 * from the {@link Zarafa.core.data.IPMRecord record}. Updates the panel
	 * by loading data from the record data into the template.
	 * Attach mouse handlers on the anchors
	 * @param {Zarafa.core.data.IPMRecord} record to update the header panel with
	 */
	update: function(record)
	{
		this.record = record;

		if ( this.el ){
			// Render the categories
			var categories = Zarafa.common.categories.Util.getCategories(record);
			var html = Zarafa.common.categories.Util.getCategoriesHtml(categories);
			this.el.dom.innerHTML = html;
		}
	}
});

Ext.reg('zarafa.categorylinks', Zarafa.common.ui.messagepanel.CategoryLinks);
