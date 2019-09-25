(function() {
	/**
	 * @class Ext.Component
	 * @extends Ext.util.Observable
	 * <p>Base class for all Ext components.  All subclasses of Component may participate in the automated
	 * Ext component lifecycle of creation, rendering and destruction which is provided by the {@link Ext.Container Container} class.
	 * Components may be added to a Container through the {@link Ext.Container#items items} config option at the time the Container is created,
	 * or they may be added dynamically via the {@link Ext.Container#add add} method.</p>
	 * <p>The Component base class has built-in support for basic hide/show and enable/disable behavior.</p>
	 * <p>All Components are registered with the {@link Ext.ComponentMgr} on construction so that they can be referenced at any time via
	 * {@link Ext#getCmp}, passing the {@link #id}.</p>
	 * <p>All user-developed visual widgets that are required to participate in automated lifecycle and size management should subclass Component (or
	 * {@link Ext.BoxComponent} if managed box model handling is required, ie height and width management).</p>
	 * <p>See the <a href="http://extjs.com/learn/Tutorial:Creating_new_UI_controls">Creating new UI controls</a> tutorial for details on how
	 * and to either extend or augment ExtJs base classes to create custom Components.</p>
	 * <p>Every component has a specific xtype, which is its Ext-specific type name, along with methods for checking the
	 * xtype like {@link #getXType} and {@link #isXType}. This is the list of all valid xtypes:</p>
	 * <pre>
	xtype            Class
	-------------    ------------------
	box              {@link Ext.BoxComponent}
	button           {@link Ext.Button}
	buttongroup      {@link Ext.ButtonGroup}
	colorpalette     {@link Ext.ColorPalette}
	component        {@link Ext.Component}
	container        {@link Ext.Container}
	cycle            {@link Ext.CycleButton}
	dataview         {@link Ext.DataView}
	datepicker       {@link Ext.DatePicker}
	editor           {@link Ext.Editor}
	editorgrid       {@link Ext.grid.EditorGridPanel}
	flash            {@link Ext.FlashComponent}
	grid             {@link Ext.grid.GridPanel}
	listview         {@link Ext.ListView}
	multislider      {@link Ext.slider.MultiSlider}
	panel            {@link Ext.Panel}
	progress         {@link Ext.ProgressBar}
	propertygrid     {@link Ext.grid.PropertyGrid}
	slider           {@link Ext.slider.SingleSlider}
	spacer           {@link Ext.Spacer}
	splitbutton      {@link Ext.SplitButton}
	tabpanel         {@link Ext.TabPanel}
	treepanel        {@link Ext.tree.TreePanel}
	viewport         {@link Ext.ViewPort}
	window           {@link Ext.Window}

	Toolbar components
	---------------------------------------
	paging           {@link Ext.PagingToolbar}
	toolbar          {@link Ext.Toolbar}
	tbbutton         {@link Ext.Toolbar.Button}        (deprecated; use button)
	tbfill           {@link Ext.Toolbar.Fill}
	tbitem           {@link Ext.Toolbar.Item}
	tbseparator      {@link Ext.Toolbar.Separator}
	tbspacer         {@link Ext.Toolbar.Spacer}
	tbsplit          {@link Ext.Toolbar.SplitButton}   (deprecated; use splitbutton)
	tbtext           {@link Ext.Toolbar.TextItem}

	Menu components
	---------------------------------------
	menu             {@link Ext.menu.Menu}
	colormenu        {@link Ext.menu.ColorMenu}
	datemenu         {@link Ext.menu.DateMenu}
	menubaseitem     {@link Ext.menu.BaseItem}
	menucheckitem    {@link Ext.menu.CheckItem}
	menuitem         {@link Ext.menu.Item}
	menuseparator    {@link Ext.menu.Separator}
	menutextitem     {@link Ext.menu.TextItem}

	Form components
	---------------------------------------
	form             {@link Ext.form.FormPanel}
	checkbox         {@link Ext.form.Checkbox}
	checkboxgroup    {@link Ext.form.CheckboxGroup}
	combo            {@link Ext.form.ComboBox}
	compositefield   {@link Ext.form.CompositeField}
	datefield        {@link Ext.form.DateField}
	displayfield     {@link Ext.form.DisplayField}
	field            {@link Ext.form.Field}
	fieldset         {@link Ext.form.FieldSet}
	hidden           {@link Ext.form.Hidden}
	htmleditor       {@link Ext.form.HtmlEditor}
	label            {@link Ext.form.Label}
	numberfield      {@link Ext.form.NumberField}
	radio            {@link Ext.form.Radio}
	radiogroup       {@link Ext.form.RadioGroup}
	textarea         {@link Ext.form.TextArea}
	textfield        {@link Ext.form.TextField}
	timefield        {@link Ext.form.TimeField}
	trigger          {@link Ext.form.TriggerField}

	Chart components
	---------------------------------------
	chart            {@link Ext.chart.Chart}
	barchart         {@link Ext.chart.BarChart}
	cartesianchart   {@link Ext.chart.CartesianChart}
	columnchart      {@link Ext.chart.ColumnChart}
	linechart        {@link Ext.chart.LineChart}
	piechart         {@link Ext.chart.PieChart}

	Store xtypes
	---------------------------------------
	arraystore       {@link Ext.data.ArrayStore}
	directstore      {@link Ext.data.DirectStore}
	groupingstore    {@link Ext.data.GroupingStore}
	jsonstore        {@link Ext.data.JsonStore}
	simplestore      {@link Ext.data.SimpleStore}      (deprecated; use arraystore)
	store            {@link Ext.data.Store}
	xmlstore         {@link Ext.data.XmlStore}
	</pre>
	* @constructor
	* @param {Ext.Element/String/Object} config The configuration options may be specified as either:
	* <div class="mdetail-params"><ul>
	* <li><b>an element</b> :
	* <p class="sub-desc">it is set as the internal element and its id used as the component id</p></li>
	* <li><b>a string</b> :
	* <p class="sub-desc">it is assumed to be the id of an existing element and is used as the component id</p></li>
	* <li><b>anything else</b> :
	* <p class="sub-desc">it is assumed to be a standard config object and is applied to the component</p></li>
	* </ul></div>
	*/
	var orig_initComponent = Ext.Component.prototype.initComponent;
	var orig_destroy = Ext.Component.prototype.destroy;
	Ext.override(Ext.Component, {
		// By default stateful is 'undefined' however a component
		// is stateful when this property !== false. Hence we have
		// to force-disable the statefulness of components.
		stateful : false,

		/**
		 * @cfg {Boolean} statefulRelativeDimensions True if the 'width' and 'height' of the {@link #field} must be
		 * converted to relative values before saving it to the settings. This will ensure the dimensions
		 * of the field will always depend on the current size of the {@link Ext#getBody body}.
		 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
		 * used in the {@link Ext.state.Manager}.
		 */
		statefulRelativeDimensions : true,

		/**
		 * @cfg {String} statefulName The unique name for this component by which the {@link #getState state}
		 * must be saved into the {@link Zarafa.settings.SettingsModel settings}.
		 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
		 * used in the {@link Ext.state.Manager}.
		 */
		statefulName : undefined,

		// Override to generate a stateId and register the Component to the Ext.state.Manager
		initComponent : function()
		{
			if (this.stateful !== false) {
				if (!this.stateId) {
					this.stateId = Ext.id(null, 'state-');
				}

				Ext.state.Manager.register(this);
			}

			orig_initComponent.apply(this, arguments);
		},

		/**
		 * Obtain the path in which the {@link #getState state} must be saved.
		 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
		 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
		 * a custom name.
		 * @return {String} The unique name for this component by which the {@link #getState state} must be saved. 
		 */
		getStateName : function()
		{
			var name = this.statefulName;
			if (!name) {
				name = this.getXType().match(/(?:zarafa\.)?(.*)/)[1];
			}

			return name;
		},

		// Override the destroy function of the Ext.Component,
		// each component might have plugins installed on it.
		// Those plugins might be Ext.util.Observables and thus
		// need to be properly destroyed when the component is
		// destroyed. Otherwise references to the plugin will
		// remain and will still refer to the destroyed field.
		destroy : function()
		{
			if (this.plugins) {
				for (var key in this.plugins) {
					var plugin = this.plugins[key];
					if (plugin instanceof Ext.util.Observable) {
						plugin.purgeListeners();
					}
				}
			}

			if (this.stateful !== false) {
				Ext.state.Manager.unregister(this);
			}

			orig_destroy.apply(this, arguments);
		}
	});
})();
