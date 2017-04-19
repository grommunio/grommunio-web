Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.RadioDateTimeField
 * @extends Zarafa.common.ui.CompositeField
 * @xtype zarafa.radiodatetimefield
 *
 * This class can be used to construct a {@link Ext.form.Field field}
 * which contains a {@link Ext.form.Radio} and a {@link Zarafa.common.ui.DateTimeField}
 */
Zarafa.common.ui.RadioDateTimeField = Ext.extend(Zarafa.common.ui.CompositeField, {

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
                boxLabel: ' ',
                ref: 'radioField',
                name: 'radioField',
                listeners: {
                    check: this.onRadioCheck,
                    scope: this
                }
            }, {
                xtype: 'zarafa.datetimefield',
                ref: 'dateTimeField',
				cls:'zarafa-radiodatetime-datetimefield',
                minValue: new Date(),
                width: 200,
                listeners: {
                    change: this.onDateTimeChange,
                    afterrender: this.initEvent,
                    scope: this
                }
            }]
        });
        Zarafa.common.ui.RadioDateTimeField.superclass.constructor.call(this, config);
    },

    /**
     * Event handler which is called when {@link Zarafa.common.ui.DateTimeField dateTimeField} has receives input value,
     * If the input value is number then call the {@link Zarafa.common.ui.DateTimeField doDateChange} function.
     * @param {Zarafa.common.ui.DateTimeField} field The field which fired the event
     */
    onKeyUp: function (field)
    {
        var keyCode = Ext.EventObject.keyCode;
        if ((keyCode >= Ext.EventObject.ZERO && keyCode <= Ext.EventObject.NINE) || (keyCode >= Ext.EventObject.NUM_ZERO && keyCode <= Ext.EventObject.NUM_NINE)) {
            var oldValue = field.startValue;

            // Only change the time when it is a valid time
	        if ( field === this.dateTimeField.dateField || (Ext.isDefined(field.isValidTimeString) && field.isValidTimeString()) ) {
	            var newValue = field.getValue();
	            this.dateTimeField.doDateChange(newValue, oldValue);
            }
        }
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
     * Event handler which is called when the {@link Zarafa.common.ui.DateTimeField dateTimeField} receives input focus,
     * Set true in {@link Ext.form.Radio radioButton} and
     * Firing the {@link #focus} event.
     * @param {Zarafa.common.ui.DateTimeField} field The field which fired the event
     */
    onDateTimeFocus: function (field)
    {
        this.radioField.setValue(true);
        this.fireEvent('focus', this);
    },


    /**
     * Event handler which is called when the date has been changed,
     * and firing the {@link #change} event.
     * @param {Zarafa.common.ui.DateTimeField} field The field which has fired the event
     * @param {Date} newValue The new Date inside the DateTimeField
     * @param {Date} oldValue The old Date from the DateTimeField
     * @private
     */
    onDateTimeChange: function (field, newValue, oldValue)
    {

        var dateTime = this.getDateTime();
        this.fireEvent('change', this, dateTime);
    },

    /**
     * Function is use to add listener on keyup and focus event
     * and remove listener on change event of {@link Ext.form.DateField dateField} and a {@link Ext.ux.form.Spinner spinner}
     */
    initEvent: function ()
    {
        var timeField = this.dateTimeField.timeField;
        var dateField = this.dateTimeField.dateField;
        timeField.enableKeyEvents = true;
        dateField.enableKeyEvents = true;
        timeField.initEvents();
        dateField.initEvents();

        // Add listener on keyup event
        timeField.on('keyup', this.onKeyUp, this);
        dateField.on('keyup', this.onKeyUp, this);

        // Add listener on focus event
        timeField.on('focus', this.onDateTimeFocus, this);
        dateField.on('focus', this.onDateTimeFocus, this);

        // Remove listener on change event
        timeField.un('change', this.dateTimeField.onTimeChange, this.dateTimeField);
        dateField.un('change', this.dateTimeField.onDateChange, this.dateTimeField);
    },

    /**
     * Function return the {@link Zarafa.common.ui.DateTimeField dateTimeField} value
     * @return {Date} The date object
     */
    getDateTime: function ()
    {
        return this.dateTimeField.getValue();
    },

    /**
     * Function set true in {@link Ext.form.Radio radioButton} and
     * set value in {@link Zarafa.common.ui.DateTimeField dateTimeField}
     * @param {Date} value The date object
     */
    setValue: function (value)
    {
        this.radioField.setValue(true);
        this.dateTimeField.setValue(value);
    },

    /**
     * Function add css class to the  {@link Zarafa.common.ui.DateTimeField dateTimeField}
     * @param {String} cls CSS class name
     */
    addClass: function (cls)
    {
        this.dateTimeField.addClass(cls);
    },

    /**
     * Function remove css class to the  {@link Zarafa.common.ui.DateTimeField dateTimeField}
     * @param {String} cls CSS class name
     */
    removeClass: function (cls)
    {
        this.dateTimeField.removeClass(cls);
    }

});

Ext.reg('zarafa.radiodatetimefield', Zarafa.common.ui.RadioDateTimeField);
