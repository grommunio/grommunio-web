Ext.namespace("Zarafa.core.ui");

/**
 * @class Zarafa.core.ui.View
 * @extends Ext.util.Observable
 * The View class is a component for building views. Views abstract away the details
 * of manipulating HTML and the DOM from underlying controls such as grid panels
 * and {@link Zarafa.calendar.ui.CalendarPanel CalendarPanel}. 
 * 
 * The View class supports convenience methods for creating elements, managing
 * several child views, etc.
 * <p>
 * The createDiv() method can be used to create div elements. These elements are then 
 * automatically destroyed by the destroy() method. 
 * Child views can be added using addChildView(). These are then also destroyed 
 * automatically by the default destroy() implementation.
 */
Zarafa.core.ui.View = Ext.extend(Ext.util.Observable, {
	/**
	 * @cfg {String} baseCls The base CSS class to apply to this panel's element.
	 */
	baseCls : undefined,

	/**
	 * @cfg {String} itemCls The item CSS class to apply to this panel's element.
	 */
	itemCls : undefined,

	/**
	 * @cfg {String} themeCls The CSS theme which must be applied to this view. The name will
	 * be added to the various CSS classes which are generated using {@link #getClassName}.
	 * will be used.
	 */
	themeCls : undefined,

	/**
	 * The parent element for this view
	 * @property
	 * @type Object
	 */
	parentView : undefined,

	/**
	 * The {@link Ext.Element} in which this view has been rendered.
	 * This is passed as argument to {@link #render}. 
	 * @property
	 * @type Ext.Element
	 */
	container : undefined,

	/**
	 * The list of child objects which were created for this view. When
	 * this object is destroyed all registered children will be automatically
	 * cleaned up as well.
	 * @property
	 * @type Array
	 */
	children : undefined,

	/**
	 * The list of child elements which were created by this view using
	 * the {@link #create} and {@link #createDiv} functions. When this
	 * object is destroyed all registered elements will be automatically
	 * cleaned up as well.
	 * @property
	 * @type Array
	 */
	elements : undefined,

	/**
	 * Indicates if this view has been {@link #render rendered}.
	 * @property
	 * @type Boolean
	 */
	rendered : false,

	/**
	 * True if the view has been destroyed already. Read only
	 * @property isDestroyed
	 * @type Boolean
	 */
	isDestroyed: false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
		
		this.addEvents(
			/**
			 * @event beforedestroy
			 * Fires before the component is {@link #destroy}ed. Return false from an event handler to stop the {@link #destroy}.
			 * @param {Ext.Component} this
			 */
			'beforedestroy',
			/**
			 * @event destroy
			 * Fires after the component is {@link #destroy}ed.
			 * @param {Ext.Component} this
			 */
			'destroy'
		);

		Zarafa.core.ui.View.superclass.constructor.call(this, config);

		this.init();
	},

	/**
	 * Initialises the view. When a {@link #parentView} is defined,
	 * this will automatically register this view to the given parentView.
	 * @protected 
	 */
	init : function()
	{
		this.children = [];
		this.elements = [];

		if (Ext.isDefined(this.parentView)) {
			this.parentView.addChildView(this);
		}
	},

	/**
	 * Returns the base className which must be applied to all {@link Ext.Element elements} within this
	 * view. This will also be the prefix of any additional CSS classes which will be applied to those elements.
	 * The exact base classname depends on the {@link #baseCls} and the availablity of the {@link #itemCls}.
	 * @return {String} The base class. 
	 * @private
	 */
	getBaseClassName : function()
	{
		return this.itemCls ? (this.baseCls + '-' + this.itemCls) : this.baseCls;
	},

	/**
	 * Helper function for generating a string with CSS class names. Each {@link Ext.Element Element} must
	 * at least contain the {@link #baseCls} CSS class and CSS classes containing the {@link #itemCls} and
	 * {@link #themeCls} but additional names will be generated for specific elements. Example:
	 * <pre>
	 *   baseCls =  'zarafa-calendar';
	 *   getClassName('body', 'image');
	 * </pre>
	 * The outcome will be:
	 * <pre>
	 *   'zarafa-calendar zarafa-calendar-body zarafa-calendar-body-image zarafa-calendar-blue zarafa-calendar-blue-body zarafa-calendar-blue-body-image'
	 * </pre>
	 *
	 * @param {String} name The main name for the CSS element, this will be appended to the {@link #baseCls}.
	 * @param {String/Array} postfix (optional) If provided extra CSS classNames will be generated with the name and postfix. If the postfix
	 * is an array, all elements from the array will be used as postfix.
	 * @return {String} the CSS class names
	 * @param {String/Array} extraCls (optional) If provided extra CSS classNames will be generated with this extraCls. If the postfix
	 * is an array, all elements from the array will be used as extraCls.
	 * @private
	 */
	getClassName : function(name, postfix, extraCls)
	{
		var baseCls = this.getBaseClassName();
		var className = this.baseCls;

		if (!Ext.isEmpty(this.themeCls)) {
			className += ' ' + this.baseCls + '-' + this.themeCls;
		}

		className += ' ' + baseCls + '-' + name;

		if (Ext.isDefined(postfix) && !Ext.isArray(postfix)) {
			postfix = [ postfix ];
		}

		if (!Ext.isEmpty(postfix)) {
			for (var i = 0, len = postfix.length; i < len; i++) {
				className += ' ' + baseCls + '-' + name + '-' + postfix[i];
			}
		}

		if (Ext.isDefined(extraCls) && !Ext.isArray(extraCls)) {
			extraCls = [ extraCls ];
		}

		if (!Ext.isEmpty(extraCls)) {
			for (var i = 0, len = extraCls.length; i < len; i++) {
				className += ' ' + baseCls + '-' + extraCls[i];
			}
		}

		return className;
	},

	/**
	 * A convenience method for creating DIV elements. The new DIV element will be
	 * wrapped in an {@link Ext.Element} and added to the view as a property called 'name'.
	 * Equivalent to <code>create('div', parent, name, className)</code>.
	 * @param {Mixed} parent element
	 * @param {String} name the name of the property to create
	 * @param {String} className (optional) class name for the new DIV 
	 * @return {Ext.Element} The created div element
	 * @private
	 */
	createDiv : function(parent, name, className)
	{
		return this.create('div', parent, name, className);
	},
	
	/**
	 * A convenience method for creating DOM elements. The new element will be
	 * wrapped in an {@link Ext.Element} and added to the view as a property called 'name'.
	 * Calling <pre>this.create('div', 'test')</pre> for instance will create a new
	 * property <pre>this.test</pre>, and the DIV can be manipulated with code such
	 * as <pre>this.test.setSize(100, 100);</pre>. If a property already exists
	 * with the given name, the property will be converted into an array and
	 * the new element will the appended to that array.
	 * @param {String|Object} tagName type of HTML tag to generate (i.e. 'div', 'img', etc.) 
	 * @param {Mixed} parent element
	 * @param {String} name the name of the property to create
	 * @param {String} className (optional) class name for the new DIV
	 * @return {Ext.Element} The created element
	 * @private
	 */
	create : function(tagName, parent, name, className)
	{
		var config = Ext.isObject(tagName) ? tagName : { tag : tagName };

		Ext.applyIf(config, { cls : className || this.baseCls });

		// create a new HTML element and add it to the parent element
		var element = Ext.get(parent).createChild(config);
		
		// add the element as a property to this
		if (!this[name]) {
			this[name] = element;
		} else if (Ext.isArray(this[name])) {
			this[name].push(element);
		} else {
			this[name] = [ this[name], element ];
		}
		
		// add the element to the elements list so that we may destroy it easily later on
		this.elements.push(element);
		
		return element;
	},
	
	/**
	 * Removes a child element from the view and destroys it.
	 * @param {Ext.Element} element DOM element 
	 */
	remove : function(element)
	{
		element = Ext.get(element);
		this.elements.remove(element);
		element.remove();
	},
	
	/**
	 * @return {Ext.Element} The main element of the view. This is the element the
	 * view is rendered <i>into</i>. The container of a view may be shared with other 
	 * views, so manipulating the container of a given view might affect other views
	 * as well. 
	 */
	getContainer : function()
	{
		return this.container;
	},

	/**
	 * Calls 'render' on each of the child views
	 * @param {Ext.Element} container The container into which the children must be rendered. Defaults to {@link #el}.
	 * @private
	 */
	renderChildren : function(container)
	{
		for (var i = 0, len = this.children.length; i < len; i++) {
			this.children[i].render(container || this.container);
		}
	},
	
	/**
	 * Renders the view. 
	 * Rendering a view is done once after construction, and creates all the DOM elements needed for the visual 
	 * representation of the view. 
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		this.container = container;
		// TODO Can't we call renderChildren here?
		this.rendered = true;
	},
	
	/**
	 * Calls 'layout' on each of the child views.
	 * @private
	 */
	layoutChildren : function()
	{
		for (var i = 0, len = this.children.length; i < len; i++) {
			this.children[i].layout();
		}
	},

	/**
	 * Called just before this View will be {@link #layout layed out}.
	 * @protected
	 */
	onBeforeLayout : Ext.emptyFn,

	/**
	 * Called when this view is being {@link #layout layed out}.
	 * @protected
	 */
	onLayout : Ext.emptyFn,

	/**
	 * Called just after this View has been {@link #layout layed out}.
	 * @protected
	 */
	onAfterLayout : Ext.emptyFn,

	/**
	 * Lays out the view, setting the position and size of the individual DOM elements.
	 */
	layout : function()
	{
		this.onBeforeLayout();
		this.onLayout();
		this.onAfterLayout();
	},

	/**
	 * Calls 'destroy' on each of the child views.
	 * @private
	 */
	destroyChildren : function()
	{
		for (var i = 0, len = this.children.length; i < len; i++) {
			this.children[i].destroy();
		}
	},
	
	/**
	 * Destroys the view, removing all DOM elements generated by render() from the DOM tree and unhooks
	 * any events.
	 */
	destroy : function()
	{
		if (!this.isDestroyed) {
			if (this.fireEvent('beforedestroy', this) !== false) {
				// remove all elements generated with createDiv() from the DOM
				for (var i = 0, len = this.elements.length; i < len; i++) {
					this.elements[i].remove();
				}

				// destroy child views
				this.destroyChildren();

				this.onDestroy();

				this.fireEvent('destroy', this);
				this.purgeListeners();
			}

			this.isDestroyed = true;
		}
	},

	/**
	 * Set the {@link #parentView} field. This will be called by {@link #addChildView}
	 * to update the parent to this view. 
	 * @param {Zarafa.core.ui.View} parentView The parent view
	 * @private
	 */
	setParentView : function(parentView)
	{
		this.parentView = parentView;
	},

	/**
	 * Adds a child view to this view.
	 * @param {Zarafa.core.ui.View} child child view to be added 
	 */
	addChildView : function(child)
	{
		child.setParentView(this);
		this.children.push(child);
		return child;
	},
	
	/**
	 * Removes a child view from this view. 
	 * @param {Zarafa.core.ui.View} child child view to be added
	 * @param {Boolean} destroy if true, destroy the child view 
	 */
	removeChildView : function(child, destroy)
	{
		this.children.remove(child);
		child.setParentView(undefined);
		if (destroy) {
			child.destroy();
		}
	},

	/**
	 * Purge all event listeners.
	 * @private
	 */
	purgeListeners : Ext.Container.prototype.purgeListeners,

	/**
	 * Clear all monitored event listeners. This will call
	 * {@link Ext.util.Observable.un un()} on each previously
	 * registered event handler which was registered with
	 * {@link #mon}.
	 * @private
	 */
	clearMons : Ext.Container.prototype.clearMons,

	/**
	 * Create the tracking object in which we store
	 * each event handler which was registered with {@link #mon}.
	 * @private
	 */
	createMons : Ext.Container.prototype.createMons,

	/**
	 * Adds listeners to any Observable object (or Elements) which are automatically removed when this View
	 * is destroyed.
	 * @param {Observable|Element} item The item to which to add a listener/listeners.
	 * @param {Object|String} ename The event name, or an object containing event name properties.
	 * @param {Function} fn Optional. If the <code>ename</code> parameter was an event name, this
	 * is the handler function.
	 * @param {Object} scope Optional. If the <code>ename</code> parameter was an event name, this
	 * is the scope (<code>this</code> reference) in which the handler function is executed.
	 * @param {Object} opt Optional. If the <code>ename</code> parameter was an event name, this
	 * is the {@link Ext.util.Observable#addListener addListener} options.
	 */
	mon : Ext.Container.prototype.mon,

	/**
	 * Removes listeners that were added by the {@link #mon} method.
	 * @param {Observable|Element} item The item from which to remove a listener/listeners.
	 * @param {Object|String} ename The event name, or an object containing event name properties.
	 * @param {Function} fn Optional. If the <code>ename</code> parameter was an event name, this
	 * is the handler function.
	 * @param {Object} scope Optional. If the <code>ename</code> parameter was an event name, this
	 * is the scope (<code>this</code> reference) in which the handler function is executed.
	 */
	mun : Ext.Container.prototype.mun,

	/**
	 * Called when the View is being destroyed.
	 * @protected
	 */
	onDestroy : Ext.emptyFn
});
