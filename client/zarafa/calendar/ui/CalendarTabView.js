Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarTabView
 * @extends Zarafa.core.ui.View
 *
 * A tab that sits on top of a calendar view. Calendar views can show multiple folders at once, and each folder has
 * a corresponding tab. The tabs can be used to move the corresponding folder to the view left of it (merge), move
 * the folder into its own view (separate), close the view, or make it the active folder. 
 */
Zarafa.calendar.ui.CalendarTabView = Ext.extend(Zarafa.core.ui.View, {
	/**
	 * @cfg {String} title The title which must be displayed as tab title.
	 * If not provided, then the {@link #folder} {@link Zarafa.hierarchy.data.MAPIFolderRecord#getDisplayname name}
	 * will be used.
	 */
	title : undefined,

	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which is being loaded in the {@link Zarafa.calendar.ui.AbstractCalenderView Calendar}
	 * to which this {@link Zarafa.calendar.ui.CalendarTabView tab} is attached.
	 */
	folder : undefined,

	/**
	 * The &lt;div&gt; element which is used as tab. It is placed between the left ({@link #tabLeft}) and
	 * right ({@link #tabRight}) elements. These three elements together are the entire visible tab. This
	 * middle element is used to provide the background of the tab.
	 * @property
	 * @type Ext.Element
	 */
	tab : undefined,

	/**
	 * The &lt;div&gt; element which is used as the content container for the {@link #tabText},
	 * {@link #mergeIcon}, {@link #separateIcon} and {@link #closeIcon} elements. These combined
	 * elements represent the contents of the tab.
	 * @property
	 * @type Ext.Element
	 */
	tabContents : undefined,

	/**
	 * The &lt;div&gt; element which is used to contain the {@link #title} for this tab. It is placed
	 * on top of the tab. But depending on the availability of the {@link #mergeIcon} this could be
	 * placed a bit over the {@link #leftTab}.
	 * @property
	 * @type Ext.Element
	 */
	tabText : undefined,

	/**
	 * The &lt;div&gt; element which is used to display the merge icon. This icon has an event
	 * handler which can merge two {@link Zarafa.calendar.ui.AbstractCalendarView calendars}
	 * together. This icon is placed on top of the tab, but depending on the position settings,
	 * this could be placed a bit over the {@link #leftTab}. This element will only be visible
	 * if {@link #showMergeIcon} is true.
	 * @property
	 * @type Ext.Element
	 */
	mergeIcon : undefined,

	/**
	 * The &lt;div&gt; element which is used to display the separate icon. This icon has
	 * an event handler which can separate two {@link Zarafa.calendar.ui.AbstractCalendarView calendars}
	 * after they were merged together with {@link #mergeIcon}. This element will only be visible
	 * if {@link #showSeparateIcon} is true.
	 * @property
	 * @type Ext.Element
	 */
	separateIcon : undefined,

	/**
	 * The &lt;div&gt; element which is used to display the close icon. This icon has
	 * an event handler which can close the selected {@link Zarafa.calendar.ui.AbstractCalendarView calendar}.
	 * @property
	 * @type Ext.Element
	 */
	closeIcon : undefined,

	/**
	 * The total with for the tab to use. This must at least be the result of {@link #getMinimumWidth}.
	 * This is configured before {@link #layout} by {@link #setWidth}.
	 * @property
	 * @type Number
	 */
	width : 0,

	/**
	 * Indicates if the current tab is selected by the user. This adds the 'selected' postfix to the
	 * CSS className if it is set to true. This is configured using {@link #setSelected}.
	 * @property
	 * @type Boolean
	 */
	selected : true,

	/**
	 * Indicates if the current tab is in the active group of calendars
	 * @property
	 * @type Boolean
	 */
	active : false,

	/**
	 * Indicates if the {@link #mergeIcon} must be made visible. This is configured before
	 * {@link #layout} by {@link #setShowMergeIcon}.
	 * @property
	 * @type Boolean
	 */
	showMergeIcon : false,

	/**
	 * Indicates if the {@link #separateIcon} must be made visible. This is configured before
	 * {@link #layout} by {@link #setShowSeparateIcon}.
	 * @property
	 * @type Boolean
	 */
	showSeparateIcon : false,

	/**
	 * indicates if the {@link #closeIcon} must be made visible. This is configured before
	 * {@link #layout} by {@link #setShowCloseIcon}.
	 * @property
	 * @type Boolean
	 */
	showCloseIcon : false,

	/**
	 * @constructor
	 * @param {Object} config configuration object. 
	 */
	constructor : function(config)
	{
		config = config || {};
		
		//TODO: move this to a separate function or make a folder method for it?
		var displayName;
		if (config.folder) {
			displayName = config.folder.getFullyQualifiedDisplayName();
		}

		Ext.applyIf(config, {
			baseCls : 'zarafa-calendar',
			title : displayName ? Ext.util.Format.htmlEncode(displayName) : undefined
		});
		
		// define drag/drop events
		this.addEvents(
			/**
			 * @event merge
			 * Fires when the left arrow icon is clicked.
			 * @param {MAPIFolder} folder MAPI folder.
			 */
			'merge',
			/**
			 * @event separate
			 * Fires when the right arrow icon is clicked.
			 * @param {MAPIFolder} folder MAPI folder.
			 */
			'separate',
			/**
			 * @event close
			 * Fires when the close icon is clicked.
			 * @param {MAPIFolder} folder MAPI folder.
			 */
			'close',
			/**
			 * @event click
			 * Fires when the tab is clicked. 
			 * @param {MAPIFolder} folder MAPI folder.
			 */
			'click'
		);		
		
		Zarafa.calendar.ui.CalendarTabView.superclass.constructor.call(this, config);
	},
	
	/**
	 * Calculates the desired width of the tab, that is, the size required to show the text,
	 * close icon, and any other enabled icons (merge, separate). 
	 * Used by {@link Zarafa.calendar.ui.AbstractCalendarView AbstractCalendarView} to lay out and size the tabs. 
	 * @return {Number} desired tab width
	 */
	getDesiredWidth : function()
	{
		// textMetrics has not been set up if not rendered. 
		if (!this.rendered) {
			return 0;
		}

		// Desired width is the minimum width (due to the icons), plus the width of the tab text.
		// We use the TextMetrics to calculate the width and height for the
		// contents of the tabText.
		var addClass = !this.tabContents.hasClass('zarafa-calendar-tab-selected');
		if ( addClass ){
			this.tabContents.addClass('zarafa-calendar-tab-selected');
		}
		var textMetrics = Ext.util.TextMetrics.createInstance(this.tabText);
		if ( addClass ){
			this.tabContents.removeClass('zarafa-calendar-tab-selected');
		}
		
		var desiredWidth = this.getMinimumWidth() + textMetrics.getWidth(this.title);

		// Check if we don't want a bigger width because of a min-width set in the css files
		this.tabContents.dom.style.removeProperty('min-width');
		var cssMinWidth = parseInt(this.tabContents.getStyle('min-width')) + this.tabContents.getPadding('lr');
		
		return Math.max(desiredWidth, cssMinWidth);
	},
	
	/**
	 * Calculates the minimum width of the tab, that is, the size required to show the close icon and
	 * any other enabled icons (merge, separate). This means the tabs should always be large enough to
	 * at least show all the icons.
	 * Used by {@link Zarafa.calendar.ui.AbstractCalendarView AbstractCalendarView} to lay out and size the tabs. 
	 * @return {Number} minimum tab width
	 */
	getMinimumWidth : function()
	{
		if (!this.rendered) {
			return 0;
		}

		var width = this.tabContents.getPadding('lr');

		// Calculate the width of each icon
		if (this.showCloseIcon){
			width += this.closeIcon.getWidth();
		}
		if (this.showMergeIcon){
			width += this.mergeIcon.getWidth();
		}
		if (this.showSeparateIcon){
			width += this.separateIcon.getWidth();
		}

		return width;		
	},

	/**
	 * Sets the tab width. Called by the parent
	 * {@link Zarafa.calendar.ui.AbstractCalendarView AbstractCalendarView} before layout.
	 * @param {Number} width tab width.
	 */
	setWidth : function(width)
	{
		this.width = width;
	},

	/**
	 * Sets whether the folder this tab corresponds to is the selected folder for that view.
	 * The effect of setting this to 'true' is that the text on the tab is shown in bold face.
	 * This.will also update the classNames assigned to {@link #tabBackground} and {@link #tabContents}.
	 * @param {Boolean} selected true iff the tab should be displayed as selected. 
	 * @param {Boolean} active true iff the tab should be displayed as active.
	 * This is different from selected in that only one tab can be active at any one point,
	 * while there is one selected tab for each calendar (i.e. the one on top, whose color scheme is used)
	 * @param {Boolean} init True to force the classes to be applied
	 */
	setSelected : function(selected, active, init)
	{
		if (init === true || this.selected !== selected || this.active !== active) {
			var className = this.getBaseClassName() + '-tab-selected';

			if (selected === true) {
				if (active === true) {
					this.tabContents.addClass(className);
					this.parentView.activeTabStroke.addClass(className);
				} else {
					this.tabContents.removeClass(className);
					this.parentView.activeTabStroke.removeClass(className);
				}
			} else {
				this.tabContents.removeClass(className);
				if (active !== true) {
					this.parentView.activeTabStroke.removeClass(className);
				}
			}
		}

		this.active = active;
		this.selected = selected;
	},

	/**
	 * Sets whether the merge icon (left arrow) is visible. When a tab belongs to the leftmost calendar
	 * view it cannot be moved to the left, thus the icon will not be displayed. 
	 * @param {Boolean} showMergeIcon true iff the merge icon should be displayed.
	 */
	setShowMergeIcon : function(showMergeIcon)
	{
		this.showMergeIcon = showMergeIcon;
	},
	
	/**
	 * Sets whether the separate icon (right arrow) is visible. When a calendar view is showing
	 * only a single folder, that folder cannot be separated out from the view, thus the icon will not be displayed. 
	 * @param {Boolean} showSeparateIcon true iff the merge icon should be displayed.
	 */
	setShowSeparateIcon : function(showSeparateIcon)
	{
		this.showSeparateIcon = showSeparateIcon;
	},
	
	/**
	 * Sets whether the close icon is visible. When a calendar view is showing only a single folder,
	 * that folder cannot be closed, thus the icon will not be displayed.
	 * @param {Boolean} showCloseIcon true iff the close icon should be displayed.
	 */
	setShowCloseIcon : function(showCloseIcon)
	{
		this.showCloseIcon = showCloseIcon;
	},
	
	/**
	 * Assign each {@link Ext.Element element} generated during {@link #render} with
	 * a CSS className. This will use {@link #getClassName} to obtain the desired
	 * className for each element.
	 * @private
	 */
	applyCSSClassNames : function()
	{
		var contextModel = container.getCurrentContext().getModel();
		if (contextModel instanceof Zarafa.calendar.CalendarContextModel) {
			var colorScheme = contextModel.getColorScheme(this.folder.get('entryid'));

			// Contents
			this.tabContents.dom.className = this.getClassName('tab', 'contents');
			this.mergeIcon.dom.className = this.getClassName('tab-icon', 'merge');
			this.tabText.dom.className = this.getClassName('tab-title');
			this.closeIcon.dom.className = this.getClassName('tab-icon', 'close');
			this.separateIcon.dom.className = this.getClassName('tab-icon', 'separate');
			
			this.tabContents.applyStyles({
				'background-color' : colorScheme.header
			});

			// Call setSelected to force the classed to be updated accordingly
			if (this.selected) {
				this.setSelected(this.selected, this.active, true);
			}
		}
	},

	/**
	 * Lays out the components of the tab.
	 * @protected
	 */
	onLayout : function()
	{
		// Apply CSS to all created elements
		// FIXME: We already did this during render, and we only repeat it here in
		// case things like the themeCls have been changed. We should however have
		// some mechanism to only set new class names when a given condition for a
		// particular class name has changed.
		this.applyCSSClassNames();

		var contextModel = container.getCurrentContext().getModel();
		if (contextModel instanceof Zarafa.calendar.CalendarContextModel) {
			var colorScheme = contextModel.getColorScheme(this.folder.get('entryid'));
			// Check if we have a light or dark color by converting the color code to HSL and checking the L-value
			var isDarkColor = Zarafa.core.ColorSchemes.getLuma(colorScheme.base) < 155;
			if ( !isDarkColor ){
				this.tabContents.addClass('light-background');
			}
		}

		// Add or remove classes to the container, so we can style it properly
		if ( this.showMergeIcon ){
			this.tabContents.addClass('zarafa-with-merge-icon');
		} else {
			this.tabContents.removeClass('zarafa-with-merge-icon');
		}
		if ( this.showSeparateIcon ){
			this.tabContents.addClass('zarafa-with-separate-icon');
		} else {
			this.tabContents.removeClass('zarafa-with-separate-icon');
		}
		if ( this.showCloseIcon ){
			this.tabContents.addClass('zarafa-with-close-icon');
		} else {
			this.tabContents.removeClass('zarafa-with-close-icon');
		}

		this.tabContents.setWidth(this.width);
		this.tabText.setWidth(this.width - this.getMinimumWidth());

		// Left arrow (merge left) icon.
		this.mergeIcon.setVisible(this.showMergeIcon);

		// The tabText element is a div that's laid out on top of the actual tab images and contains, surprise surprise,
		// the tab text.
		if (this.tabText.dom.innerHTML != this.title) {
			this.tabText.dom.innerHTML = this.title;
		}

		// Close icon.
		this.closeIcon.setVisible(this.showCloseIcon);

		// Right icon.
		this.separateIcon.setVisible(this.showSeparateIcon);
		
		Zarafa.calendar.ui.CalendarTabView.superclass.onLayout.call(this);
	},

	/**
	 * Renders the tab. This will create the {@link #tabBackground},
	 * {@link #tabContents} contains with the underlying {@link #tabLeft}, {@link #tabRight}, {@link #tab},
	 * {@link #tabText}, {@link #mergeIcon}, {@link #separateIcon} and {@link #closeIcon} elements.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		// Container divs
		this.createDiv(this.parentView.tabArea, 'tabContents');
	
		// content divs
		this.createDiv(this.tabContents, 'mergeIcon');
		this.createDiv(this.tabContents, 'tabText');
		this.createDiv(this.tabContents, 'closeIcon');
		this.createDiv(this.tabContents, 'separateIcon');
		
		this.mergeIcon.setVisibilityMode(Ext.Element.DISPLAY);
		this.closeIcon.setVisibilityMode(Ext.Element.DISPLAY);
		this.separateIcon.setVisibilityMode(Ext.Element.DISPLAY);

		this.mon(this.mergeIcon, 'click', this.onMerge, this);
		this.mon(this.separateIcon, 'click', this.onSeparate, this);
		this.mon(this.closeIcon, 'click', this.onClose, this);
		this.mon(this.tabText, 'click', this.onClick, this);

		// We use the TextMetrics to calculate the width and height for the
		// contents of the tabText.
		this.tabText.textMetrics = Ext.util.TextMetrics.createInstance(this.tabText);

		// Apply CSS to all created elements, this will guarentee that we can request
		// styles from the elements like getWidth() and getMargins().
		this.applyCSSClassNames();

		Zarafa.calendar.ui.CalendarTabView.superclass.render.call(this, container);
	},
	
	/**
	 * Handles the 'click' event of the merge icon, and fires the {@link #merge} event.
	 * @private
	 */
	onMerge : function()
	{
		this.fireEvent('merge', this.folder);
	},
	
	/**
	 * Handles the 'click' event of the separate icon, and fires the {@link #separate} event.
	 * @private
	 */
	onSeparate : function()
	{
		this.fireEvent('separate', this.folder);
	},
	
	/**
	 * Handles the 'click' event of the close icon, and fires the {@link #close} event.
	 * @private
	 */
	onClose : function()
	{
		this.fireEvent('close', this.folder);
	},
	
	/**
	 * Handles the 'click' event of the tab text, and fires the {@link #click} event.
	 * @private
	 */
	onClick : function()
	{
		this.fireEvent('click', this.folder);
	}
});
