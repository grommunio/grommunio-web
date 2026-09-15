/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.data');

/**
 * @class Grommunio.mail.data.ConversationManagers
 * @extends Ext.util.Observable
 *
 */
Grommunio.mail.data.ConversationManagers = Ext.extend(Ext.util.Observable, {

    /**
     * The managers which contains the different type of managers like {@link Ext.util.MixedCollection openedRecord}
     * who manages the all opened conversations.
     *
     * @property
     * @type Object
     */
    managers: {},

    /**
     * @constructor
     * @param config
     */
    constructor: function(config)
    {
        this.managers = Ext.apply({}, {
            openedRecordManager: new Ext.util.MixedCollection()
        });

        Grommunio.mail.data.ConversationManagers.superclass.constructor.call(this, config);
    },

    /**
     * @return {Ext.util.MixedCollection} The opened conversation manager which manages the
     * all opened conversation.
     */
    getOpenedRecordManager: function ()
    {
        return this.managers.openedRecordManager;
    },

    /**
     * Setter function which set the opened Record conversation manager.
     *
     * @param {Ext.util.MixedCollection} openedRecordManager The {@link Ext.util.MixedCollection openedRecord} which manages the
     * all opened conversation
     */
    setOpenedRecord: function (openedRecordManager)
    {
        this.managers.openedRecordManager = openedRecordManager;
    },

    /**
     * Function will collapse all the conversation except the given header record in parameter
     * and if no header record is provided then it will collapse all the conversation.
     *
     * @param {Grommunio.core.IPMRecord} headerRecord The header record of conversation.
     */
    closeAll: function (headerRecord)
    {
        // Close all conversation.
        var openedRecordManager = new Ext.util.MixedCollection();

        // Close all conversation except selected conversation.
        if (headerRecord !== false) {
            openedRecordManager = this.getOpenedRecordManager().filterBy(function(item, key){
                return key === headerRecord.get("entryid");
            }, this);
        }
        this.setOpenedRecord(openedRecordManager);
    }
});
