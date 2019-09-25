Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.BoxField
 * @extends Ext.form.ComboBox
 * @xtype zarafa.boxfield
 *
 * A special input field which displays all contents inside special {@link Zarafa.common.ui.Box}
 * components which are rendered inside this {@link #el}. This makes the user interface nicer,
 * and allows the user to perform extra actions on each box.
 *
 * The contents of the field is based on the contents of the {@link #boxStore} which contains
 * the {@link Ext.data.Record records} which must be rendered as {@link Zarafa.common.ui.Box box}.
 */
Zarafa.common.ui.BoxField = Ext.extend(Ext.form.ComboBox, {
	/**
	 * @cfg {String} boxType The xtype of the component which is used as box.
	 * This defaults to {@link Zarafa.common.ui.Box 'zarafa.box'}.
	 */
	boxType: 'zarafa.box',
	/**
	 * @cfg {Ext.data.Store} boxStore The store which contains all {@link Ext.data.Record records}
	 * which must be rendered as {@link Zarafa.common.ui.Box}. Before rendering, the contents
	 * will be filtered by {@link #filterRecords}.
	 */
	boxStore: undefined,
	/**
	 * @cfg {Object} boxConfig A configuration object which must be applied to all
	 * {@link Zarafa.common.ui.Box box} components which are rendered into this component
	 * by default.
	 */
	boxConfig: undefined,
	/**
	 * The collection of all {@link Zarafa.common.ui.Box Box} components which have been
	 * rendered inside the component.
	 * @property
	 * @type Ext.util.MixedCollection
	 */
	items: undefined,
	/**
	 * @cfg {Number|Char} handleInputKey The input key which must be pressed before the
	 * {@link #handleInput} function is being called. This is normally used to indicate
	 * that the current input is ready to be converted into {@link #items boxes}.
	 * This can be given as a charCode directly, or as a character,
	 * in which case it will be converted to the corresponding code using charCodeAt().
	 */
	handleInputKey: ';',
	/***
	 * @cfg {Boolean} enableComboBox True to enable all combobox functionality on this field.
	 * When this is true, all required fields from the {@link Ext.from.ComboBox Ext.form.ComboBox}
	 * must be configured.
	 */
	enableComboBox : true,
	/**
	 * The {@link Zarafa.common.ui.Box box} which currently has the userfocus.
	 * @property
	 * @type Zarafa.common.ui.Box
	 */
	currentFocus: false,
	/**
	 * A dummy 'a' element which is created as child of the {@link #wrap}. This element is
	 * not hidden, but instead has the dimensions 0x0, otherwise the browser is not able to
	 * put the focus on the element. By using this focus element, we can capture {@link #keyMap} events
	 * and control the different {@link #items boxes}.
	 * @property
	 * @type Ext.Element
	 */
	boxFocusEl : undefined,
	/**
	 * The 'ul' element which contains all rendered {@link #items} and the {@link #inputEl}.
	 * @property
	 * @type Ext.Element
	 */
	wrapBoxesEl : undefined,
	/**
	 * The 'li' element which has been wrapped around {@link #el}, and is to make sure the
	 * input element is positioned correctly within the list. This should always be the
	 * last element inside the {@link #wrapBoxesEl}.
	 * @property
	 * @type Ext.Element
	 */
	inputEl : undefined,
	/**
	 * The {@link Ext.KeyMap} which is used on the {@link #boxFocusEl} to add keyboard
	 * control over the current {@link #items box} selection. This will only be enabled
	 * when this field is {@link #editable editable}.
	 *
	 * @property
	 * @type Ext.KeyMap
	 */
	boxKeyMap : undefined,

	/**
	 * The {@link Ext.KeyMap} which is used on the {@link #el} to add keyboard
	 * control over the input field. This will only be enabled
	 * when this field is {@link #editable editable}.
	 * This KeyMap is currently only used for the handleInputKey,
	 * which causes the BoxField to evaluate its input and convert it to boxes.
	 * This is separated from {@link #specialInputKeyMap} because it needs reliable
	 * character code detection, which can only happen on a 'keypress' event.
	 *
	 * @property
	 * @type Ext.KeyMap
	 */
	inputKeyMap : undefined,

	/**
	 * The {@link Ext.KeyMap} which is used on the {@link #el} to add keyboard
	 * control over the input field. This will only be enabled
	 * when this field is {@link #editable editable}.
	 * This KeyMap is used only for special keys
	 * that do not insert characters (e.g. arrow keys, page up/down, enter, etc.).
	 * These keys are separated from {@link #inputKeyMap} because they have to be caught on
	 * a 'keydown' event.
	 *
	 * @property
	 * @type Ext.KeyMap
	 */
	specialInputKeyMap : undefined,

	/**
	 * The {@link Ext.KeyMap} which is used on the {@link #el} to add keyboard control
	 * for DELETE key. This will only be enabled when {@link #enableComboBox} is configured true.
	 *
	 * @property
	 * @type Ext.KeyMap
	 */
	listKeyMap : undefined,

	/**
	 * @cfg {Number} minInputFieldWidth The minimum number of pixels which must be available
	 * for the {@link #el input field}, to type in the text. The number of pixels should be
	 * sufficient to at least contain 1 character (in any characterset).
	 */
	minInputFieldWidth : 25,

	/**
	 * @cfg {Number} inputFieldHeight The default height for the {@link #el input field}.
	 */
	inputFieldHeight: 20,

	/**
	 * @cfg {Boolean} enableAnim Enable special {@link Ext.Fx FX} effects for
	 * this this field and all container {@link #items boxes}.
	 */
	enableAnim : true,

	/**
	 * @cfg {String} wrapCls The CSS classes which must be applied to the {@link #wrap} element.
	 */
	wrapCls : 'x-form-text x-zarafa-boxfield',

	/**
	 * Instance of the {@link Ext.util.TextMetrics TextMetrics} which is bound to the {@link #innerList}.
	 * This is used to calculate the desired width of text inside the {@link #innerList}. This field
	 * should only be obtained by the {@link #getListTextMetric} function.
	 * @property
	 * @type Ext.util.TextMetrics
	 */
	listTextMetric : undefined,

	/**
	 * Instance of the {@link Ext.util.TextMetrics TextMetrics} which is bound to the {@link #el}.
	 * This is used to calculate the desired width of text inside the {@link #el}. This field
	 * should only be obtained by the {@link #getInputTextMetric} function.
	 * @property
	 * @type Ext.util.TextMetrics
	 */
	inputTextMetric : undefined,

	/**
	 * @cfg {Boolean} listMode True to show all boxes in a list rather then side-by-side.
	 * When enabled, all boxes (and input field) will get the full width of the component.
	 */
	listMode : false,

	/**
	 * @cfg {Number} boxLimit If set, this number will limit the number of boxes which will
	 * be rendered into the field. It will also disable the {@link #inputEl} when the limit
	 * has been reached.
	 */
	boxLimit : undefined,

	/**
	 * @cfg {String}
	 * A simple CSS selector (e.g. div.some-class or span:first-child) that will be used to
	 * determine what extra nodes are required to be added into each of the dropdown-list item.
	 */
	extraItemSelector : undefined,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (config.readOnly === true) {
			config.editable = false;
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.boxfield',
			cls : 'x-zarafa-boxfield-input',
			hideTrigger : true,

			autoHeight: true,
			autoScroll: true,
			
			/*
			 * Override value of Ext.form.TriggerField
			 * Because we don't want TAB-key to blur the element
			 */
			monitorTab: false
		});
		config.wrapCls = config.wrapCls ? config.wrapCls + ' '  + this.wrapCls : this.wrapCls;

		this.addEvents(
			/**
			 * @event boxfocus
			 * Fired when a box receives focus
			 * @param {Zarafa.common.ui.BoxField} boxField Parent of the box
			 * @param {Zarafa.common.ui.Box} box The box that has been focussed
			 * @param {Ext.data.Record} record The record that belongs to the box
			 */
			'boxfocus',
			/**
			 * @event boxblur
			 * Fired when a box looses focus
			 * @param {Zarafa.common.ui.BoxField} boxField Parent of the box
			 * @param {Zarafa.common.ui.Box} box The box that has been blurred
			 * @param {Ext.data.Record} record The record that belongs to the box
			 */
			'boxblur',
			/**
			 * @event boxclick
			 * Fires when the user clicked on a box
			 * @param {Zarafa.common.ui.BoxField} boxField Parent of the box
			 * @param {Zarafa.common.ui.Box} box The box that has been clicked
			 * @param {Ext.data.Record} record The record that belongs to the box
			 */
			'boxclick',
			/**
			 * @event boxdblclick
			 * Fires when the user doubleclicked on a box
			 * @param {Zarafa.common.ui.BoxField} boxField Parent of the box
			 * @param {Zarafa.common.ui.Box} box The box that has been doubleclicked
			 * @param {Ext.data.Record} record The record that belongs to the box
			 */
			'boxdblclick',
			/**
			 * @event boxcontextmenu
			 * Fires when the user requested the contextmenu for a box
			 * @param {Zarafa.common.ui.BoxField} boxField Parent of the box
			 * @param {Zarafa.common.ui.Box} box The box for which the contextmenu was requested
			 * @param {Ext.data.Record} record The record that belongs to the box
			 */
			'boxcontextmenu',
			/**
			 * @event boxadd
			 * Fires when a box has been added
			 * @param {Zarafa.common.ui.BoxField} boxField Parent of the to be added box
			 * @param {Zarafa.common.ui.Box} box The box that has been added
			 * @param {Ext.data.Record} record The record that belongs to the box
			 */
			'boxadd',
			/**
			 * @event boxremove
			 * Fires when a box will be removed.
			 * @param {Zarafa.common.ui.BoxField} boxField Parent of the to be removed box
			 * @param {Zarafa.common.ui.Box} box The box that will be removed
			 * @param {Ext.data.Record} record The record that belongs to the box
			 */
			'boxremove'
		);

		Zarafa.common.ui.BoxField.superclass.constructor.call(this, config);

		this.on('boxremove', this.onBoxRemove, this);
		this.on('boxadd', this.onBoxAdd, this);
	},

	/**
	 * Called by the superclass to initialize the component
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.common.ui.BoxField.superclass.initComponent.call(this);
		this.items = new Ext.util.MixedCollection();

		// Convert input key to character code if necessary
		if (Ext.isString(this.handleInputKey)) {
			this.handleInputKey = this.handleInputKey.charCodeAt(0);
		}
		
		this.previousHeight = this.height;
	},

	/**
	 * Called by the superclass to initialize all events for this component.
	 * This is called on {@link #afterrender}.
	 * @private
	 */
	initEvents : function()
	{
		this.mon(this.el, {
			keydown : this.onKeyDownHandler,
			scope   : this
		});

		this.mon(this.getContentTarget(), 'click', this.onContainerClick, this);

		// Initialize keyboard control
		if (this.editable !== false) {
			this.boxKeyMap = this.createBoxKeyMap(this.boxFocusEl);
			this.specialInputKeyMap = this.createSpecialInputKeyMap(this.el);
			this.inputKeyMap = this.createInputKeyMap(this.el);

			// Initialize keyboard control for suggestion list, only
			// if {@link #enableComboBox} configured to true.
			if (this.enableComboBox === true) {
				this.listKeyMap = this.createListKeyMap(this.el);
			}

			/*
			 * Register the event handler for paste events. This will ensure
			 * the input element will be resized when pasting.
			 * Use the Zarafa.core.Event function to ensure compatibility
			 * with all browsers and support for drag & dropping text.
			 */
			Zarafa.core.Events.addPasteEventHandler(this, this.el, this.onPaste, this);
		}

		// Register event handler when listMode is enabled,
		// this will force the boxes to be resized when the parent
		// has been layed out.
		if (this.listMode === true) {
			this.mon(this.ownerCt, 'afterlayout', this.onParentLayout, this);
		}

		// Listen to select events in order to convert them to boxes.
		this.on('select', this.onSelect, this);

		Zarafa.common.ui.BoxField.superclass.initEvents.call(this);
	},

	/**
	 * Overridden to relay the value of {@link #extraItemSelector} to respective {@link Ext.DataView#extraItemSelector}
	 * and start listening to the {@link Ext.DataView#extraitemclick}, {@link Ext.DataView#mouseenter}
	 * and {@link Ext.DataView#mouseleave} event.
	 */
	initList : function()
	{
		Zarafa.common.ui.BoxField.superclass.initList.call(this);

		if(Ext.isDefined(this.extraItemSelector)) {
			this.view.extraItemSelector = this.extraItemSelector;

			this.view.on('extraitemclick', this.onExtraItemClick, this);
		}
	},

	/**
	 * Sets a new {@link boxStore boxStore}. It will first unregister all events from the old one.
	 * Then the new store will be set, the recipient field will be refreshed and after that the
	 * event listeners will be registered again.
	 * @param {Ext.data.Store} boxStore The store that will be applied to this field.
	 * @param {Boolean} initial True if this function is called from the constructor.
	 */
	setBoxStore: function(boxStore, initial)
	{
		if (this.boxStore === boxStore && initial !== true) {
			return;
		}

		if (this.boxStore) {
			this.mun(this.boxStore, {
				'datachanged': this.onBoxStoreDataChanged,
				'add': this.onBoxStoreAdd,
				'remove': this.onBoxStoreRemove,
				'update': this.onBoxStoreUpdate,
				'clear': this.onBoxStoreClear,
				scope: this
			});
			this.clearBoxes();
		}

		this.boxStore = Ext.StoreMgr.lookup(boxStore);

		if (this.boxStore) {
			this.loadBoxes(this.boxStore);
			this.mon(this.boxStore, {
				'datachanged': this.onBoxStoreDataChanged,
				'add': this.onBoxStoreAdd,
				'remove': this.onBoxStoreRemove,
				'update': this.onBoxStoreUpdate,
				'clear': this.onBoxStoreClear,
				scope: this
			});
		}
	},

	/**
	 * Returns the {@link boxStore boxStore}.
	 * @return {Ext.data.Store} The set {@link boxStore boxStore}.
	 */
	getBoxStore: function()
	{
		return this.boxStore;
	},

	/**
	 * Obtain (and create if required) the {@link #listTextMetric} instance.
	 * @return {Ext.util.TextMetrics} The textmetrics for {@link #innerList}.
	 * @private
	 */
	getListTextMetric : function()
	{
		if (!this.listTextMetric) {
			this.listTextMetric = Ext.util.TextMetrics.createInstance(this.innerList);
		}

		return this.listTextMetric;
	},

	/**
	 * Obtain (and create if required) the {@link #listTextMetric} instance.
	 * @return {Ext.util.TextMetrics} The textmetrics for {@link #el}.
	 * @private
	 */
	getInputTextMetric : function()
	{
		if (!this.inputTextMetric) {
			this.inputTextMetric = Ext.util.TextMetrics.createInstance(this.el);
		}

		return this.inputTextMetric;
	},

	/**
	 * The function that should handle the trigger's click event.
	 *
	 * This method is disabled if {@link #enableComboBox} is set to false.
	 *
	 * @param {EventObject} e
	 * @private
	 */
	onTriggerClick : function()
	{
		if (this.enableComboBox === true) {
			Zarafa.common.ui.BoxField.superclass.onTriggerClick.apply(this, arguments);
		}
	},

	/**
	 * Execute a query to filter the dropdown list.  Fires the {@link #beforequery} event prior to performing the
	 * query allowing the query action to be canceled if needed.
	 *
	 * This method is disabled if {@link #enableComboBox} is set to false.
	 *
	 * @param {String} query The SQL query to execute
	 * @param {Boolean} forceAll <tt>true</tt> to force the query to execute even if there are currently fewer
	 * characters in the field than the minimum specified by the <tt>{@link #minChars}</tt> config option.  It
	 * also clears any filter previously saved in the current store (defaults to <tt>false</tt>)
	 * @private
	 */
	doQuery : function()
	{
		if (this.enableComboBox === true) {
			Zarafa.common.ui.BoxField.superclass.doQuery.apply(this, arguments);
		}
	},

	/**
	 * Check if the value typed into the field matches a record from the store.
	 *
	 * This method is disabled if {@link #enableComboBox} is set to false.
	 *
	 * @private
	 */
	assertValue : function()
	{
		if (this.enableComboBox === true) {
			Zarafa.common.ui.BoxField.superclass.assertValue.apply(this, arguments);
		}
	},

	/**
	 * Event handler which is called when any key related to navigation (arrows, tab, enter, esc,
	 * etc.) is pressed.
	 * @param {Ext.data.Record} record
	 * @private
	 */
	onSelect: function(record)
	{
		this.hideSuggestionList();
		this.handleSelection(record);
		this.lastQuery = '';
	},

	/**
	 * Function which is use to hide suggestion list and
	 * It will also remove all records from suggestion list store.
	 */
	hideSuggestionList: function ()
	{
		if (this.isExpanded()) {
			this.collapse();
			this.el.dom.value = '';
			this.sizeInputfield();
			this.store.removeAll(true);
		}
	},

	/**
	 * Calculate the desired width of the dropdown {@link #list}.
	 * This should only be called when {@link #list} has been filled with the
	 * data which is going to be shown, as we calculate the desired width
	 * based on the current contents of the {@link #list}.
	 *
	 * This means that if a subclass overrides {@link #tpl} and adds all sort
	 * of extra text, this function should still be relatively accurate in the
	 * required width.
	 *
	 * @private
	 */
	getDesiredListWidth : function()
	{
		var metric = this.getListTextMetric();
		var desiredWidth = 0;

		if (this.innerList.dom.children.length > 0) {
			for (var i = 0, len = this.innerList.dom.children.length; i < len; i++) {
				var child = Ext.fly(this.innerList.dom.children[i]);
				var width = child.getPadding('lr') + metric.getWidth(child.dom.innerHTML);

				if (width > desiredWidth) {
					desiredWidth = width;
				}
			}
		} else {
			desiredWidth = metric.getWidth(this.innerList.dom.innerHTML);
		}

		return desiredWidth;
	},

	/**
	 * Called just before the {@link #store} is going to call 'list' to the server.
	 * This will show a {@link #loadingText} in the {@link #list.
	 *
	 * We make sure that we resize our {@link #list} here using {@link #getDesiredListWidth}
	 * to guarentee that our {@link #loadingText} and loading image receive sufficient
	 * space.
	 *
	 * @private
	 */
	onBeforeLoad : function()
	{
		Zarafa.common.ui.BoxField.superclass.onBeforeLoad.apply(this, arguments);

		var width = this.getDesiredListWidth();
		this.restrictWidth(width);
	},

	/**
	 * Called when the {@link #store} has loaded and we can fill the dropdown list
	 * with the suggestionlist. Based on the records in the store we will also
	 * determine the {@link #getDesiredListWidth} desired width of the list.
	 *
	 * Note that this has been called after the dropdown box has been filled with
	 * the contents. Hence it is safe to call {@link #getDesiredListWidth} here.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record[]} records The records which were loaded from the server
	 * @param {Object} options The options object which were provided during load
	 * @private
	 */
	onLoad : function(store, records, options)
	{
		if (this.hasFocus && (this.store.getCount() > 0 || this.listEmptyText)) {
			var desiredWidth = this.getDesiredListWidth();

			// getDesiredListWidth obtains the desired width for
			// the 'innerList'. The 'list' however is slightly larger.
			desiredWidth += this.list.getFrameWidth('lr');

			// When there are sufficient results, a scrollbar is shown.
			// Add the required space.
			desiredWidth += Ext.getScrollBarWidth();

			// Resize the dropdownbox.
			this.restrictWidth(desiredWidth);
		}

		Zarafa.common.ui.BoxField.superclass.onLoad.apply(this, arguments);
	},

	/**
	 * Change the width of the {@link #list} and {@link #innerList}. We never
	 * fill out the dropdown list to the complete width of the field, and the
	 * list itself is aligned to the {@link #el} element (which can be positioned
	 * on various locations in the field depending on the number of {@link #items boxes}
	 * which have been rendered.
	 *
	 * The width must fall within the the {@link #minListWidth} and the {@link #container}
	 * width range. Depending on the width, and the position of the input element, we
	 * also have to force the list a few pixels to the left of the {@link #el} if by
	 * that we can prevent the list to exceed the limits of the field itself.
	 *
	 * @param {Number} width The desired width of the list
	 * @private
	 */
	restrictWidth : function(width)
	{
		var target = this.getEl();
		var container = this.getResizeEl();

		var offset = target.getOffsetsTo(container);
		var fieldWidth = container.getWidth();

		var desiredOffsetLeft = 0;
		var desiredOffsetBottom = target.getFrameWidth('b');
		var desiredWidth = width;

		// Establish the actual width we can apply for this list.
		if (this.minListWidth > desiredWidth) {
			desiredWidth = this.minListWidth;
		} else if (fieldWidth < desiredWidth) {
			// Don't restrict width of suggestion-list in case of zarafa.userlistbox
			// because container is smaller then the width of content of suggestion list.
			// And we don't want the ellipsis.
			if (this.boxType !== "zarafa.userlistbox"){
				desiredWidth = fieldWidth;
			}
		}

		// We now have the width we need. Since we are going to align
		// the list to the input field, we must check the available width,
		// from the start of the input field to the end of the box field.
		var availableWidth = container.getWidth() - offset[0];
		if (availableWidth < desiredWidth) {
			// Don't adjust left-offset of suggestion-list in case of zarafa.userlistbox.
			// it will result into negative value because container is smaller then
			// the desired-width.
			if (this.boxType !== "zarafa.userlistbox") {
				desiredOffsetLeft = availableWidth - desiredWidth;
			}
		}

		// But what if so much size was needed, that the offset would cause
		// the dropdown box to appear to the left of the boxfield...
		// Lets limit that case as well, and make sure we decrease the
		// width.
		if (desiredOffsetLeft > offset[0]) {
			desiredWidth -= desiredOffsetLeft - offset[0];
			desiredOffsetLeft = -offset[0];
		}

		this.list.setWidth(desiredWidth);
		this.innerList.setWidth(desiredWidth - this.list.getFrameWidth('lr'));
		this.listAlign = [ 'tl-bl', [ desiredOffsetLeft, desiredOffsetBottom ] ];
	},

	/**
	 * Function called during the {@link #render rendering} of this component. This will
	 * wrap {@link #el} into a 'li' element which is saved as {@link #inputEl}. This element
	 * will then be wrapped into a 'ul' element which is saved as {@link #wrapBoxesEl}, and
	 * will later contain all {@link #items} as well.
	 * @param {Ext.Container} ct The container in which the component is being rendered.
	 * @param {NUmber} position The position within the container where the component will be rendered.
	 * @private
	 */
	onRender : function(ct, position)
	{
		Zarafa.common.ui.BoxField.superclass.onRender.call(this, ct, position);

		// Apply some extra CSS classes to the wrap element.
		if (!Ext.isEmpty(this.wrapCls)) {
			this.wrap.addClass(this.wrapCls);
		}

		// If autoHeight is set to false we need to set our own height. Otherwise the CSS
		// class x-form-text will set it to a default height.
		if(this.autoHeight === false){
			if(Ext.isDefined(this.height)) {
				this.wrap.setHeight(this.height);
			}
		}else{
			 this.wrap.applyStyles('height: auto;');
		}

		// Create a focus element which is used for focussing a box.
		this.boxFocusEl = this.wrap.createChild({
			tag : 'a',
			href : '#',
			// Disable tab-index, and position it somewhere where it cannot be seen
			// by the user. This will make the element completely invisible for the
			// user while we can benefit from the focus capabilities.
			tabindex: -1,
			style: 'position: absolute; left:-10000px; top:-10000px;'
		});

		// Wraps the items (boxes) in an UL-tag
		this.wrapBoxesEl = this.el.wrap({
			tag: 'ul'
		});

		this.inputEl = this.el.wrap({
			tag: 'li',
			cls: 'x-zarafa-boxfield-input-item'
		});

		if (this.border === false) {
			this.el.addClass('x-zarafa-boxfield-input-noborder');
		}

		// If a boxStore was previously configured, we
		// can now set it (this will cause the boxes to
		// be rendered).
		if (Ext.isDefined(this.boxStore)) {
			this.setBoxStore(this.boxStore, true);
		}
	},

	/**
	 * Callback function from {@link #setEditable} when the {@link #editable} state
	 * has been changed. This will go over all {@link #items} and change the
	 * {@link Zarafa.common.ui.Box#editable} state on there.
	 * @private
	 */
	updateEditState : function()
	{
		Zarafa.common.ui.BoxField.superclass.updateEditState.apply(this, arguments);

		this.inputEl.setVisible(this.editable);
		this.items.each(function(box) {
			box.setEditable(this.editable);
		});
	},

	/**
	 * Return the {@link Ext.Element} which acts as as the content element. Normally
	 * this is {@link #el}, but as this combobox is more a container, we return {@link #wrap}.
	 *
	 * @return {Ext.Element} The content element
	 * @private
	 */
	getContentTarget : function()
	{
		return this.wrap;
	},

	/**
	 * Called after the component is resized. This will automatically update
	 * the sizing of the {@link #sizeInputfield input} and {@link #sizeContainer container}.
	 *
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 * @private
	 */
	onResize: function(w, h, rw, rh)
	{
		Zarafa.common.ui.BoxField.superclass.onResize.call(this, w, h, rw, rh);

		this.sizeInputfield();
		this.sizeContainer();
	},

	/**
	 * Apply auto-sizing to the component. When {@link #autoHeight} is true,
	 * we apply automatic height calculations to make sure the component
	 * is always correctly sized. When {@link #boxMaxHeight} is also provided,
	 * we check if the limit has been exceeded and display the
	 * {@link #setAutoScroll scrollbar} if needed.
	 *
	 * @private
	 */
	sizeContainer : function()
	{
		if (!this.rendered || this.autoHeight === false) {
			return false;
		}

		var target = this.getResizeEl();
		if ( !Ext.isDefined(target) || !Ext.isDefined(target.dom) ){
			// The element has been removed already. This is possible
			// if a box was removed with animation at the same time that
			// this element was removed. (See Zarafa.common.ui.Box.doDestroy())
			return;
		}
		
		var outerHeight = target.getHeight();
		var innerHeight = target.dom.scrollHeight;
		var doLayout = false;

		if ( this.previousOuterHeight !== outerHeight ) {
			doLayout = true;
		}
		
		if (outerHeight > this.boxMaxHeight) {
			// The height of the box exceeds the maximim height,
			// enable the scrollbar and scroll to the bottom.
			target.setHeight(this.boxMaxHeight);
			if (this.initialConfig.autoScroll !== false) {
				this.setAutoScroll(true);
				target.scrollTo('top', outerHeight);
			}
			doLayout = true;
		} else if ( outerHeight === this.boxMaxHeight && innerHeight !== this.previousInnerHeight && innerHeight <= outerHeight -2 ) { // subtract 2 for the border
			// The scroll height is smaller then the height of the
			// box, this means we do not need the scrollbar anymore.
			target.setHeight('auto');
			if (this.initialConfig.autoScroll !== false) {
				this.setAutoScroll(false);
			}
			doLayout = true;
		}

		this.previousOuterHeight = outerHeight;
		this.previousInnerHeight = innerHeight;

		// Fire a resizeheight event so parent components can listen to it and
		// do a layout if they want to
		if (doLayout === true ) {
			this.fireEvent('resizeheight');
		}
	},

	/**
	 * Called when the {@link #ownerCt owner} has been layed out, this
	 * will obtain the new desired {@link #getDesiredBoxWidth boxWidth}
	 * and applies them to all available {@link #items boxes}.
	 * @private
	 */
	onParentLayout : function()
	{
		var width = this.getDesiredBoxWidth();
		if (Ext.isDefined(width)) {
			this.items.each(function(box) { box.setWidth(width); });
		}
	},

	/**
	 * Returns the desired width for the {@link #items boxes} which should be applied
	 * whenever the container resizes, or a new box is created. When {@link #listMode}
	 * is disabled, this function returns undefined, to ensure dynamic sizing of the box.
	 * @return {Number} The desired width for all boxes
	 * @private
	 */
	getDesiredBoxWidth : function()
	{
		if (this.listMode === true) {
			var target = this.getResizeEl();
			return target.getWidth() - target.getFrameWidth('lr') - this.el.getFrameWidth('lr');
		} else {
			return undefined;
		}
	},

	/**
	 * Apply auto-sizing to the {@link #el input element}.
	 * Whenever the contents of the input field has changed, or when
	 * the width of the entire component has changed, we must recalculate
	 * the desired width of the input element. Normally it should be only
	 * a few pixels wider then the typed text requires, with a maximum
	 * of the current width of the entire component (to prevent a
	 * horizontal scrollbar to appear while typing).
	 *
	 * @private
	 */
	sizeInputfield: function()
	{
		if (!this.rendered) {
			return false;
		}

		var target = this.getResizeEl();
		var width;

		if (this.listMode === true) {
			width = target.getWidth() - target.getFrameWidth('lr') - this.el.getFrameWidth('lr');
		} else {
			var metric = this.getInputTextMetric();

			// Calculate the desired width of the component based on the
			// required width for the input text.
			var value = Ext.util.Format.htmlEncode(this.el.dom.value);
			width = metric.getWidth(value);

			// Add spacing to the input field. This will ensure the
			// the input box will always have the correct minimum size.
			width += this.minInputFieldWidth;

			// Ensure the width does not exceed the component width.
			width = Math.min(width, target.getWidth());
		}

		// Store the current height, this way we can detect if the input
		// field has been wrapped to the next line after the resize.
		var oldHeight = target.getHeight();

		// Set the inputfield to the calculated width
		this.el.setSize(width, this.inputFieldHeight - this.el.getBorderWidth('tb'));

		// Check if linewrapping has occurred, and update the container accordingly.
		var newHeight = target.getHeight();
		if (this.listMode === true || oldHeight !== newHeight) {
			this.sizeContainer();
		}

		// When scrolling is enabled, we must always scroll to the
		// bottom of the container to ensure the input field is
		// fully visible.
		target.scrollTo('top', newHeight);
	},

	/**
	 * Called to handle the input when the user presses the handleInputKey or another trigger makes
	 * this component need to handle the input. Has to be overwritten to implement the desired
	 * behavior and the creation of the correct type of record.
	 * @param {String} value The value from the input field
	 * @protected
	 */
	handleInput : Ext.emptyFn,

	/**
	 * Called to handle a selection from the dropdown list. This function needs to
	 * convert the selected record into a record for the {@link #boxStore}.
	 * Has to be overwritten to implement the desired behavior of creation of the correct type
	 * of record.
	 * @param {Ext.data.Record} record The record which was selected from {@link #store}
	 * @protected
	 */
	handleSelection : Ext.emptyFn,

	/**
	 * Check {@link #el} for input and call {@link #handleInput} to convert
	 * the input into a new {@link Zarafa.common.ui.Box Box}.
	 * @private
	 */
	convertInputToBox : function()
	{
		var value = this.el.getValue();

		if (!Ext.isEmpty(value)) {
			this.el.dom.value = '';
			this.sizeInputfield();
			this.store.removeAll(true);
			this.handleInput(value);
		}
	},

	/**
	 * Called to filter out records before they are added to this field.
	 * This will loop over all records and call {@link #filterRecord} to
	 * check if the record should be visible or not.
	 * @param {Ext.data.Store} store The store
	 * @param {Ext.data.Record[]} records The records to filter
	 * @return {Ext.data.Record[]} The records which are visible
	 * @protected
	 */
	filterRecords: function(store, records)
	{
		var ret = [];

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			if (this.filterRecord(record)) {
				ret.push(record);
			}
		}

		return ret;
	},

	/**
	 * Called by {@link #filterRecords} to check if the given record
	 * must be visible in the field or not.
	 * @param {Ext.data.Record} record The record to filter
	 * @return {Boolean} True if the record should be visible, false otherwise
	 * @protected
	 */
	filterRecord : function(record)
	{
		return true;
	},

	/**
	 * Find the {@link Zarafa.common.ui.Box} which belongs to the given record.
	 * @param {Ext.data.Record} record The record for which the box is searched
	 * @return {Zarafa.common.ui.Box} The box which belongs to the given record
	 */
	getBoxForRecord : function(record)
	{
		return this.items.find(function(box) { return box.record === record;  });
	},

	/**
	 * Call before the field is being blurred. When we still have an
	 * {@link #currentFocus boxfocus} it must be removed now.
	 *
	 * @private
	 */
	beforeBlur : function()
	{
		Zarafa.common.ui.BoxField.superclass.beforeBlur.apply(this, arguments);
		this.convertInputToBox();
		this.boxBlur();
	},

	/**
	 * Put the focus on a particular box. This will call {@link Zarafa.common.ui.Box#blur}
	 * on the {@link #currentFocus currently focussed} element. And then call
	 * {@link Zarafa.common.ui.Box#focus} on the new box which will be set in {@link #currentFocus}.
	 *
	 * @param {Zarafa.common.ui.Box} box The box to put the focus on
	 * @private
	 */
	boxFocus : function(box)
	{
		if (this.currentFocus) {
			this.currentFocus.blur();
		}

		this.currentFocus = box;

		if (this.currentFocus) {
			this.currentFocus.focus();
		}
	},

	/**
	 * Remove the focus from the {@link #currentFocus currently focussed} box.
	 * This will call {@link Zarafa.common.ui.Box#blur} on the box, and then
	 * reset {@link #currentFocus}.
	 * @private
	 */
	boxBlur : function()
	{
		if (this.currentFocus) {
			this.currentFocus.blur();
		}

		this.currentFocus = false;
	},

	/**
	 * Try to focus this component.
	 * @param {Boolean} selectText (optional) If applicable, true to also select the text in this component
	 * @param {Boolean/Number} delay (optional) Delay the focus this number of milliseconds (true for 10 milliseconds)
	 * @return {Ext.Component} this
	 */
	focus : function(selectText, delay)
	{
		if (delay) {
			this.focusTask = new Ext.util.DelayedTask(this.focus, this, [selectText, false]);
			this.focusTask.delay(Ext.isNumber(delay) ? delay : 10);
			return;
		}
		if (this.rendered && !this.isDestroyed) {
			this.inputFocus(undefined, selectText);
		}
		return this;
	},

	/**
	 * Put the focus on the {@link #el Input element}, when a box is already
	 * {@link #currentFocus focussed} it will be {@link #boxBlur blurred} after
	 * which the focus is put on the {@link #el Input element}.
	 *
	 * When provided, the new caret position for the input field can also be provided.
	 * @param {Number} caretPos (optional) The desired caret position
	 * @private
	 */
	inputFocus : function(caretPos, selectText)
	{
		this.boxBlur();
		this.el.focus();
		if (!Ext.isEmpty(caretPos)) {
			Zarafa.core.Util.setCaretPosition(this.el, caretPos);
		}
		if (selectText === true) {
			this.el.dom.select();
		}
	},

	/**
	 * Remove the focus from the {@link #el} element.
	 * @private
	 */
	inputBlur : function()
	{
		this.el.blur();
	},

	/**
	 * Event handler which is fired when the user clicked anywhere
	 * on the {@link #container}, but not on a specific {@link #items box}.
	 * In this case, we redirect our focus to the input element.
	 * @private
	 */
	onContainerClick : function(e, element)
	{
		this.collapse();
		if (this.editable) {
			if (element === this.el.dom) {
				this.inputFocus();
			} else {
				// If element is visible then and only we can set focus on the element.
				if(this.el.isVisible()) {
					// Stop event propagation.
					e.stopEvent();
					this.inputFocus(this.el.dom.value.length);
				}
			}
		} else if (!this.currentFocus) {
			this.boxFocus(this.items.last());
		}
	},

	/**
	 * Create the {@link Ext.KeyMap} for an {@link Ext.Element} which
	 * serves as the focus element for the {@link #items boxes}.
	 * @param {Ext.Element} focusEl The element which acts as the focusElement for the boxes.
	 * @return {Ext.KeyMap} The keymap for the focus element.
	 * @private
	 */
	createBoxKeyMap : function(focusEl)
	{
		var bindings = [{
			key: [
				Ext.EventObject.ENTER
			],
			handler: this.onBoxKeyEnter,
			scope: this
		},{
			key: [
				Ext.EventObject.UP,
				Ext.EventObject.PAGE_UP
			],
			handler: this.onBoxKeyUp,
			scope: this
		},{
			key: [
				Ext.EventObject.DOWN,
				Ext.EventObject.PAGE_DOWN
			],
			handler: this.onBoxKeyDown,
			scope: this
		},{
			key: [
				Ext.EventObject.LEFT
			],
			handler: this.onBoxKeyLeft,
			scope: this
		},{
			key: [
				Ext.EventObject.RIGHT
			],
			handler: this.onBoxKeyRight,
			scope: this
		},{
			key: [
				Ext.EventObject.HOME
			],
			handler: this.onBoxKeyHome,
			scope: this
		},{
			key: [
				Ext.EventObject.END
			],
			handler: this.onBoxKeyEnd,
			scope: this
		},{
			key: [
				Ext.EventObject.BACKSPACE
			],
			handler: this.onBoxKeyBackspace,
			scope: this
		},{
			key: [
				Ext.EventObject.DELETE
			],
			handler: this.onBoxKeyDelete,
			scope: this
		},{
			key: [
				Ext.EventObject.C
			],
			ctrl: true,
			handler: this.onBoxKeyCopy,
			scope: this
		}];

		// disable modifier keys in the bindings
		for(var i = 0, len = bindings.length; i < len; i++) {
			var binding = bindings[i];

			Ext.applyIf(binding, {
				shift: false,
				alt: false,
				ctrl: false
			});
		}
		return new Ext.KeyMap(focusEl, bindings);
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user wants to copy email address of resolved recipient.
	 */
	onBoxKeyCopy : function ()
	{
		Zarafa.common.Actions.copyEmailAddress(this.currentFocus.record);
	},

	/**
	 * Key handler for the {@link Ext.EventObject.ENTER ENTER} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will perform the same action as {@link #doBoxDblClick}.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyEnter : function(key, e)
	{
		e.stopEvent();

		this.doBoxDblClick(this.currentFocus);
	},

	/**
	 * Key handler for the {@link Ext.EventObject.UP} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will select the box left to the currently selected box.
	 * If this is the first box of the {@link #items} array, the focus
	 * on the items is lost, and the {@link #el input element} is focussed.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyUp : function(key, e)
	{
		this.onBoxKeyLeft(key, e);
	},

	/**
	 * Key handler for the {@link Ext.EventObject.DOWN} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will select the box right to the currently selected box.
	 * If this is the last box of the {@link #items} array, the focus
	 * on the items is lost, and the {@link #el input element} is focussed.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyDown : function(key, e)
	{
		this.onBoxKeyRight(key, e);
	},

	/**
	 * Key handler for the {@link Ext.EventObject.LEFT} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will select the box left to the currently selected box.
	 * If this is the first box of the {@link #items} array, the focus
	 * remains on the current box.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyLeft : function(key, e)
	{
		e.stopEvent();

		var index = this.items.indexOf(this.currentFocus);
		if (index !== 0) {
			this.boxFocus(this.items.itemAt(index - 1));
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.RIGHT} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will select the box right to the currently selected box.
	 * If this is the last box of the {@link #items} array, the focus
	 * on the items is lost, and the {@link #el input element} is focussed.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyRight : function(key, e)
	{
		e.stopEvent();

		var index = this.items.indexOf(this.currentFocus);
		if (index !== this.items.getCount() - 1) {
			this.boxFocus(this.items.itemAt(index + 1));
		} else if (this.editable) {
			this.inputFocus(0);
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.HOME} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will select the first item in the {@link #items} array.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyHome : function(key, e)
	{
		e.stopEvent();

		var item = this.items.first();
		if (!item.hasFocus()) {
			this.boxFocus(item);
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.END} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will select the last item in the {@link #items} array.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyEnd : function(key, e)
	{
		e.stopEvent();

		var item = this.items.last();
		if (!item.hasFocus()) {
			this.boxFocus(item);
		} else if (this.editable) {
			this.inputFocus(this.el.dom.value.length);
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.BACKSPACE} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This will delete the currently selected item from the field,
	 * and will select the item to the left of the deleted item.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyBackspace : function(key, e)
	{
		e.stopEvent();

		if (this.editable !== false) {
			var index = this.items.indexOf(this.currentFocus);

			this.doBoxRemove(this.currentFocus);

			if (index > 0) {
				this.boxFocus(this.items.itemAt(index - 1));
			} else if (this.items.getCount() > 0) {
				this.boxFocus(this.items.itemAt(0));
			} else {
				this.inputFocus();
			}
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.DELETE} event
	 * for the {@link #boxFocusEl Box focus element}.
	 *
	 * This.will delete the currently selected item from the field,
	 * and will select the item to the right of the deleted item.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onBoxKeyDelete : function(key, e)
	{
		e.stopEvent();

		if (this.editable !== false) {
			var index = this.items.indexOf(this.currentFocus);

			this.doBoxRemove(this.currentFocus);

			if (index < this.items.getCount()) {
				this.boxFocus(this.items.itemAt(index));
			} else {
				this.inputFocus(0);
			}
		}
	},

	/**
	 * Create the {@link Ext.KeyMap} for the {@link #el}.
	 * This KeyMap is only used for the {@link handleInputKey}, which needs its character code detected.
	 * That is why the 'keypress' event is used instead of the default 'keydown',
	 * which does not report character codes.
	 *
	 * @param {Ext.Element} focusEl The element which acts as the focusElement for the input element.
	 * @return {Ext.KeyMap} The keymap for the focus element.
	 * @private
	 */
	createInputKeyMap : function(focusEl)
	{
		return new Ext.KeyMap(focusEl, [{
			key: [
				this.handleInputKey
			],
			shift: false,
			alt: false,
			ctrl: false,
			handler: this.onInputKey,
			scope: this
		}], 'keypress');
	},

	/**
	 * Create the {@link Ext.KeyMap} for the {@link #el} to handle
	 * various key board controls for suggestion {@link #list}.
	 *
	 * @param {Ext.Element} element The {@link Zarafa.common.ui.BoxField#el combo box} element.
	 * @return {Ext.KeyMap} The keymap for the {@link Zarafa.common.ui.BoxField#el combo box} element.
	 * @private
	 */
	createListKeyMap : function(element)
	{
		// Listen to DELETE key event which remove record from suggestion list.
		return new Ext.KeyMap(element, {
			key: [
				Ext.EventObject.DELETE
			],
			handler: this.onListKeyDelete,
			scope: this,
			shift: false,
			alt: false,
			ctrl: false
		});
	},

	/**
	 * Create the {@link Ext.KeyMap} for the {@link #el}.
	 * This KeyMap is used for special keys, such as enter, page up/down, arrows, etc.
	 *
	 * @param {Ext.Element} focusEl The element which acts as the focusElement for the input element.
	 * @return {Ext.KeyMap} The keymap for the focus element.
	 * @private
	 */
	createSpecialInputKeyMap : function(focusEl)
	{
		var bindings = [{
			key: [
				Ext.EventObject.ENTER
			],
			handler: this.onInputKeyEnter,
			scope: this
		},{
			key: [
				Ext.EventObject.TAB
			],
			handler: this.onInputKeyTab,
			scope: this
		},{
			key: [
				Ext.EventObject.UP,
				Ext.EventObject.PAGE_UP
			],
			handler: this.onInputKeyUp,
			scope: this
		},{
			key: [
				Ext.EventObject.LEFT
			],
			handler: this.onInputKeyLeft,
			scope: this
		},{
			key: [
				Ext.EventObject.HOME
			],
			handler: this.onInputKeyHome,
			scope: this
		},{
			key: [
				Ext.EventObject.BACKSPACE
			],
			handler: this.onInputKeyBackspace,
			scope: this
		}];

		// disable modifier keys in the bindings
		for(var i = 0, len = bindings.length; i < len; i++) {
			var binding = bindings[i];

			Ext.apply(binding, {
				shift: false,
				alt: false,
				ctrl: false
			});
		}

		// Add combination of TAB with shift as well to trigger blur and handle input text
		bindings.push({
			key: [
				Ext.EventObject.TAB
			],
			shift: true,
			alt: false,
			ctrl: false,
			handler: this.onInputKeyTab,
			scope: this
		});

		return new Ext.KeyMap(focusEl, bindings);
	},

	/**
	 * Generic {@link Ext.Element#keydown} event handler for the {@link #el input element}.
	 * This handler is run for all keys which were not handled by the {@link #inputKeyMap}.
	 * This will simply {@link #sizeInputfield resize} the {@link #el input element}.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onKeyDownHandler: function(e)
	{
		// Don't resize the inputfield on special keys (arrow-keys, backspace, etc)
		// for some weird reason these keys would trigger the input field to become
		// larger, while no input is being added...
		if (!e.isSpecialKey()) {
			this.collapse();
			this.sizeInputfield();
		}
	},

	/**
	 * Key handler for the {@link #handleInputKey} event
	 * for the {@link #el input element}.
	 *
	 * This will clear  the {@link #el} element, and send the
	 * old value to {@link #handleInput} to create a new {@link #items box}.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onInputKey : function(key, e)
	{
		e.stopEvent();
		this.convertInputToBox();
	},

	/**
	 * Key handler for the {@link Ext.EventObject.ENTER} event
	 * for the {@link #el input element}.
	 *
	 * This will clear  the {@link #el} element, and send the
	 * old value to {@link #handleInput} to create a new {@link #items box}.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onInputKeyEnter : function(key, e)
	{
		// Make sure we are not expanded, because in that
		// case the ENTER command is reserved for selecting
		// an item from the dropdown list.
		if (!(this.isExpanded() && this.store.getCount() > 0)) {
			e.stopEvent();
			this.convertInputToBox();
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.TAB} event
	 * for the {@link #el input element}.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onInputKeyTab : function(key, e)
	{
		//If the user entered something, we should prevent default tab behavior
		if (!Ext.isEmpty(this.getValue())) {
			e.stopEvent();

			if (!(this.isExpanded() && this.store.getCount() > 0)){
			    this.convertInputToBox();
			}
		}else{
			//Trigger a blur to remove the focus class from the element
			this.triggerBlur();
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.UP} event
	 * for the {@link #el input element}.
	 *
	 * When the cursor is at the most-left position of the {@link #el input element}
	 * then the box to the left of the input element is selected.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onInputKeyUp : function(key, e)
	{
		this.onInputKeyLeft(key, e);
	},

	/**
	 * Key handler for the {@link Ext.EventObject.LEFT} event
	 * for the {@link #el input element}.
	 *
	 * When the cursor is at the most-left position of the {@link #el input element}
	 * then the box to the left of the input element is selected.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onInputKeyLeft : function(key, e)
	{
		var caret = Zarafa.core.Util.getSelectionRange(this.el);
		if (caret.start === 0 && caret.end === 0 && this.items.getCount() > 0) {
			e.stopEvent();
			this.boxFocus(this.items.last());
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.HOME} event
	 * for the {@link #el input element}.
	 *
	 * When the cursor is at the most-left position of the {@link #el input element}
	 * then the first box of {@link #items} is selected.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onInputKeyHome : function(key, e)
	{
		var caret = Zarafa.core.Util.getSelectionRange(this.el);
		if (caret.start === 0 && caret.end === 0 && this.items.getCount() > 0) {
			e.stopEvent();
			this.boxFocus(this.items.first());
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.BACKSPACE event
	 * for the {@link #el input element}.
	 *
	 * When the cursor is at the most-left position of the {@link #el input element}
	 * then the box to the left of the input element is selected (so that pressing
	 * 'backspace' again will delete it.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onInputKeyBackspace : function(key, e)
	{
		var caret = Zarafa.core.Util.getSelectionRange(this.el);
		if (caret.start === 0 && caret.end === 0 && this.items.getCount() > 0) {
			e.stopEvent();
			this.boxFocus(this.items.last());
		}
	},

	/**
	 * Key handler for the {@link Ext.EventObject.DELETE} event
	 * for the {@link #el element} defined by {@link Ext.KeyMap}.
	 *
	 * This will remove current record identified by {@link #selectedIndex} from
	 * {@link Zarafa.common.recipientfield.data.SuggestionListStore SuggestionListStore}.
	 *
	 * @param {Number} key The key which was pressed
	 * @param {Ext.EventObject} e The event object which fired the event
	 * @private
	 */
	onListKeyDelete : function(key, e)
	{
		var store = this.getStore();

		if (store.getCount() !== 0) {
			// Prevent default browser behaviour of deleting characters from input text
			// as we are going to use this event to delete records from list.
			e.stopEvent();
			store.removeAt(this.selectedIndex);

			// If deleted item is the last one in the list than previous item of the deleted item will be selected.
			if (store.getCount() ==  this.selectedIndex) {
				this.selectPrev();
			} else {
				this.select(this.selectedIndex);
			}
			this.restrictHeight();
		}
	},

	/**
	 * Event handler for the {@link Ext.DataView#extraitemclick} event.
	 * This is fired when {@link #extraItemSelector} node from dropdown-list is clicked.
	 * Just remove selected node by calling {@link #onListKeyDelete} function.
	 * @param {Ext.DataView} The underlying {@link Ext.DataView} instance responsible to create dropdown-list.
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} extraItem The target node
	 * @param {Ext.EventObject} e The raw event object
	 * @private
	 */
	onExtraItemClick : function(dataView, index, extraItem, e)
	{
		this.onListKeyDelete(false, e);
	},

	/**
	 * Event handler for the 'paste' event on the {@link #el input element}.
	 * This is fired by the special {@link Zarafa.core.Event#addPasteEventHandler}
	 * event handler. This will resize the input field, to fit the field to the
	 * new contents.
	 * @private
	 */
	onPaste : function()
	{
		this.sizeInputfield();
	},

	/**
	 * Event handler for the {@link Ext.data.Store#datachanged} event from the {@link #boxStore}.
	 * This will {@link #clearBoxes clear all boxes} and then {@link #loadBoxes rebuild them}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @private
	 */
	onBoxStoreDataChanged : function(store)
	{
		this.clearBoxes();
		this.loadBoxes(store);
	},

	/**
	 * Event handler for the {@link Ext.data.Store#clear} event from the {@link #boxStore}.
	 * This will {@link #clearBoxes clear all boxes}.
	 * @private
	 */
	onBoxStoreClear : function()
	{
		this.clearBoxes();
	},

	/**
	 * Event handler for the {@link Ext.data.Store#add} event from the {@link #boxStore}.
	 * This will check if the provided records should be {@link #filterRecords shown} inside
	 * this field, and those that are not filtered will be {@link #addBox added}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record[]} records The records which were added
	 * @param {Number} index The index position at which the records where added
	 * @private
	 */
	onBoxStoreAdd: function(store, records, index)
	{
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		records = this.filterRecords(store, records);

		for (var i = 0; i < records.length; i++) {
			this.addBox(records[i]);
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event from the {@link #boxStore}.
	 * This will {@link #removeBox remove} the box which is attached to the given record.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was removed
	 * @param {Number} index The position from where the record was removed
	 * @private
	 */
	onBoxStoreRemove: function(store, record, index)
	{
		this.removeBox(record);
	},

	/**
	 * Event handler for the {@link Ext.data.Store#update} event from the {@link #boxStore}.
	 * This will {@link Zarafa.common.ui.Box#update update} the box with the new
	 * {@link Ext.data.Record#data record data}.
	 * When the field is updated, the modified record may have changed whether it passes the field's filter or not.
	 * Therefore, the function adds or removes this record's box.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record THhe record which was updated
	 * @private
	 */
	onBoxStoreUpdate: function(store, record)
	{
		if (this.filterRecord(record)) {
			var box = this.getBoxForRecord(record);
			if (box) {
				// record passes filter and has a box - just update
				box.update(record);
			} else {
				// record passes the filter and does not have a box in this field yet - add it
				this.addBox(record);
			}
		} else {
			// if this record does not pass the filter, remove its box
			this.removeBox(record);
		}
	},

	/**
	 * Callback function from {@link Zarafa.common.ui.Box} which indicates
	 * that the box has been clicked. This will {@link #boxFocus focus the
	 * box}, and fire the {@link #boxclick} event.
	 * @param {Zarafa.common.ui.Box} box The box which called this function
	 */
	doBoxClick: function(box)
	{
		this.boxFocus(box);

		this.fireEvent('boxclick', this, box, box.record);
	},

	/**
	 * Callback function from {@link Zarafa.common.ui.Box} which indicates
	 * that the box has been doubleclicked. This will fire the
	 * {@link #boxdblclick} event.
	 * @param {Zarafa.common.ui.Box} box The box which called this function
	 */
	doBoxDblClick : function(box)
	{
		this.fireEvent('boxdblclick', this, box, box.record);
	},

	/**
	 * Callback function from {@link Zarafa.common.ui.Box} which indicates
	 * that the contextmenu has been requested for the given box. This will
	 * {@link #boxFocus focus the box}, and fire the {@link #boxcontextmenu} event.
	 * @param {Zarafa.common.ui.Box} box The box which called this function
	 */
	doBoxContextMenu : function(box)
	{
		this.boxFocus(box);

		this.fireEvent('boxcontextmenu', this, box, box.record);
	},

	/**
	 * Callback function from {@link Zarafa.common.ui.Box} which indicates that
	 * the box has received the focus. This will focus the {@link #boxFocusEl}
	 * and {@link Ext.Element#scrollIntoView scroll the box into view}. Finally
	 * the {@link #boxfocus} event.
	 * @param {Zarafa.common.ui.Box} box The box which called this function
	 */
	doBoxFocus : function(box)
	{
		// It could happen a box is being focussed without
		// the field being focussed.
		if (this.hasFocus !== true) {
			this.onFocus();
		}

		this.boxFocusEl.focus();
		box.getPositionEl().scrollIntoView(this.getContentTarget());

		this.fireEvent('boxfocus', this, box, box.record);
	},

	/**
	 * Callback function from {@link Zarafa.common.ui.Box} which indicates
	 * that the box has been blurred. This will blur the {@link #boxFocuEl}
	 * and will fire the {@link #boxblur} event.
	 * @param {Zarafa.common.ui.Box} box The box which called this function
	 */
	doBoxBlur : function(box)
	{
		this.boxFocusEl.blur();

		this.fireEvent('boxblur', this, box, box.record);
	},

	/**
	 * Callback function from {@link Zarafa.common.ui.Box} which indicates that
	 * the box is being removed by the user. This will fire the {@link #boxremove}
	 * event.
	 * @param {Zarafa.common.ui.Box} box The box which called this function
	 */
	doBoxRemove: function(box)
	{
		this.fireEvent('boxremove', this, box, box.record);
	},

	/**
	 * Event handler for the {@link #boxremove} event. This will remove
	 * the record belonging to the box from the {@link #boxStore}. Then
	 * {@link #sizeContainer} is called. This is needed because the
	 * removal of the box might have triggered a resize of the {@link #wrap}
	 * and thus we might no longer need the scrollbars.
	 * @param {Zarafa.common.ui.BoxField} field The field which has fired the event
	 * @param {Zarafa.common.ui.Box} box The box which has been removed
	 * @param {Ext.data.Record} record The record which belongs to the given box
	 * @private
	 */
	onBoxRemove: function(field, box, record)
	{
		this.boxStore.remove(record);
		if (this.boxStore.getCount() < this.boxLimit && this.initialConfig.readOnly !== true) {
			this.setReadOnly(false);
			this.inputFocus();
		}
	},

	/**
	 * Event handler for the {@link #boxadd} event. This will
	 * {@link #sizeContainer resize the container}. This is needed because
	 * the new box, might have triggered a resize of the {@link #wrap}
	 * and thus we might need scrollbars.
	 * @param {Zarafa.common.ui.BoxField} field The field which has fired the event
	 * @param {Zarafa.common.ui.Box} box The box which has been added
	 * @param {Ext.data.Record} record The record which belongs to the given box
	 * @private
	 */
	onBoxAdd : function(field, box, record)
	{
		if (this.boxStore.getCount() >= this.boxLimit) {
			this.setReadOnly(true);
		}
	},

	/**
	 * Adds a box to the field. It will instantiate the {@link Zarafa.common.ui.Box Box} component that will
	 * render the box according to the data in the supplied record. It will render the box inside
	 * the wrapBoxesEl. After rendering the box it will add the box to the {@link #items items} and
	 * fire the {@link #boxadd} event.
	 * @param {Ext.data.Record} record The record to add as a box into the field
	 * @private
	 */
	addBox: function(record)
	{
		/*
		 * Create the configuration object for the Box. The this.boxConfig is used as default and we
		 * apply the record and renderTo properties onto that object.
		 */
		var configObj = {};
		Ext.apply(configObj, {
			xtype : this.boxType,
			parent : this,
			record : record,
			editable : this.editable,
			width : this.getDesiredBoxWidth()
		}, this.boxConfig);

		var box = Ext.create(configObj);
		box.render(this.wrapBoxesEl, this.items.length);

		this.items.add(box);

		this.sizeContainer();

		this.fireEvent('boxadd', this, box, record);
	},

	/**
	 * Removes a {@link Zarafa.common.ui.Box Box} from the field.
	 * @param {Ext.data.Record} record The record which belongs to the box which must be removed.
	 * @private
	 */
	removeBox : function(record)
	{
		var box = this.getBoxForRecord(record);
		if (!box) {
			return;
		}

		var index = this.items.indexOf(box);
		box.doDestroy(this.enableAnim);
		this.items.remove(box);

		if (this.items.getCount() < this.boxLimit && this.initialConfig.readOnly !== true) {
			this.setReadOnly(false);
		}

		if (!this.currentFocus || this.currentFocus === box) {
			if (this.items.getCount() > index) {
				this.boxFocus(this.items.itemAt(index));
			} else {
				this.inputFocus();
			}
		}
	},

	/**
	 * Load all new {@link Zarafa.common.ui.Box boxes} based on the records from
	 * the {@link Ext.data.Store store}. This will first {@link #filterRecords filter}
	 * the records from the store before {@link #addBox adding} them.
	 * @param {Ext.data.Store} store
	 * @private
	 */
	loadBoxes : function(store)
	{
		var records = this.filterRecords(store, store.getRange());

		for (var i = 0; i < records.length; i++) {
			this.addBox(records[i]);
		}
	},

	/**
	 * This will clear all {@link #items boxes}. Each box will be
	 * {@link Zarafa.common.ui.Box#destroy destroyed}, and then removed from {@link #items}
	 * @private
	 */
	clearBoxes: function()
	{
		this.items.each(function(item) {
			item.destroy();
		});

		this.items.clear();
	},

	/**
	 * Called when the component is being destroyed
	 * @private
	 */
	onDestroy : function()
	{
		Zarafa.common.ui.BoxField.superclass.onDestroy.apply(this, arguments);

		if (this.editable !== false) {
			Zarafa.core.Events.removePasteEventHandler(this, this.el, this.onPaste, this);
		}
	}
});

Ext.reg('zarafa.boxfield', Zarafa.common.ui.BoxField);
