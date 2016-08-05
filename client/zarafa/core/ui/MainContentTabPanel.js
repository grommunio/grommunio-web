Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.MainContentTabPanel
 * @extends Ext.TabPanel
 * This subclass is used in the main content area, and contains the ContextContainer and dialogs that the user opens
 * Initialized in MainViewport.CreateContentContainer
 */
Zarafa.core.ui.MainContentTabPanel = Ext.extend(Ext.TabPanel, {

	/**
	 * Overriden to modify the tab depending on whether the record has been edited or not
	 * This method is called when a contained component fires the 'titlechange' event
	 * @param {Component} item
	 * @param {String} title
	 * @override
	 * @private
	 */
	onItemTitleChanged : function(item, title, oldTitle)
	{
		var el = this.getTabEl(item);
		if (el) {
			// now elide title if it exceeds 20 character length
			var tab = Ext.get(el).child('.x-tab-strip-text', true);

			// Change tooltip, and give full title in tab tool tip
			tab.qtip = title;

			tab.innerHTML = Ext.util.Format.htmlEncodeElide(title, 20, 0);
		}
	},

	/**
	 * This method is called when a contained component fires the 'iconchange' event
	 * @param {Component} item
	 * @param {String} iconCls icon class to apply
	 * @param {String} oldCls The previous icon class
	 * @private
	 */
	onItemIconChanged : function(item, iconCls, oldCls)
	{
		var tabEl = this.getTabEl(item);
		if (!Ext.isEmpty(tabEl)) {
			// removeClass only works when the CSS classes have been split
			// into an array, as it will not do it manually. For addClass,
			// we do not have this restriction.
			if (oldCls) {
				oldCls = oldCls.split(' ');
			}

			var tabText = Ext.get(tabEl).child('.x-tab-strip-text');
			if (iconCls) {
				tabText.addClass('x-tab-strip-icon');
				tabText.replaceClass(oldCls, iconCls);
			} else {
				tabText.removeClass('x-tab-strip-icon');
				tabText.removeClass(oldCls);
			}
		}
	},

	/**
	 * This method is called when contained component fires the 'userupdaterecord' event
	 * @param {Component} item The item which fired the event
	 * @param {Ext.data.Record} record Which was updated by the user
	 * @param {Boolean} changed True if the item has been changed by the user
	 * @private
	 */
	onItemUserUpdateRecord : function(item, record, changed)
	{
		var el = this.getTabEl(item);
		if (el) {
			var tab = Ext.get(el).child('.x-tab-strip-text');
			if (record.phantom || changed) {
				tab.addClass('zarafa-tab-edited');
			} else {
				tab.removeClass('zarafa-tab-edited');
			}
		}
	},

	/**
	 * Overriden in order to listen to close event of child component
	 * @param {Component} item
	 * @param {Number} index
	 * @override
	 * @private
	 */
	initTab : function(item, index)
	{
		var title = item.title;
		if(!Ext.isEmpty(title)) {
			// provide a tooltip for tab titles
			item.tabTip = title;
			// now we can shorten the length of title if its exceeding 20 characters
			item.title = Ext.util.Format.htmlEncodeElide(title, 20, 0);
		}

		Zarafa.core.ui.MainContentTabPanel.superclass.initTab.call(this, item, index);

		item.on({
			scope : this,
			render : this.applyTooltip,
			iconchange : this.onItemIconChanged,
			userupdaterecord : this.onItemUserUpdateRecord,
			close : this.onTabClose
		});
	},

	/**
	 * This will apply tooltip on close button ('X') of {@link Ext.Panel Panel}.
	 * @param {Component} item.
	 */
	applyTooltip : function(item)
	{
		var el = item.tabEl;
		var closeTab = Ext.get(el).child('.x-tab-strip-close', true);
		if(closeTab) {
			closeTab.qtip = _('Close') + ' (Ctrl + Alt + W)';
		}
	},

	/**
	 * Handler for closing a tab when a child component has fired its close event
	 * For instance when a mail is sent, the MailCreateContentPanel needs to be closed
	 * @param {Component} tab
	 */
	onTabClose : function(tab)
	{
		if (this.fireEvent('beforeclose', tab)!==false) {
			this.remove(tab);
			this.fireEvent('close', tab);
		}
	},

	/**
	 * handler for the '+' button in the tab strip
	 * adds a new item of type depending on current context
	 * @param {Ext.EventObjectImpl} e Event object
	 * @param {Element} t Event target
	 * @param {Object} o Configuration object
	 */
	onTabAddClick : function(e, t, o)
	{
		var model = container.getCurrentContext().getModel();

		if(model){

			if(model.createRecord === Ext.emptyFn) {
				//if unable to create record from the current context model, try to get the model based on the scope of the mainToolbar button
				var button = container.getMainPanel().mainToolbar.newButton;
				model = button.scope.model;
			}

			var record = model.createRecord();
			if (!record) {
				//if unable to create record from the current context model, invoke the handler of the first item in the 'new' menu
				var button = container.getMainPanel().mainToolbar.newButton;
				button.handler.call(button.scope);
				return;
			} else {
				// This will always use tab layer only, no matter what layer is configured in settings
				Zarafa.core.data.UIFactory.openCreateRecord(record, {layerType : 'tab'});
			}
		}
	},

	/**
	 * Overriden in order to add the '+' button to the edge of the tabstrip
	 * @param {Ext.Element} ct Container in which the panel is created
	 * @param {Element} position Element at which the panel is created (relative to its position)
	 * @override
	 */
	onRender : function(ct, position)
	{
		Zarafa.core.ui.MainContentTabPanel.superclass.onRender.call(this, ct, position);

		// insert add button into the edge element
		var edge = this.edge.update('<span id="zarafa-mainpanel-addtabbutton" class=\'x-tab-add\'></span>');
		this.mon(edge, 'click', this.onTabAddClick, this);

		// set tooltip on add button
		var addBtn = edge.child('.x-tab-add', true);
		addBtn.qtip = _('New item') + ' (Ctrl + Alt + N)';
	},

	/**
	 * Overriden in order to call close() on the item, instead of removing it immediately
	 * This allows the contained panel to fire a confirmation dialog
	 * @param {Ext.EventObjectImpl} e Event
	 * @private
	 * @override
	 */
	onStripMouseDown : function(e)
	{
		if (e.button !== 0) {
			return;
		}


		var target = this.findTargets(e);
		if (target.close) {
			target.item.close();
			return;
		}
		if (target.item && target.item != this.activeTab) {
			this.setActiveTab(target.item);
		}
	},

	/**
	 * Overriden so that '+' sign for adding tabs remains visible when there are scroll buttons
	 * @private
	 * @override
	 */
	getScrollWidth : function()
	{
		return this.edge.getOffsetsTo(this.stripWrap)[0] + this.getScrollPos() + this.edge.getWidth();
	}
});
