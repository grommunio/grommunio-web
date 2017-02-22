Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.ContextContainer
 * @extends Zarafa.core.ui.SwitchViewContentContainer
 *
 * The ContextContainer is a light-weight ExtJS container that holds several child
 * components in a card layout, and is populated using an insertion point.
 * Each child item belongs to a ContentContext, and corresponding children are
 * made visible when contexts are switched. Two examples of ContextContainer objects
 * in the main layout are the top tool bar and the main content panel. Each available
 * content context (mail, tasks, etc) registers exactly one component with each named
 * context container (main.toolbar, main.content). When a folder is selected via
 * the hierarchy panel on the left and a context switch is needed (ie, when a mail
 * folder is selected the mail toolbar and mail content panel need to be shown) the
 * context containers will show the child items that correspond to the newly selected
 * context.
 */
Zarafa.core.ui.ContextContainer = Ext.extend(Zarafa.core.ui.SwitchViewContentContainer, {
	/**
	 * @cfg {String} name The name of the context container.
	 */
	name : undefined,

	/**
	 * @cfg {String} title The title of this component. Generally used only by owner container
	 */
	title : undefined,
	
	/**
	 * @constructor
	 * @param config configuration object
	 */
	constructor : function(config)
	{
		if (config.name) {
			this.name = config.name;
		}

		// Gather child components through an insertion point.
		var items = [];
		var lazyItems = container.populateInsertionPoint(this.name, config.scope);

		// Go over all plugins which have inserted components, each item needs to
		// be assigned with a unique ID which is made up out of this container's name
		// and the name of the plugins that inserted them. We use this for switching
		// between them.
		// At the same time we will be looking for components that were added by the
		// currently active context, as those will be set as the default component.
		var currentContext = container.getCurrentContext();
		Ext.each(lazyItems, function(item) {
			var pluginName = item.context.getName();

			// Check if this is the default component
			if (currentContext && pluginName === currentContext.getName()) {
				items.push(item);
			}
		}, this);

		// Standard configuration.
		Ext.applyIf(config, {
			autoDestroy : true,
			layout : 'card',
			deferredRender : 'false',
			hideMode : 'offsets',
			size : 'auto',
			border : false,
			lazyItems : lazyItems,
			items : items,
			activeItem : 0,
			// Fix for ExtJS 3.1
			forceLayout : true
		});

		this.addEvents(
			/**
			 * @event titlechange
			 * This event behaves similarly to the one in {@link Ext.Panel} Panel.
			 * Its primary purpose is to notify its parent containers of a title change.
			 * The idea is that this event will be passed on to an adapter that would know how to update the actual container
			 * @param {Ext.Component} this The component that fired the event
			 * @param {String} title New title that is being set on the container
			 * @param {String} oldTitle The previous title of this container
			 */
			 'titlechange',

			/**
			 * @event iconchange
			 * Fired when the icon class of this component is changed.
			 * Its primary purpose is to notify its parent containers of the change.
			 * @param {Ext.Component} this THe component that fired the event
			 * @param {String} iconCls The new icon class
			 * @param {String} oldIconCls The old icon class
			 */
			 'iconchange'
		);
		
		Zarafa.core.ui.ContextContainer.superclass.constructor.call(this, config);

		this.init();
	},

	/**
	 * Initialises the component.
	 * @private
	 */
	init : function()
	{
		this.mon(container, 'contextswitch', this.onContextSwitch, this);
		this.mon(container, 'folderselect', this.onFolderSelect, this);

		//initialize title
		var model = container.getCurrentContext().getModel(),
			title, iconCls;
		if(model){
			var folder =  model.getDefaultFolder();
			if(folder){
				title = folder.getFullyQualifiedDisplayName();
				iconCls = Zarafa.common.ui.IconClass.getIconClass(folder);
			}
		} else {
			title = container.getCurrentContext().getDisplayName();
		}

		this.setTitle(title);
		this.setIcon(iconCls);
	},

	/**
	 * Set the title for this component
	 * The event 'titlechange' is fired to notify owner container of the change
	 * (for instance a tab panel would want to change the tab title, a window - the window title, etc.)
	 * @param {String} title The new title to set
	 */
	setTitle : function(title)
	{
		var oldTitle = this.title;
		this.title = title;

		this.fireEvent('titlechange', this, title, oldTitle);
	},
	
	/**
	 * Set the icon class for this component
	 * The event 'iconchange' is fired to notify the owner container of the change
	 * tab panels, for instance could place an icon in this component's tab
	 * @param {String} iconCls The new icon class to set
	 */
	setIcon : function(iconCls)
	{
		var oldIconCls = this.iconCls;
		this.iconCls = iconCls;

		this.fireEvent('iconchange', this, iconCls, oldIconCls);
	},
	
	/**
	 * Handler for the 'contextswitch' event triggered by the Zarafa.core.Container
	 * Switches between child items depending on the context they belong to. Switching
	 * to 'mail' shows the component associated with the mail context and hides all others.
	 * @param {Object} parameters Parameters passed to the context switch
	 * @param {String} oldContext name of the context that was last active
	 * @param String newContext name of the context to be made visible (mail, task, calendar, etc) 
	 * @private
	 */
	onContextSwitch : function(parameters, oldContext, newContext)
	{
		var oldItem = this.getActiveItem();
		var newItem = this.findBy(function(item) { return item.context === newContext; });
		var visible = true;

		if (!Ext.isEmpty(newItem)) {
			newItem = newItem[0];
			this.layout.setActiveItem(newItem.id);
		} else {
			visible = false;
		}

		if (this.isVisible() != visible) {
			this.setVisible(visible);
		}
		
		// TODO: We should enable some timeout mechanism which
		// removes and deletes the oldView after a particular timeout.
		// This should increase performance when switching between 2
		// views often.
		if (this.autoClean === true && oldItem && oldItem != newItem) {
			this.remove(oldItem);
			/*jshint -W051 */
			delete oldItem;
		}
		var model = newContext.getModel();
		var folder, title, iconCls;
		if(model){
			folder = model.getDefaultFolder();
		}
		if(folder){
			title = folder.getFullyQualifiedDisplayName();
			iconCls = Zarafa.common.ui.IconClass.getIconClass(folder);
		} else {
			title = newItem.title;
			iconCls = newItem.iconCls;
		}
		this.setTitle(title);
		this.setIcon(iconCls);
	},
	
	/**
	 * Handler for the 'folderchange' event, triggered by Zarafa.core.Container when a folder is selected in the hierarchy
	 * @param {Zarafa.core.data.IPFRecord} folders
	 * @private
	 */
	onFolderSelect : function(folders)
	{
		var title, iconCls, folder;
		if(folders){
			if(Array.isArray(folders)){
				folder = folders[0];
			} else {
				folder = folders;
			}
			title = folder.getFullyQualifiedDisplayName();
			iconCls = Zarafa.common.ui.IconClass.getIconClass(folder);
		} else {
			title = container.getCurrentContext().getDisplayName();
		}

		this.setTitle(title);
		this.setIcon(iconCls);
		//FIXME: why is this automatic for context switch but not for folder change?
		this.ownerCt.setActiveTab(0);
	}
});
