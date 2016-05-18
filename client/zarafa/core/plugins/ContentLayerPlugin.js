Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.ContentLayerPlugin
 * @extends Object
 * @ptype zarafa.contentlayerplugin
 *
 * The Plugin which must be installed on the {@link Zarafa.core.ui.ContentPanel}
 * to glue it together with the Content Layer on which the component is being
 * installed. This ensures that events and actions performed on the
 * {@link Zarafa.core.ui.ContentPanel panel} are forwarded correctly to the content layer.
 */
Zarafa.core.plugins.ContentLayerPlugin = Ext.extend(Object, {
	/**
	 * The Content Panel on which this plugin is installed.
	 * @property
	 * @type Zarafa.core.ui.ContentPanel
	 * @protected
	 */
	field : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},
	
	/**
	 * Initialize the plugin with the corresponding field.
	 * @param {Zarafa.core.ui.ContentPanel} field The panel on which the plugin is installed
	 */
	init : function(field)
	{
		this.field = field;

		// Listen for the moment the field was added to the parent container,
		// at that moment we can continue initializing.
		this.field.on('added', this.onAdded, this, { single : true });
	},

	/**
	 * This is called after {@link #init} when the {@link #field} has been fully initialized,
	 * and the owner of the component is known. This allows the plugin to access the parent.
	 *
	 * This will also {@link #focus} the component, to ensure it is visible for the user.
	 *
	 * @protected
	 */
	initPlugin : function()
	{
		this.focus();

		this.field.on('titlechange', this.onTitleChange, this);
		this.field.on('iconchange', this.onIconChange, this);
		this.field.on('hide', this.onHide, this);
		this.field.on('close', this.onClose, this);
	},

	/**
	 * Event handler for the {@link Ext.Component#added 'added'} event. At this moment
	 * we have access to the parent container in which the item was placed, but not
	 * all initialization might have been done yet. So this will register the
	 * {@link #onContainerAdd} event handler for the {@Link Ext.Component#add} event
	 * which is fired when the component is completely initialized.
	 * @param {Ext.Component} item The item which fired the event
	 * @param {Ext.Container} container The container on which the item was placed
	 * @private
	 */
	onAdded : function(item, container)
	{
		container.on('add', this.onContainerAdd, this);
	},

	/**
	 * Event handler for the {@link Ext.Container#add 'add'} event. At this moment
	 * the component must have been fully initialized so we can {@link #initPlugin finalize plugin initialization}.
	 * @param {Ext.Container} container The container which fired the event
	 * @param {Ext.Component} component The component which was added
	 * @private
	 */
	onContainerAdd : function(container, item)
	{
		if (this.field === item) {
			container.un('add', this.onContainerAdd, this);
			this.initPlugin();
		}
	},

	/**
	 * Event handler for the 'titlechange' event, fired by a {@link Ext.Component} that is managed by this plugin.
	 * @param {Zarafa.core.ui.ContentPanel} field The component that triggered the event
	 * @param {String} newTitle Title to set
	 * @param {String} oldTitle Previous title
	 * @private
	 */
	onTitleChange: function(field, newTitle, oldTitle)
	{
		this.setTitle(newTitle);
	},

	/**
	 * Event handler for the 'iconchange' event
	 * @param {Zarafa.core.ui.ContentPanel} field The component that triggered the event
	 * @param {String} newTitle Newly set title
	 * @param {String} oldTitle The previous title
	 * @private
	 */
	onIconChange: function(field, newIconCls, oldIconCls)
	{
		this.setIconClass(newIconCls);
	},

	/**
	 * Event handler for the 'hide' event
	 * @private
	 */
	onHide : function()
	{
		this.hide();
	},

	/**
	 * Event handler for the 'close' event
	 * @private
	 */
	onClose: function()
	{
		this.close();
	},

	/**
	 * This will apply the required title onto the {@link #field}
	 *
	 * Must be overridden by the subclasses
	 *
	 * @param {String} title The title to apply
	 * @protected
	 */
	setTitle : Ext.emptyFn,

	/**
	 * This will apply the required Icon Class onto the {@link #field}
	 *
	 * Must be overridden by the subclasses
	 *
	 * @param {String} iconCls The Icon Class to apply
	 * @protected
	 */
	setIconClass : Ext.emptyFn,

	/**
	 * This will hide panel containing the {@link #field}
	 *
	 * Must be overridden by the subclasses
	 *
	 * @protected
	 */
	hide : Ext.emptyFn,

	/**
	 * This will close panel containing the {@link #field}
	 *
	 * Must be overridden by the subclasses
	 *
	 * @protected
	 */
	close : Ext.emptyFn,

	/**
	 * This will bring focus to the Container by bringing it
	 * to the attention of the user.
	 *
	 * Must be overridden by subclasses
	 *
	 * @protected
	 */
	focus : Ext.emptyFn
});

Ext.preg('zarafa.contentlayerplugin', Zarafa.core.plugins.ContentLayerPlugin);
