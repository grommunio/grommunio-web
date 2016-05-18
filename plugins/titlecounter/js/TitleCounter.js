Ext.namespace('Zarafa.plugins.titlecounter');

/**
 * @class Zarafa.plugins.titlecounter.TitleCounter
 * @extends Zarafa.core.Plugin
 *
 * Plugin is used to update the title of a browser window or tab based on the number of unread mail(s) in
 * Inbox folder of Hierarchy.
 */
Zarafa.plugins.titlecounter.TitleCounter = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * The title that would be shown if this plugin was not active
	 * @property
	 */
	baseTitle : Ext.getDoc().dom.title,

	/**
	 * Add listener for load and updateFolder event of {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore}.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.titlecounter.TitleCounter.superclass.initPlugin.apply(this, arguments);

		container.getHierarchyStore().on('load', this.updateTitle, this, { single: true });
		container.getHierarchyStore().on('updateFolder', this.updateTitle, this);
	},

	/**
	 * Append and update the browser tab title based on the unread counter of Inbox folder in hierarchy.
	 */
	updateTitle : function()
	{
		var unreadCounter = container.getHierarchyStore().getDefaultFolder('inbox').get('content_unread');


		if (unreadCounter > 0) {
			Ext.getDoc().dom.title = '(' + unreadCounter + ') ' + this.baseTitle;
		} else {
			Ext.getDoc().dom.title = this.baseTitle;
		}
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'titlecounter',
		displayName : _('Title Counter Plugin'),
		about : Zarafa.plugins.titlecounter.ABOUT,
		pluginConstructor : Zarafa.plugins.titlecounter.TitleCounter
	}));
});
