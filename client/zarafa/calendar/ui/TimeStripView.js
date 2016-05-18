Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.TimeStripView
 * @extends Zarafa.core.ui.View
 * 
 * Handles drawing of the time strips that appear on the left in the calendar. Multiple time strips can be
 * placed on a single calendar, each representing different time zones. Time strips may have names, which
 * are rendered into the header section of the parent calendar view.
 * 
 * Also see {@link Zarafa.calendar.ui.CalendarMultiView}
 */
Zarafa.calendar.ui.TimeStripView = Ext.extend(Zarafa.core.ui.View, {
	/**
	 * @cfg {Number} timeDifference difference in hours between this strip's time zone and the local time zone.
	 * For example if the local time zone is GMT +2:00, and you want to have a strip that shows the time in Mumbai
	 * (GMT +5:30), the time difference is +3:30, or 3.5 hours.
	 */
	timeDifference : 0,

	/**
	 * @cfg {String} name the name of this time strip, for example 'Mumbai' or 'Zurich'. Will be shown above the
	 * strip in the header area.
	 */
	name : '',

	/**
	 * @cfg {String} textTemplate The template to be used for the Hour indications inside the strip.
	 */
	textTemplate : '<div>{0}:00</div>',

	/**
	 * The offset all elements must have from the left side of the {@link #container}. This
	 * offset is configured before {@link #layout} by {@link #setLeftMargin}.
	 * @property
	 * @type Number
	 */
	leftOffset : 0,

	/**
	 * The total with for the tab to use. This must at least be the result of {@link #getMinimumWidth}.
	 * This is configured before {@link #layout} by {@link #setWidth}.
	 * @property
	 * @type Number
	 */
	width : 0,

	/**
	 * The &lt;div&gt; element which is used as the header container for the
	 * timestrip. This element is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	header : undefined,

	/**
	 * The &lt;div&gt; element which is used as the body container for the
	 * timestrip. This contains the &lt;div&gt; elements from {@link #bodyElements} and {@link #bodyLines}.
	 * This element is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	body : undefined,

	/**
	 * The &lt;div&gt; elements which indicate the time for the given hour. The contents
	 * of this &lt;div&gt; is generated using the {@link #textTemplate}.
	 * These elements are created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Array
	 */
	bodyElements : undefined,

	/**
	 * The &lt;div&gt; elements which are used to separate the different
	 * {@link #bodyElements} from eachother.
	 * These elements are created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Array
	 */
	bodyLines : undefined, 

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			baseCls: 'zarafa-calendar',
			itemCls: 'timestrip'
		});
		
		Zarafa.calendar.ui.TimeStripView.superclass.constructor.call(this, config);
	},

	/**
	 * Sets the tab minimum offset from the left. Called by the parent
	 * {@link Zarafa.calendar.ui.AbstractCalendarView AbstractCalendarView} before layout.
	 * @param {Number} left The offset from the left
	 */
	setLeftMargin : function(left)
	{
		this.leftOffset = left;
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
	 * Renders the view. This will create the {@link #body} and {@link #header} elements,
	 * as well as the subelements {@link #bodyElements} and {@link #bodyLines}.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		this.createDiv(this.parentView.scrollable, 'body', this.getClassName('body'));

		this.bodyElements = [];
		this.bodyLines = [];

		// create timestrip hour divs for each hour of the day
		var numHours = this.parentView.numHours;
		for (var i = 0; i< numHours; i++) {
			this.createDiv(this.body, 'bodyElements', this.getClassName('element'));
			this.createDiv(this.body, 'bodyLines', this.getClassName('line'));
		}
		
		// create a small header div for the time strip name (if any)
		this.createDiv(this.parentView.header, 'header',  this.getClassName('header'));
		this.header.dom.innerHTML = this.name;

		Zarafa.calendar.ui.TimeStripView.superclass.render.call(this, container);

		// Everything has been rendered, now update the elements to contains the
		// hour text.
		this.generateText();
	},

	/**
	 * Mark the elements for this {@link Zarafa.core.ui.View View} visible.
	 * @param {Boolean} visible
	 */
	setVisible : function(visible)
	{
		if (this.rendered) {
			this.body.setVisible(visible);
			this.header.setVisible(visible);
		}
	},
	
	/**
	 * Generates the text for the header element that shows the time strip name.
	 * This will apply the {@link #textTemplate} to each of the {@link #bodyElements} elements.
	 * @private
	 */
	generateText : function()
	{
		if (!this.rendered)
			return;
		
		// resize each of the hour divs
		for (var i = 0, len = this.bodyElements.length; i < len; i++) {
			var hour = (i + Math.floor(this.timeDifference) + 24) % 24;
			var date = new Date(0, 0, 0, hour);
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			this.bodyElements[i].dom.innerHTML = String.format(this.textTemplate, date.format(_("G"))); 
		}
	},
	
	/**
	 * Lays out the time strip, setting the position and size of the individual DOM elements.
	 * The desired {@link #leftOffset} and {@link #width} have already been configured by
	 * the {@link #parentView} using the {@link #setLeftMargin} and {@link #setWidth} respectively.
	 */
	onLayout : function()
	{
		if (!this.rendered)
			return;
		
		this.body.setLeftTop(this.leftOffset, 0);
		this.body.setSize(this.width, this.parentView.getHourHeight() * this.parentView.numHours);
		
		var shift = Math.round(this.timeDifference) - this.timeDifference;
		
		// resize each of the hour divs
		for (var i = 0, len = this.bodyElements.length; i < len; i++) {
			this.bodyElements[i].setSize(this.width, this.parentView.getHourHeight());
			this.bodyElements[i].setLeftTop(0, this.parentView.getHourHeight() * (i + shift));
		}

		// Layout the lines between each of the hour blocks
		for (var i = 0, len = this.bodyLines.length; i < len; i++) {
			this.bodyLines[i].setSize(this.width, 1);
			this.bodyLines[i].setLeftTop(0, this.parentView.getHourHeight() * (i + shift) -1);
		}
		
		// layout the header element
		this.header.setWidth(this.width);
		this.header.setLeft(this.leftOffset);
		this.header.setBottom(0);

		Zarafa.calendar.ui.TimeStripView.superclass.onLayout.call(this);
	},
	
	/**
	 * Sets the time difference in hours between this strip's time zone and the local time zone.
	 * For example if the local time zone is GMT +2:00, and you want to have a strip that shows the time in Mumbai
	 * (GMT +5:30), the time difference is +3:30, or 3.5 hours.
	 * @param {Number} timeDifference timeDifference difference in hours.
	 */
	setTimeDifference : function(timeDifference)
	{
		this.timeDifference = timeDifference;
		this.generateText();
		this.layout();
	},
	
	/**
	 * Sets the name of the time strip. Auto-updates the text on screen.
	 * @param {String} name name of the time strip
	 */
	setName : function(name)
	{
		this.name = name;
		this.generateText();
	}
});
