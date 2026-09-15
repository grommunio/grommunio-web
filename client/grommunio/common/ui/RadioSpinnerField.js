Ext.namespace('Grommunio.common.ui');

/**
 * @class Grommunio.common.ui.RadioSpinnerField
 * @extends Grommunio.common.ui.CompositeField
 * @xtype grommunio.radiospinnerfield
 *
 * This class can be used to construct a {@link Ext.form.Field field}
 * which contains a {@link Grommunio.common.ui.SpinnerField},{@link Ext.form.Radio} and {@link Ext.form.DisplayField}
 */
Grommunio.common.ui.RadioSpinnerField = Ext.extend(Grommunio.common.ui.CompositeField, {
  /**
   * @cfg {String} type The type of this spinnerfield. Can be 'hours', 'days', or 'months'
   */
  type: undefined,

  /**
   * @cfg {String} value The value which is inputValue of {@link Ext.form.Radio} and value for {@link Ext.form.DisplayField}
   */
  value: undefined,

  /**
   * @constructor
   * @param config Configuration structure
   */
  constructor: function (config)
  {
    config = config || {};

    Ext.apply(this, config);
    config = Ext.applyIf(config, {
      items: [{
        xtype: 'radio',
        boxLabel: _('in'),
        ref: 'radioField',
        name: 'radioField',
        inputValue: this.value,
        listeners: {
          check: this.onRadioCheck,
          scope: this
        }
      }, {
        xtype: 'grommunio.spinnerfield',
        ref: 'spinnerField',
        defaultValue: 1,
        minValue: 1,
        maxValue: 999,
        incrementValue: 1,
        enableKeyEvents: true,
        width: 45,
        plugins: ['grommunio.numberspinner'],
        listeners: {
          spin: this.onValueChange,
          keyup: this.onValueChange,
          focus: this.onFocus,
          scope: this
        }
      }, {
        xtype: 'displayfield',
        value: this.value
      }]
    });
    Grommunio.common.ui.RadioSpinnerField.superclass.constructor.call(this, config);
  },

  /**
   * Event handler which is called when the {@link Ext.form.Radio radioButton} is checked,
   * and firing the {@link #focus} event.
   * @param {Ext.form.Radio} field The field which fired the event
   * @param {Boolean} checked true if field checked
   */
  onRadioCheck: function (field, checked)
  {
    if (checked === true) {
      this.fireEvent('focus', this);
    }
  },

  /**
   * Event handler which is called when the {@link Grommunio.common.ui.SpinnerField spinnerField} receives input focus,
   * Set true in {@link Ext.form.Radio radioButton} and Firing the {@link #focus} event.
   * @param {Grommunio.common.ui.SpinnerField} field The field which fired the event
   */
  onFocus: function (field)
  {
    this.radioField.setValue(true);
    this.fireEvent('focus', this);
  },

  /**
   * Event handler which is called when the {@link Grommunio.common.ui.SpinnerField spinnerField} value change,
   * and firing the {@link #change} event.
   * @param {Grommunio.common.ui.SpinnerField} field The field which fired the event
   */
  onValueChange: function (field)
  {
    var dateTime = this.getDateTime();
    this.fireEvent('change', this, dateTime);
  },

  /**
   * Function create date and time using {@link Grommunio.common.ui.SpinnerField spinnerField} value
   * @returns {Date} Date object
   */
  getDateTime: function ()
  {
    var spinnerValue = this.spinnerField.getValue();
    var currentDate = new Date();
    switch (this.type) {
      case 'days':
        return currentDate.add(Date.DAY, spinnerValue);
      case 'months':
        return currentDate.add(Date.MONTH, spinnerValue);
      default:
        return currentDate.add(Date.HOUR, spinnerValue);
    }
  }
});

Ext.reg('grommunio.radiospinnerfield', Grommunio.common.ui.RadioSpinnerField);
