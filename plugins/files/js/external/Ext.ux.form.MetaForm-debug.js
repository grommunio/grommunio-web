/**
 * @class Ext.ux.form.MetaForm
 * @extends Ext.form.FormPanel
 *
 * A FormPanel configured by metadata received from server
 *
 * @author    Ing. Jozef Sakalos
 * @copyright (c) 2008, by Ing. Jozef Sakalos
 * @version   1.3
 * @date      <ul>
 * <li>6. February 2007</li>
 * <li>6. March 2009</li>
 * <li>12. Nov 2014</li>
 * </ul>
 * @revision  $Id: Ext.ux.form.MetaForm.js 625 2014-11-12 00:04:59Z chaas $
 *
 * @license Ext.ux.form.MetaForm is licensed under the terms of
 * the Open Source LGPL 3.0 license.  Commercial use is permitted to the extent
 * that the code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 *
 * <p>License details: <a href="http://www.gnu.org/licenses/lgpl.html"
 * target="_blank">http://www.gnu.org/licenses/lgpl.html</a></p>
 *
 * @forum     25551
 *
 * @donate
 * <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
 * <input type="hidden" name="cmd" value="_s-xclick">
 * <input type="hidden" name="hosted_button_id" value="3430419">
 * <input type="image" src="https://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif"
 * border="0" name="submit" alt="PayPal - The safer, easier way to pay online.">
 * <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1">
 * </form>
 */

Ext.ns('Ext.ux.form');
/**
 * Creates new MetaForm
 * @constructor
 * @param {Object} config A config object
 */
Ext.ux.form.MetaForm = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @cfg {Boolean/Object} autoInit
	 * Load runs immediately after the form is rendered if autoInit is set. In the case of boolean true
	 * the load runs with {meta:true} and in the case of object the load takes autoInit as argument
	 * (defaults to true)
	 */
	autoInit: true

	/**
	 * @cfg {Object} baseParams
	 * Params sent with each request (defaults to undefined)
	 */

	/**
	 * @cfg {Boolean} border
	 * True to display the borders of the panel's body element, false to hide them (defaults to false).  By default,
	 * the border is a 2px wide inset border, but this can be further altered by setting {@link #bodyBorder} to false.
	 */
	, border: false

	/**
	 * @cfg {Boolean} focusFirstField
	 * True to try to focus the first form field on metachange (defaults to true)
	 */
	, focusFirstField: true

	/**
	 * True to render the panel with custom rounded borders, false to render with plain 1px square borders (defaults to true).
	 */
	, frame: true

	/**
	 * @cfg {String} loadingText
	 * Localizable text for "Loading..."
	 */
	, loadingText: 'Loading...'

	/**
	 * @cfg {String} savingText
	 * Localizable text for "Saving..."
	 */
	, savingText: 'Saving...'

	/**
	 * @cfg {Number} buttonMinWidth
	 * Minimum width of buttons (defaults to 90)
	 */
	, buttonMinWidth: 90

	/**
	 * @cfg {Number} columnCount
	 * MetaForm has a column layout insise with this number of columns (defaults to 1)
	 */
	, columnCount: 1

	/**
	 * True if meta data has been processed and fields have been created, false otherwise (read-only)
	 * @property hasMeta
	 * @type Boolean
	 */
	, hasMeta: false

	/**
	 * Runs after the meta data has been processed and the form fields have been created.
	 * Override it to add your own extra processing if you need (defaults to Ext.emptyFn)
	 * @method afterMetaChange
	 */
	, afterMetaChange: Ext.emptyFn


	/**
	 * Runs after bound data is updated. Override to add any extra processing you may need
	 * after the bound data is updated (defaults to Ext.emptyFn)
	 * @param {Ext.ux.form.MetaForm} form This form
	 * @param {Object} data Updated bound data
	 */
	, afterUpdate: Ext.emptyFn

	, applyDefaultValues: function (o) {
		if ('object' !== typeof o) {
			return;
		}
		for (var name in o) {
			if (o.hasOwnProperty(name)) {
				var field = this.form.findField(name);
				if (field) {
					field.defaultValue = o[name];
				}
			}
		}
	}

	/**
	 * @private
	 * Changes order of execution in Ext.form.Action.Load::success
	 * to allow reading of data in this server request (otherwise data would
	 * be loaded to the form before onMetaChange is run from actioncomplete event
	 */
	, beforeAction: function (form, action) {
		action.success = function (response) {
			var result = this.processResponse(response);
			if (result === true || !result.success || !result.data) {
				this.failureType = Ext.form.Action.LOAD_FAILURE;
				this.form.afterAction(this, false);
				return;
			}
			// original
//            this.form.clearInvalid();
//            this.form.setValues(result.data);
//            this.form.afterAction(this, true);

			this.form.afterAction(this, true);
			this.form.clearInvalid();
			this.form.setValues(result.data);
		};
	}

	/**
	 * Backward compatibility function, calls {@link #bindData} function
	 * @param {Object} data
	 * A reference to an external data object. The idea is that form can display/change an external object
	 */
	, bind: function (data) {
		this.bindData(data);
	}

	/**
	 * @param {Object} data
	 * A reference to an external data object. The idea is that form can display/change an external object
	 */
	, bindData: function (data) {
		this.data = data;
		this.form.setValues(this.data);
	}

	/**
	 * Closes the parent if it is a window
	 * @private
	 */
	, closeParentWindow: function () {
		if (this.ownerCt && this.ownerCt.isXType('window')) {
			this.ownerCt[this.ownerCt.closeAction]();
		}
	}

	/**
	 * Returns button thet has the given name
	 * @param {String} name Button name
	 * @return {Ext.Button/Null} Button found or null if not found
	 */
	, findButton: function (name) {
		var btn = null;
		Ext.each(this.buttons, function (b) {
			if (name === b.name) {
				btn = b;
			}
		});
		return btn;
	}

	/**
	 * Returns the button. This funcion is undefined by default, supply it if you want an automated button creation.
	 * @method getButton
	 * @param {String} name A symbolic button name
	 * @param {Object} config The button config object
	 * @return {Ext.Button} The created button
	 */

	/**
	 * override this if you want a special buttons config
	 */
	, getButtons: function () {
		var buttons = [];
		if (Ext.isArray(this.createButtons)) {
			Ext.each(this.createButtons, function (name) {
				buttons.push(this.getButton(name, {
					handler: this.onButtonClick
					, scope: this
					, minWidth: this.buttonMinWidth
					, name: name
				}));
			}, this);
		}
		return buttons;
	}

	, getOptions: function (o) {
		o = o || {};
		var options = {
			url: this.url
			, method: this.method || 'POST'
		};
		Ext.apply(options, o);
		var params = this.baseParams ? Ext.ux.util.clone(this.baseParams) : {};
		options.params = Ext.apply(params, o.params);
		return options;
	}

	/**
	 * Returns values calling the individual fields' getValue() methods
	 * @return {Object} object with name/value pairs
	 */
	, getValues: function () {
		var values = {};
		this.form.items.each(function (f) {
			values[f.name] = f.getValue();
		});
		return values;
	}

	, initComponent: function () {

		var config = {
			items: this.items || {}
		};
		if ('function' === typeof this.getButton) {
			config.buttons = this.getButtons();
		}

		// apply config
		Ext.apply(this, Ext.apply(this.initialConfig, config));

		// call parent
		Ext.ux.form.MetaForm.superclass.initComponent.apply(this, arguments);

		// add events
		this.addEvents(
			/**
			 * @event beforemetachange
			 * Fired before meta data is processed. Return false to cancel the event
			 * @param {Ext.ux.form.MetaForm} form This form
			 * @param {Object} metaData The meta data being processed
			 */
			'beforemetachange'
			/**
			 * @event metachange
			 * Fired after meta data is processed and form fields are created.
			 * @param {Ext.ux.form.Metadata} form This form
			 * @param {Object} metaData The meta data processed
			 */
			, 'metachange'
			/**
			 * @event beforebuttonclick
			 * Fired before the button click is processed. Return false to cancel the event
			 * @param {Ext.ux.form.MetaForm} form This form
			 * @param {Ext.Button} btn The button clicked
			 */
			, 'beforebuttonclick'
			/**
			 * @event buttonclick
			 * Fired after the button click has been processed
			 * @param {Ext.ux.form.MetaForm} form This form
			 * @param {Ext.Button} btn The button clicked
			 */
			, 'buttonclick'
		);

		// install event handlers on basic form
		this.form.on({
			beforeaction: {scope: this, fn: this.beforeAction}
			, actioncomplete: {
				scope: this, fn: function (form, action) {
					// (re) configure the form if we have (new) metaData
					if ('load' === action.type && action.result.metaData) {
						this.onMetaChange(this, action.result.metaData);
					}
					// update bound data on successful submit
					else if ('submit' === action.type) {
						this.updateBoundData();
					}
				}
			}
		});
		this.form.trackResetOnLoad = true;

	}

	, load: function (o) {
		var options = this.getOptions(o);
		if (this.loadingText) {
			options.waitMsg = this.loadingText;
		}
		this.form.load(options);
	}

	/**
	 * Called in the scope of this form when user clicks a button. Override it if you need a different
	 * functionality of the button handlers.
	 * <i>Note: Buttons created by MetaForm has name property that matches {@link #createButtons} names</i>
	 * @param {Ext.Button} btn The button clicked.
	 * @param {Ext.EventObject} e Click event
	 */
	, onButtonClick: function (btn, e) {
		if (false === this.fireEvent('beforebuttonclick', this, btn)) {
			return;
		}
		switch (btn.name) {
			case 'meta':
				this.load({params: {meta: true}});
				break;

			case 'load':
				this.load({params: {meta: !this.hasMeta}});
				break;

			case 'defaults':
				this.setDefaultValues();
				break;

			case 'reset':
				this.form.reset();
				break;

			case 'save':
				this.updateBoundData();
				this.submit();
				this.closeParentWindow();
				break;

			case 'ok':
				this.updateBoundData();
				this.closeParentWindow();
				break;

			case 'cancel':
				this.closeParentWindow();
				break;
		}
		this.fireEvent('buttonclick', this, btn);
	}

	/**
	 * Override this if you need a custom functionality
	 *
	 * Customized by chaas, fixed adding of event listeners
	 *
	 * @param {Ext.FormPanel} this
	 * @param {Object} meta Metadata
	 * @return void
	 */
	, onMetaChange: function (form, meta) {
		if (false === this.fireEvent('beforemetachange', this, meta)) {
			return;
		}
		this.removeAll();
		this.hasMeta = false;

		// declare varables
		var columns, colIndex, tabIndex, ignore = {};

		// add column layout
		this.add(new Ext.Panel({
			layout: 'column'
			, anchor: '100%'
			, border: false
			, defaults: (function () {
				this.columnCount = meta.formConfig ? meta.formConfig.columnCount || this.columnCount : this.columnCount;
				return Ext.apply({}, meta.formConfig || {}, {
					columnWidth: 1 / this.columnCount
					, autoHeight: true
					, border: false
					, hideLabel: true
					, layout: 'form'
				});
			}).createDelegate(this)()
			, items: (function () {
				var items = [];
				for (var i = 0; i < this.columnCount; i++) {
					items.push({
						defaults: this.defaults
						, listeners: {
							// otherwise basic form findField does not work
							add: {scope: this, fn: this.onAdd}
						}
					});
				}
				return items;
			}).createDelegate(this)()
		}));

		columns = this.items.get(0).items;
		colIndex = 0;
		tabIndex = 1;

		if (Ext.isArray(this.ignoreFields)) {
			Ext.each(this.ignoreFields, function (f) {
				ignore[f] = true;
			});
		}
		// loop through metadata colums or fields
		// format follows grid column model structure
		Ext.each(meta.columns || meta.fields, function (item) {
			if (true === ignore[item.name]) {
				return;
			}

			// parse listeners
			var listeners = {};
			if (Ext.isDefined(item.editor.listeners)) {
				for (var listener in item.editor.listeners) {
					if (item.editor.listeners.hasOwnProperty(listener)) {
						listeners[listener] = {scope: this, fn: eval(item.editor.listeners[listener])};
					}
				}
				//listeners["scope"] = this; // set the correct scope
				delete item.editor.listeners; // remove the original listeners object
			}

			var config = Ext.apply({}, item.editor, {
				name: item.name || item.dataIndex
				, fieldLabel: item.fieldLabel || item.header
				, defaultValue: item.defaultValue
				, xtype: item.editor && item.editor.xtype ? item.editor.xtype : 'textfield'
				, listeners: listeners
			});

			// handle regexps
			if (config.editor && config.editor.regex) {
				config.editor.regex = new RegExp(item.editor.regex);
			}

			// to avoid checkbox misalignment
			if ('checkbox' === config.xtype) {
				Ext.apply(config, {
					boxLabel: ' '
					, checked: item.defaultValue
				});
			}
			if (meta.formConfig.msgTarget) {
				config.msgTarget = meta.formConfig.msgTarget;
			}

			// add to columns on ltr principle
			config.tabIndex = tabIndex++;
			columns.get(colIndex++).add(config);
			colIndex = colIndex === this.columnCount ? 0 : colIndex;

		}, this);
		if (this.rendered && 'string' !== typeof this.layout) {
			this.el.setVisible(false);
			this.doLayout();
			this.el.setVisible(true);
		}
		this.hasMeta = true;
		if (this.data) {
			// give DOM some time to settle
			(function () {
				this.form.setValues(this.data);
			}.defer(1, this))
		}
		this.afterMetaChange();
		this.fireEvent('metachange', this, meta);

		// try to focus the first field
		if (this.focusFirstField) {
			var firstField = this.form.items.itemAt(0);
			if (firstField && firstField.focus) {
				var delay = this.ownerCt && this.ownerCt.isXType('window') ? 1000 : 100;
				firstField.focus(firstField.selectOnFocus, delay);
			}
		}
	}

	, onRender: function () {
		// call parent
		Ext.ux.form.MetaForm.superclass.onRender.apply(this, arguments);

		this.form.waitMsgTarget = this.el;

		if (this.metaData) {
			this.onMetaChange(this, this.metaData);
			if (this.data) {
				this.bindData(this.data);
			}
		}
		else if (true === this.autoInit) {
			this.load(this.getOptions({params: {meta: true}}));
		}
		else if ('object' === typeof this.autoInit) {
			this.load(this.autoInit);
		}

	}

	, removeAll: function () {
		// remove border from header
		var hd = this.body.up('div.x-panel-bwrap').prev();
		if (hd) {
			hd.applyStyles({border: 'none'});
		}
		// remove form panel items
		this.items.each(this.remove, this);

		// remove basic form items
		this.form.items.clear();
	}

	, reset: function () {
		this.form.reset();
	}

	, setDefaultValues: function () {
		this.form.items.each(function (item) {
			item.setValue(item.defaultValue);
		});
	}

	, submit: function (o) {
		var options = this.getOptions(o);
		if (this.savingText) {
			options.waitMsg = this.savingText;
		}
		this.form.submit(options);
	}

	, updateBoundData: function () {
		if (this.data) {
			Ext.apply(this.data, this.getValues());
			this.afterUpdate(this, this.data);
		}
	}

	, beforeDestroy: function () {
		if (this.data) {
			this.data = null;
		}
		Ext.ux.form.MetaForm.superclass.beforeDestroy.apply(this, arguments);
	}

});
Ext.reg('metaform', Ext.ux.form.MetaForm);
