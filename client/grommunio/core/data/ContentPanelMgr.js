Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.ContentPanelMgr
 * @extends Ext.util.Observable
 * @singleton
 *
 * The {@link Grommunio.core.ui.ContentPanel ContentPanel} manager. Each
 * {@link Grommunio.core.ui.ContentPanel ContentPanel} which is created
 * must register itself to this manager.
 *
 * This manager can be used by Plugins to hook into
 * {@link Grommunio.core.ui.ContentPanel ContentPanel} from the moment they
 * are being displayed.
 */
Grommunio.core.data.ContentPanelMgr = Ext.extend(Ext.util.Observable, {
	/**
	 * The collection of {@link Grommunio.core.ui.ContentPanel contentPanels}
	 * which have been registered to this manager.
	 * @property
	 * @type Ext.util.MixedCollection
	 */
	contentPanels: undefined,
	/**
	 * @constructor
	 */
	constructor: function()
	{
		this.contentPanels = new Ext.util.MixedCollection();
		this.addEvents([
			/**
			 * @event createcontentpanel
			 * Fires when a {@link Grommunio.core.ui.ContentPanel contentPanel} is being created.
			 * @param {Grommunio.core.ui.ContentPanel} contentPanels The
			 * {@link Grommunio.core.ui.ContentPanel} which is being created.
			 */
			'createcontentpanel',
			/**
			 * @event destroycontentpanel
			 * Fires when a {@link Grommunio.core.ui.ContentPanel contentPanel} is being destroyed.
			 * @param {Grommunio.core.ui.ContentPanel} contentPanel The
			 * {@link Grommunio.core.ui.ContentPanel} which is being destroyed.
			 */
			'destroycontentpanel'
		]);

		Grommunio.core.data.ContentPanelMgr.superclass.constructor.call(this);
	},

	/**
	 * Register a {@link Grommunio.core.ui.ContentPanel contentPanel} with the {@link Grommunio.core.data.ContentPanelMgr ContentPanelMgr}.
	 * @param {Grommunio.core.ui.ContentPanel} contentPanel the {@link Grommunio.core.ui.ContentPanel contentPanel} which must be registered.
	 */
	register: function(contentPanel)
	{
		contentPanel.on('show', this.onContentPanelShow, this);
		contentPanel.on('close', this.onContentPanelHide, this);
		contentPanel.on('hide', this.onContentPanelHide, this);

		this.contentPanels.add(contentPanel);
	},

	/**
	 * UnRegister a {@link Grommunio.core.ui.ContentPanel contentPanel} from the {@link Grommunio.core.data.ContentPanelMgr ContentPanelMgr}.
	 * @param {Grommunio.core.ui.ContentPanel} contentPanel the {@link Grommunio.core.ui.ContentPanel contentPanel} which must be unregistered.
	 */
	unregister: function(contentPanel)
	{
		contentPanel.un('show', this.onContentPanelShow, this);
		contentPanel.un('close', this.onContentPanelHide, this);
		contentPanel.un('hide', this.onContentPanelHide, this);

		this.contentPanels.remove(contentPanel);
	},

	/**
	 * Event handler which is raised before the {@link Grommunio.core.ui.ContentPanel contentPanel} is
	 * being shown. This will raise the {@link #createcontentpanel} event to allow any
	 * listeners to hook into further events coming from the given
	 * {@link Grommunio.core.ui.ContentPanel contentPanel}.
	 *
	 * @param {Ext.Container} contentPanel The contentPanel which is being rendered
	 * @private
	 */
	onContentPanelShow: function(contentPanel)
	{
		this.fireEvent('createcontentpanel', contentPanel);
	},

	/**
	 * Event handler which is raised when the {@link Grommunio.core.ui.ContentPanel contentPanel} is
	 * being hidden. This will raise the {@link #destroycontentpanel} event to inform
	 * any listeners that their {@link Grommunio.core.ui.ContentPanel contentPanel} is going to disappear.
	 *
	 * @param {Ext.Container} contentPanel The contentPanel which is being destroyed
	 * @private
	 */
	onContentPanelHide: function(contentPanel)
	{
		this.fireEvent('destroycontentpanel', contentPanel);
	},

	/**
	 * Find instances of {@link Grommunio.core.ui.ContentPanel contentPanel} from the {@link Grommunio.core.data.ContentPanelMgr ContentPanelMgr}.
	 * @param {Ext.Component} component the class name of the contentPanel for which we should perform the search.
	 * @return {Ext.util.MixedCollection} {@link Ext.util.MixedCollection MixedCollection} of contentPanels for specified
	 * component.
	 */
	getContentPanelInstances: function(component)
	{
		return this.contentPanels.filterBy(function(contentPanel) {
			return contentPanel instanceof component;
		});
	}
});

Grommunio.core.data.ContentPanelMgr = new Grommunio.core.data.ContentPanelMgr();
