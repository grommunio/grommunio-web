Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.DelayedDeliveryPanel
 * @extends Ext.Panel
 * @xtype zarafa.delayeddeliverypanel
 *
 * Panel for users to set the deferred_send_time on a given {@link Zarafa.mail.MailRecord record}
 */
Zarafa.mail.dialogs.DelayedDeliveryPanel = Ext.extend(Ext.Panel, {

    /**
     * @cfg {Date} scheduledMailDateTime which is date and time when mail should be delivered
     */
    scheduledMailDateTime: undefined,

    /**
     * @constructor
     * @param config Configuration structure
     */
    constructor: function (config)
    {
        config = config || {};

        config = Ext.applyIf(config, {
            xtype: 'zarafa.delayeddeliverypanel',
            border: false,
			cls : 'zarafa-delayeddeliverypanel',
            items: [{
                xtype: 'zarafa.radiospinnerfield',
				cls : 'zarafa-delayeddeliverypanel-radiospinnerfield',
                type: 'hours',
                value: _('hour(s)'),
                listeners: {
                    focus: this.onFieldFocus,
                    change: this.onFieldChange,
                    scope: this
                }
            }, {
                xtype: 'zarafa.radiospinnerfield',
                type: 'days',
				cls : 'zarafa-delayeddeliverypanel-radiospinnerfield',
                value: _('day(s)'),
                listeners: {
                    focus: this.onFieldFocus,
                    change: this.onFieldChange,
                    scope: this
                }
            }, {
                xtype: 'zarafa.radiospinnerfield',
                type: 'months',
				cls : 'zarafa-delayeddeliverypanel-radiospinnerfield',
                value: _('month(s)'),
                listeners: {
                    focus: this.onFieldFocus,
                    change: this.onFieldChange,
                    scope: this
                }
            }, {
                xtype: 'displayfield',
                value: _('at a specific time'),
				cls:'zarafa-delayeddeliverypanel-displayfield'
            }, {
                xtype: 'zarafa.radiodatetimefield',
                ref: 'delayedDeliveryDateTimeField',
				cls :'zarafa-delayeddeliverypanel-radiodatetimefield',
                listeners: {
                    focus: this.onFieldFocus,
                    change: this.onFieldChange,
                    scope: this
                }
            }, {
                xtype: 'displayfield',
				cls : 'zarafa-delayeddeliverypanel-fields',
                ref: 'timeInfofield'
            }],
            listeners: {
                afterrender: this.setDefaultValue
            }
        });
        Zarafa.mail.dialogs.DelayedDeliveryPanel.superclass.constructor.call(this, config);
    },

    /**
     * Event handler which is called when the {@link Zarafa.common.ui.RadioDateTimeField radioDateTimeField} or
     * {@link Zarafa.common.ui.RadioSpinnerField radioSpinnerField} field receives input focus,
     * this will call {@link #createMessage} for updating the delayInfoMessage value
     * @param {Zarafa.common.ui.RadioSpinnerField|Zarafa.common.ui.RadioDateTimeField} field The field which fired the event
     */
    onFieldFocus: function (field)
    {
        this.createMessage(field.getDateTime());
    },

    /**
     * Event handler which is called when the {@link Zarafa.common.ui.RadioDateTimeField radioDateTimeField} or
     * {@link Zarafa.common.ui.RadioSpinnerField radioSpinnerField} value has changed,
     * this will call {@link #createMessage} for updating the delayInfoMessage value
     * @param {Zarafa.common.ui.RadioSpinnerField|Zarafa.common.ui.RadioDateTimeField} field The field which fired the event
     * @param {Date} dateTime The date and time which is specified by user.
     */
    onFieldChange: function (field, dateTime)
    {
        this.createMessage(dateTime);
    },

    /**
     * Function is use to create and display delayInfoMessage.
     * this will call {@link #getMessageDate} and {@link #showMessage} for getting the delayInfoMessage value and display delayInfoMessage
     * @param {Date} value which is selected date and time
     */
    createMessage: function (value)
    {
        var dateTime = new Date(value);
        this.scheduledMailDateTime = dateTime;
        var delayInfoMessage = this.getMessageDate(dateTime);
        this.showMessage(delayInfoMessage);
    },

    /**
     * Function check date and create appropriate delayInfoMessage using the date.
     * @param {Date} dateTime The date and time which is specified by user.
     * @returns {string} delayInfoMessage which is display when record will be send.
     */
    getMessageDate: function (dateTime)
    {
        var delayInfoMessage = '';
        this.ownerCt.setDisabled(true);
        if (isNaN(dateTime.getTime())) {
            return delayInfoMessage;
        }
        else if (this.isPastDate(dateTime)) {

            //If user select past time then return sorry delayInfoMessage and disable send button.
            delayInfoMessage = _('The time you entered is in the past. Please reschedule your mail.');
            this.delayedDeliveryDateTimeField.addClass('zarafa-delayeddelivery-invalid-date');
            return delayInfoMessage;
        } else {

            //Create appropriate delayInfoMessage base on scheduled date and time
            // We now have 4 possible cases:
            // 1) When the date is scheduled for today, the delayInfoMessage will be shown as
            //    "Your email will be sent today at [xx:xx]"
            // 2) When the date is scheduled for tomorrow, the delayInfoMessage will be shown as
            //    "Your email will be sent tomorrow at [xx:xx]"
            // 3) When the date is scheduled within a week, the delayInfoMessage will be shown as
            //    “Your email will be sent [Day] at [xx:xx]"
            // 4) All other dates further than one week, the delayInfoMessage will be shown as
            //    “Your email will be sent at [Month] [dd]th [yyyy], [xx:xx]"
            var date = '';
            var time = dateTime.format('H:i');
            if (this.isTodayDate(dateTime)) {
                date = _('today  at ');
            } else if (this.isTomorrowDate(dateTime)) {
                date = _('tomorrow  at ');
            } else if (this.isDayInCurrentWeek(dateTime)) {
                date = String.format(_('{0} at '), dateTime.format('l '));
            } else {
                date = String.format(_('at {0}'), dateTime.format('F jS Y, '));
            }
            delayInfoMessage = String.format(_('Your email will be sent {0}{1}'), date, time);
            this.ownerCt.setDisabled(false);
            this.delayedDeliveryDateTimeField.removeClass('zarafa-delayeddelivery-invalid-date');
            return delayInfoMessage;
        }
    },

    /**
     * Function check whether specified date and time is in past or not.
     * @param {Date} mailDateTime Specified date and time.
     * @returns {boolean} true if date and time is in past
     */
    isPastDate: function (mailDateTime)
    {
        var currentDateTime = new Date().getTime();
        var mailDate = mailDateTime.getTime();
        return mailDate < (currentDateTime - 3000);
    },

    /**
     * Function check whether specified date is today's date or not.
     * @param {Date} mailDateTime Specified date and time.
     * @returns {boolean} true if date is today's date
     */
    isTodayDate: function (mailDateTime)
    {
        var todayDate = new Date().clearTime(true);
        var mailDate = new Date(mailDateTime).clearTime(true);
        return todayDate.getTime() === mailDate.getTime();
    },

    /**
     * Function check whether specified date is tomorrow's date or not.
     * @param {Date} mailDateTime Specified date and time.
     * @returns {boolean} true if date is tomorrow's date
     */
    isTomorrowDate: function (mailDateTime)
    {
        var date = new Date().clearTime(true);
        var mailDate = new Date(mailDateTime).clearTime(true);
        var tomorrowDateTime = new Date(date.add(Date.DAY, 1));
        return tomorrowDateTime.getTime() === mailDate.getTime();
    },

    /**
     * Function check whether specified date is in current week or not.
     * @param {Date} mailDateTime Specified date and time.
     * @returns {boolean} true if date is in current week else false
     */
    isDayInCurrentWeek: function (mailDateTime)
    {
        var currentDateTime = new Date();
        var first = currentDateTime.getDate() - currentDateTime.getDay();
        var firstDayOfWeek = new Date(currentDateTime.setDate(first));
        var lastDayOfWeek = firstDayOfWeek.add(Date.DAY,6);
        var mailDate = new Date(mailDateTime).clearTime(true);
        return mailDate.between(firstDayOfWeek, lastDayOfWeek);
    },

    /**
     * Function display delayInfoMessage when user select the date.
     * delayInfoMessage content when your mail will be send.
     * @param {String} delayInfoMessage Message string created using specified date.
     */
    showMessage: function (delayInfoMessage)
    {
        this.timeInfofield.setValue(delayInfoMessage);
    },

    /**
     * Function set default value in {@link Zarafa.common.ui.RadioDateTimeField radioDateTimeField}
     * If record has deferred_send_time then set this date and time otherwise set current date and time
     */
    setDefaultValue: function ()
    {
        var deferredSendTime = this.ownerCt.record.get('deferred_send_time');
        if (Ext.isEmpty(deferredSendTime)) {
            this.delayedDeliveryDateTimeField.setValue(new Date());
        } else {
            this.delayedDeliveryDateTimeField.setValue(deferredSendTime);
        }
        var initialDateTime = this.delayedDeliveryDateTimeField.getDateTime();
        this.createMessage(initialDateTime);
    },

    /**
     * Function return date and time which is selected by user.
     * @returns {Date} The date object
     */
    getMailDateTime: function ()
    {
        return this.scheduledMailDateTime;
    }
});

Ext.reg('zarafa.delayeddeliverypanel', Zarafa.mail.dialogs.DelayedDeliveryPanel);
