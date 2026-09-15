/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.DelayedDeliveryContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.delayeddeliverycontentpanel
 *
 * The content panel which use to get Date and Time
 */
Grommunio.mail.dialogs.DelayedDeliveryContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

    /**
     * @cfg {Grommunio.core.data.IPMRecord} record The mail which
     * is being update by this panel.
     */
    record: null,

    /**
     * @cfg {Date} deferredSendTime which is date object of selected date and time for mail
     */
    deferredSendTime: undefined,

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor: function (config)
    {
        config = config || {};

        config = Ext.apply(config, {
            xtype: 'grommunio.delayeddeliverycontentpanel',
            width: 350,
            height: 260,
            title: _('Schedule mail to be sent out') + '...',
            layout: 'fit',
            items: [{
                xtype: 'grommunio.delayeddeliverypanel',
                ref: 'delayedDeliveryPanel',
                buttons: [{
                    text: _('Send'),
                    cls: 'grommunio-action',
                    iconCls: 'icon_send_later_white',
                    ref: '../sendButton',
                    disabled: true,
                    handler: this.onSend,
                    scope: this
                },{
                    text: _('Cancel'),
                    handler: this.onCancel,
                    scope: this
                }]
            }]
        });

        Grommunio.mail.dialogs.DelayedDeliveryContentPanel.superclass.constructor.call(this, config);
    },

    /**
     * Function is use to set disabled value of "send" {@link Ext.Button button}.
     * @param {Boolean} value is true/false
     */
    setDisabled: function (value)
    {
        this.delayedDeliveryPanel.sendButton.setDisabled(value);
    },

    /**
     * Event handler which is called when the user clicks the "Cancel" {@link Ext.Button button}
     * @private
     */
    onCancel: function ()
    {
        this.close();
    },

    /**
     * Event handler which is called when the user clicks the "send" {@link Ext.Button button}
     * Add Event listeners on saverecord and completequeue events.
     * This will {@link Grommunio.core.ui.MessageContentPanel#sendRecord send} the given record.
     */
    onSend: function ()
    {
        this.deferredSendTime = this.delayedDeliveryPanel.getMailDateTime();

        //Add listener on saverecord event for set deferred_send_time in record
        this.mailPanel.un('saverecord', this.onSaveRecord, this);
        this.mailPanel.on('saverecord', this.onSaveRecord, this);

        //Add listener on completequeue event
        this.mailPanel.sendValidationQueue.un('completequeue', this.onCompleteQueue.createDelegate(this, [this.mailPanel, this.record]), this);
        this.mailPanel.sendValidationQueue.on('completequeue', this.onCompleteQueue.createDelegate(this, [this.mailPanel, this.record]), this);
        this.close();

        //send record
        this.mailPanel.sendRecord();
    },

    /**
     * Event handler remove event listener on saverecord if record contain validation error
     * @param {Grommunio.core.ui.MessageContentPanel} dialog which contains the mail record.
     * @param {Grommunio.core.data.IPMRecord} record The record which is going to be send
     */
    onCompleteQueue: function (dialog, record)
    {
        if (Ext.isEmpty(record.get('deferred_send_time'))) {
            dialog.un('saverecord', this.onSaveRecord, this);
            dialog.showInfoMask = true;
        }
        dialog.sendValidationQueue.un('completequeue', this.onCompleteQueue, this);
    },

    /**
     * Event handler set deferred_send_time in Grommunio.core.data.IPMRecord} record and
     * display notification.
     * @param {Grommunio.core.ui.MessageContentPanel} dialog which contains the mail record.
     * @param {Grommunio.core.data.IPMRecord} record The record which is going to be send
     */
    onSaveRecord: function (dialog, record)
    {
        if (dialog.isSending === true && dialog.showInfoMask === true) {
            dialog.record.set('deferred_send_time', this.deferredSendTime);
            dialog.showInfoMask = false;
            container.getNotifier().notify('info.saved', _('Scheduled Items'), this.sendLaterMessage());
            dialog.un('saverecord', this.onSaveRecord, this);
        }
    },

    /**
     * Function is create message that will display in {@link Grommunio.core.ui.notifier.Notifier notification}
     * Message content deferred send time of mail and close button.
     * @returns {String} message that will display in notification
     */
    sendLaterMessage: function ()
    {
        var messageDateTime = this.deferredSendTime.format('d/m/y H:i');
        var upperMessage = _('Your message will be sent at ');
        var lowerMessage = _('Go to your Outbox to edit your email.');

        // return html string which show message and close button
        return String.format("{0}<b>{1}.</b> <br>{2}", upperMessage, messageDateTime, lowerMessage);
    }
});

Ext.reg('grommunio.delayeddeliverycontentpanel', Grommunio.mail.dialogs.DelayedDeliveryContentPanel);
