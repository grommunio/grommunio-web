Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.BaseContainer
 * @extends Ext.Container
 * @xtype zarafa.basecontainer
 *
 * The base container is base class of {@link Zarafa.common.rules.dialogs.RulesConditionContainer RulesConditionContainer}
 * and {@link Zarafa.common.rules.dialogs.RulesExceptionContainer RulesExceptionContainer}.
 * This container manages adding, removing and creating combo box containers.
 * And includes common functionality of {@link Zarafa.common.rules.dialogs.RulesConditionContainer RulesConditionContainer}
 * and {@link Zarafa.common.rules.dialogs.RulesExceptionContainer RulesExceptionContainer}.
 * This class can be expanded to create containers like conditions container and exception container, and is able to parse
 * the rules_condition property of a {@link Zarafa.common.rules.data.RulesRecord rule}.
 */
Zarafa.common.rules.dialogs.BaseContainer = Ext.extend(Ext.Container, {
    /**
     * The current number of combo boxes containers  which are present in the container.
     * This number is changed by {@link #addComboBoxContainer} and {@link #removeComboBoxContainer}.
     * @property
     * @type Number
     * @private
     */
    boxContainerCount : 0,

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor : function(config)
    {
        var addBtnTxt = config.addBtnName;
        var removeBtnTxt = config.removeBtnName;

        config = config || {};
        config.plugins = Ext.value(config.plugins, []);
        config.plugins.push('zarafa.recordcomponentupdaterplugin');

        Ext.applyIf(config, {
            layout : 'form',
            id : 'rule-condition-container',
            autoHeight: true,
            items : [{
                xtype : 'zarafa.compositefield',
                hideLabel : true,
                items : [{
                    xtype : 'button',
                    ref : '../addBtn',
                    text : addBtnTxt,
                    handler : this.addComboBoxContainer,
                    scope : this
                },{
                    xtype : 'button',
                    ref : '../removeBtn',
                    text : removeBtnTxt,
                    handler : this.removeComboBoxContainer,
                    scope : this
                }]
            }]
        });

        Zarafa.common.rules.dialogs.BaseContainer.superclass.constructor.call(this, config);
    },

    /**
     * Generic function to create containers in which a condition or exception is represented. This consists of
     * two components, the first one is the combobox in which the condition type or exception type is selected, and the
     * second in which special option for the given condition/exception can be configured.
     * @param {String} id for the new container.
     * @param {Ext.data.JsonStore} profileStore store of the Conditions or Exceptions for combo box.
     * @return {Object} config object to create a {@link Ext.Container Container}.
     * @private
     */
    createComboBoxContainer : function(id, profileStore)
    {
        return {
            xtype : 'container',
            id : id,
            flex : 1,
            height : 25,
            layout : {
                type : 'hbox',
                align : 'stretch',
                defaultMargins : '0 5 0 0'
            },
            items : [{
                xtype : 'combo',
                width : 300,
                store : profileStore,
                mode : 'local',
                triggerAction : 'all',
                displayField : 'name',
                valueField : 'value',
                lazyInit : false,
                forceSelection : true,
                editable : false,
                value : _('Select one...'),
                listeners : {
                    'select' : this.onComboSelect,
                    'scope' : this
                }
            }, {
                xtype : 'container',
                flex : 1,
                layout : 'card',
                activeItem : 0,
                items : this.createContentPanels(id)
            }]
        };
    },

    /**
     * Create a set of ContentPanels which are used to configure the various condition/exception type.
     * The array which is returned contains should be applied on a {@link Ext.Container} with
     * a {@link Ext.layout.CardLayout CardLayout} to ensure only one container is visible
     * at a time.
     * In each container the user is able to set various configuration options for the
     * condition/exception type as selected in the combobox.
     * @param {String} baseId The baseId which is used to create the id for the individual containers.
     * @return {Array} Array of config objects to create a {@link Ext.Container}.
     * @private
     */
    createContentPanels : function(baseId)
    {
        return [{
            xtype : 'container',
            id : baseId + '-empty'
        },{
            xtype : 'zarafa.userselectionlink',
            id : baseId + '-from'
        },{
            xtype : 'zarafa.wordselectionlink',
            id : baseId + '-senderwords'
        },{
            xtype : 'zarafa.wordselectionlink',
            id : baseId + '-recipientwords'
        },{
            xtype : 'zarafa.wordselectionlink',
            id : baseId + '-words'
        },{
            xtype : 'zarafa.wordselectionlink',
            id : baseId + '-bodywords'
        },{
            xtype : 'zarafa.wordselectionlink',
            id : baseId + '-headerwords'
        },{
            xtype : 'zarafa.importancelink',
            id : baseId + '-importance'
        },{
            xtype : 'zarafa.userselectionlink',
            id : baseId + '-to'
        },{
            xtype : 'zarafa.senttomelink',
            id : baseId + '-to-me-only'
        },{
            xtype : 'zarafa.senttolink',
            id : baseId + '-to-me'
        },{
            xtype : 'zarafa.attachmentlink',
            id : baseId + '-attachment'
        },{
            xtype : 'zarafa.atleatsizelink',
            id : baseId + '-atleastsize'
        },{
            xtype : 'zarafa.atmostsizelink',
            id : baseId + '-atmostsize'
        },{
            xtype : 'zarafa.sentccmelink',
            id : baseId + '-cc-me'
        },{
            xtype : 'zarafa.namebcclink',
            id : baseId + '-name-to-bcc'
        },{
            xtype : 'zarafa.nametocclink',
            id : baseId + '-name-to-cc'
        },{
            xtype : 'zarafa.sensitivitylink',
            id : baseId + '-sensitivity'
        },{
            xtype : 'zarafa.receivedafterlink',
            id : baseId + '-received-after'
        },{
            xtype : 'zarafa.receivedbeforelink',
            id : baseId + '-received-before'
        },{
            xtype : 'zarafa.nonelink',
            id : baseId + '-no-condition'
        }];
    },

    /**
     * Function that can be used to add more combobox containers in a rule container.
     * @return {Ext.Container} The combobox container which was inserted
     * @private
     */
    addComboBoxContainer : function()
    {
        this.boxContainerCount++;

        var container = this.createComboBoxContainer(this.boxContainerCount);
        container = this.insert(this.items.getCount() - 1, container);

        // Toggle the removeConditionBtn
        this.removeBtn.setDisabled(this.boxContainerCount <= 1);

        this.doLayout();

        return container;
    },

    /**
     * Function that can be used to remove a combobox containers from a rule container.
     * This will always remove the last combobox container.
     * @private
     */
    removeComboBoxContainer : function()
    {
        if (this.boxContainerCount > 1) {
            // Don't remove the last item, as that is the container
            // to add and remove conditions.
            this.remove(this.get(this.items.getCount() - 2));
            this.boxContainerCount--;

            // Toggle the removeConditionBtn
            this.removeBtn.setDisabled(this.boxContainerCount <= 1);

            this.doLayout();
        }
    },

    /**
     * {@link #addComboBoxContainer add} or {@link #removeComboBoxContainer remove}
     * combobox containers for a rule, until the {@link #boxContainerCount} reaches
     * the given count.
     * @param {Number} count The desired number of combobox containers
     * @private
     */
    setBoxContainerCount : function(count)
    {
        while (count < this.boxContainerCount) {
            this.removeComboBoxContainer();
        }
        while (count > this.boxContainerCount) {
            this.addComboBoxContainer();
        }
    },

    /**
     * This function will update 'rule_condition' property of {@link Zarafa.core.data.IPMRecord record}.
     * This function will handle adding, removing exceptions/conditions in conditions from conditions.
     * This is common function to update Exception/Condition in Record.
     * @param {Zarafa.core.data.IPMRecord} record which needs to be updated.
     * @param {Array} conditionsToSet array of conditions which needs to be set in record.
     * @param {Boolean} isException True if given conditionsToSet should be treated as Exceptions else false.
     * @private
     */
    updateConditionsInRecord : function(record, conditionsToSet, isException)
    {
        // If Exceptions are needed to be set in record.
        if (isException) {
            // Get conditions and add exceptions after it.
            var conditions = record.getConditions(this);

            conditionsToSet.forEach(function(exception) {
                conditions.push(exception);
            });

            if (conditions.length > 1) {
                conditions = Zarafa.core.data.RestrictionFactory.createResAnd(conditions);
            } else {
                conditions = conditions[0];
            }

            record.set('rule_condition', conditions);

        } else {
            // If Conditions are needed to be set in record.
            var exceptions = record.getExceptions(this);

            // Adding Exceptions after conditions, if exceptions are already exist in record.
            if (!Ext.isEmpty(exceptions)) {
                exceptions.forEach(function(exception) {
                    conditionsToSet.push(exception);
                });
            }

            // Check if we need to create a AND restriction
            if (conditionsToSet.length > 1) {
                conditionsToSet = Zarafa.core.data.RestrictionFactory.createResAnd(conditionsToSet);
            } else {
                conditionsToSet = conditionsToSet[0];
            }

            record.set('rule_condition', conditionsToSet);
        }
    },

    /**
     * Convert the conditions object as stored in a {@link Zarafa.common.rules.data.RulesRecord rule}
     * and convert it to an array of individual conditions. Each element in the returned array represents
     * a single condition.
     * @param {Object} conditions The condition which must be converted into an array
     * @return {Array} The array of conditions
     * @private
     */
    getConditionsArray : function(conditions)
    {
        // Check the conditions, if the RES property indicates a AND
        // restriction we have to check the contents, as we need to determine
        // if this represents a single condition or a list of conditions.
        if (conditions[0] === Zarafa.core.mapi.Restrictions.RES_AND) {
            var single = false;
            var totalConditions = conditions[1].length;

            // As of now, there are three property restrictions at most in single condition.
            if (totalConditions >= 3) {
                var conditionCounter = 0;
                // Check if this AND/OR restriction represents a single
                // condition or not.
                for (var i = 0; i < totalConditions; i++) {
                    var innerCondition = conditions[1][i];
                    if (innerCondition) {
                        if (innerCondition[0] === Zarafa.core.mapi.Restrictions.RES_PROPERTY) {
                            var ulPropTagValue = innerCondition[1][Zarafa.core.mapi.Restrictions.ULPROPTAG];
                            var isPrMessageToMe = (ulPropTagValue === 'PR_MESSAGE_TO_ME');
                            var isPrMessageCcMe = (ulPropTagValue === 'PR_MESSAGE_CC_ME');
                            var isPrMessageRecipMe = (ulPropTagValue === 'PR_MESSAGE_RECIP_ME');
                            var isPrDisplayCc = (ulPropTagValue === 'PR_DISPLAY_CC');

                            if (isPrMessageToMe || isPrMessageCcMe || isPrMessageRecipMe || isPrDisplayCc) {
                                conditionCounter++;
                            }
                        } else if (innerCondition[0] === Zarafa.core.mapi.Restrictions.RES_NOT) {
                            innerCondition = innerCondition[1];
                            if (innerCondition[1][Zarafa.core.mapi.Restrictions.ULPROPTAG] === 'PR_DISPLAY_TO') {
                                conditionCounter++;
                            }
                        }

                        if (conditionCounter === 3) {
                            single = true;
                            break;
                        }
                    }
                }
            }

            // Now return the conditions
            if (single) {
                conditions = [ conditions ];
            } else {
                conditions = conditions[1];
            }
        } else {
            // Single condition, just convert it to an array
            conditions = [ conditions ];
        }

        return conditions;
    },

    /**
     * Load a Condition from a {@Link Zarafa.common.rules.data.RulesRecord} and apply it
     * onto the {@link Ext.Container} which was created by {@link #addComboBoxContainer}.
     * @param {Ext.Container} panel The container on which the condition will be loaded
     * @param {Object} condition The condition which should be loaded
     * @private
     */
    applyCondition : function(panel, condition, sizeUnit)
    {
        var conditionFlag = this.getConditionFlagFromCondition(condition);
        var combo = panel.get(0);
        var content = panel.get(1);
        var store = combo.store;

        // Apply the correct value to the combobox.
        var index = store.findExact(combo.valueField, conditionFlag);
        if (index >= 0) {
            var record = store.getAt(index);
            combo.setValue(conditionFlag);
            this.onComboSelect(combo, record, index);
        } else {
            conditionFlag = Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
            combo.setValue(_('Unknown condition'));
            combo.markInvalid(_('This condition for the current rule is unknown'));
        }

        // Fill the content with the data from the condition
        var layout = content.getLayout();
        switch (conditionFlag) {
            case Zarafa.common.rules.data.ConditionFlags.UNKNOWN:
            /* falls through*/
            default:
                break;
            case Zarafa.common.rules.data.ConditionFlags.ATLEAST_SIZE:
            case Zarafa.common.rules.data.ConditionFlags.ATMOST_SIZE:
                layout.activeItem.setCondition(conditionFlag, condition, sizeUnit);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS:
            case Zarafa.common.rules.data.ConditionFlags.BODY_WORDS:
            case Zarafa.common.rules.data.ConditionFlags.TRANSPORTHEADER_WORDS:
            case Zarafa.common.rules.data.ConditionFlags.IMPORTANCE:
            case Zarafa.common.rules.data.ConditionFlags.RECEIVED_AFTER:
            case Zarafa.common.rules.data.ConditionFlags.RECEIVED_BEFORE:
            case Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM:
            case Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS:
            case Zarafa.common.rules.data.ConditionFlags.RECIPIENT_WORDS:
            case Zarafa.common.rules.data.ConditionFlags.SENSITIVITY:
            case Zarafa.common.rules.data.ConditionFlags.SENT_TO:
            case Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME:
            case Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY:
            case Zarafa.common.rules.data.ConditionFlags.NAME_BCC:
            case Zarafa.common.rules.data.ConditionFlags.SENT_CC_ME:
            case Zarafa.common.rules.data.ConditionFlags.NONE:
                layout.activeItem.setCondition(conditionFlag, condition);
                break;
        }
    },

    /**
     * Read a Condition object as located in the {@link Zarafa.common.rules.data.RulesRecord Rule}
     * and convert it to the corresponding ConditionFlag which properly represents the condition.
     * @param {Object} condition The condition which should be converted to a Condition Flag
     * @return {Zarafa.common.rules.data.ConditionFlags} The Condition Flag
     * @private
     */
    getConditionFlagFromCondition : function(condition)
    {
        var Restrictions = Zarafa.core.mapi.Restrictions;

        switch (condition[0]) {
            case Restrictions.RES_COMMENT:
                switch (condition[1][Restrictions.RESTRICTION][1][Restrictions.ULPROPTAG]) {
                    case 'PR_SENDER_SEARCH_KEY':
                        return Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM;
                    default:
                        return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
                }
            case Restrictions.RES_CONTENT:
            case Restrictions.RES_PROPERTY:
            case Restrictions.RES_SUBRESTRICTION:
            case Restrictions.RES_BITMASK:
                switch (condition[1][Restrictions.ULPROPTAG]) {
                    case 'PR_BODY':
                        return Zarafa.common.rules.data.ConditionFlags.BODY_WORDS;
                    case 'PR_TRANSPORT_MESSAGE_HEADERS':
                        return Zarafa.common.rules.data.ConditionFlags.TRANSPORTHEADER_WORDS;
                    case 'PR_SUBJECT':
                        return Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS;
                    case 'PR_IMPORTANCE':
                        return Zarafa.common.rules.data.ConditionFlags.IMPORTANCE;
                    case 'PR_MESSAGE_RECIPIENTS':
                        // If there exists sub restriction.
                        if (condition[0] === Restrictions.RES_SUBRESTRICTION) {
                            var isRecepientWordsRes = condition[1][Restrictions.RESTRICTION][1][Restrictions.ULPROPTAG] === 'PR_SMTP_ADDRESS';
                            if (isRecepientWordsRes) {
                                return Zarafa.common.rules.data.ConditionFlags.RECIPIENT_WORDS;
                            }
                            return Zarafa.common.rules.data.ConditionFlags.SENT_TO;
                        }
                        break;
                    case 'PR_MESSAGE_TO_ME':
                        return Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME;
                    case 'PR_SENDER_SEARCH_KEY':
                        return Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS;
                    case 'PR_MESSAGE_FLAGS':
                        return Zarafa.common.rules.data.ConditionFlags.ATTACHMENT;
                    case 'PR_MESSAGE_RECIP_ME':
                        return Zarafa.common.rules.data.ConditionFlags.NAME_TO_CC;
                    case 'PR_MESSAGE_SIZE':
                        if (condition[1][1] === Restrictions.RELOP_LE) {
                            return Zarafa.common.rules.data.ConditionFlags.ATMOST_SIZE;
                        } else if (condition[1][1] === Restrictions.RELOP_GE) {
                            return Zarafa.common.rules.data.ConditionFlags.ATLEAST_SIZE;
                        }
                        break;
                    case 'PR_SENSITIVITY':
                        return Zarafa.common.rules.data.ConditionFlags.SENSITIVITY;
                    case 'PR_MESSAGE_DELIVERY_TIME':
                        if (condition[1][1] === Restrictions.RELOP_LT) {
                            return Zarafa.common.rules.data.ConditionFlags.RECEIVED_BEFORE;
                        } else if (condition[1][1] === Restrictions.RELOP_GT) {
                            return Zarafa.common.rules.data.ConditionFlags.RECEIVED_AFTER;
                        }
                    /* falls through*/
                    default:
                        return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
                }
            /* falls through*/
            case Restrictions.RES_AND:
                var bccLinkFlag = 0;
                var currCoreVersion = container.getVersion().getZCP();
                var versionCompare = container.versionRecord.versionCompare(currCoreVersion,"8.7.2");

                for (var i = 0, len = condition[1].length; i < len; i++) {
                    var sub = condition[1][i];

                    // Check if the RES_AND contains the restriction for PR_MESSAGE_RECIP_ME,
                    // And its value is false. So, increase bccLinkFLag value by one.
                    if (sub[0] === Restrictions.RES_PROPERTY &&
                        sub[1][Restrictions.ULPROPTAG] === 'PR_MESSAGE_RECIP_ME') {
                        var isOlderVersion = versionCompare === -1 ? true : false;

                        if (isOlderVersion && sub[1][Restrictions.VALUE]['PR_MESSAGE_RECIP_ME'] === false) {
                            bccLinkFlag++;
                            continue;
                        } else if (!isOlderVersion && sub[1][Restrictions.VALUE]['PR_MESSAGE_RECIP_ME'] === true) {
                            bccLinkFlag++;
                            continue;
                        }
                    }

                    // Check if the RES_AND contains the restriction for PR_MESSAGE_CC_ME,
                    // And its value is false. So, increase bccLinkFlag value by one.
                    if (sub[0] === Restrictions.RES_PROPERTY &&
                        sub[1][Restrictions.ULPROPTAG] === 'PR_MESSAGE_CC_ME' &&
                        sub[1][Restrictions.VALUE]['PR_MESSAGE_CC_ME'] === false) {
                        bccLinkFlag++;
                        continue;
                    }

                    // Check if the RES_AND contains the restriction for PR_MESSAGE_TO_ME,
                    // And its value is false. So, increase bccLinkFlag value by one.
                    if (sub[0] === Restrictions.RES_PROPERTY &&
                        sub[1][Restrictions.ULPROPTAG] === 'PR_MESSAGE_TO_ME' &&
                        sub[1][Restrictions.VALUE]['PR_MESSAGE_TO_ME'] === false) {
                        bccLinkFlag++;
                        continue;
                    }

                    // PR_MESSAGE_CC_ME is only used in the SENT_CC_ME restriction for now
                    if (sub[0] === Restrictions.RES_PROPERTY &&
                        sub[1][Restrictions.ULPROPTAG] === 'PR_MESSAGE_CC_ME'&&
                        sub[1][Restrictions.VALUE]['PR_MESSAGE_CC_ME'] === true) {
                        return Zarafa.common.rules.data.ConditionFlags.SENT_CC_ME;
                    }
                    // Check if the RES_AND contains the restriction for PR_MESSAGE_TO_ME,
                    // this indicates that this restriction is the SENT_TO_ME_ONLY condition
                    if (sub[0] === Restrictions.RES_PROPERTY &&
                        sub[1][Restrictions.ULPROPTAG] === 'PR_MESSAGE_TO_ME' &&
                        sub[1][Restrictions.VALUE]['PR_MESSAGE_TO_ME'] === true) {
                        return Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY;
                    }
                }

                // if all three conditions is matched with bcc rule's restriction then only return BCC flag.
                if (bccLinkFlag === 3) {
                    return Zarafa.common.rules.data.ConditionFlags.NAME_BCC;
                }
                return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
            case Restrictions.RES_OR:
                for (var i = 0, len = condition[1].length; i < len; i++) {
                    var sub = condition[1][i];
                    var type = this.getConditionFlagFromCondition(sub);
                    if (type !== Zarafa.common.rules.data.ConditionFlags.UNKNOWN) {
                        return type;
                    }
                }
                return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
            case Restrictions.RES_EXIST:
                return Zarafa.common.rules.data.ConditionFlags.NONE;
            default:
                return Zarafa.common.rules.data.ConditionFlags.UNKNOWN;
        }
    },

    /**
     * The event handler for the {@link Ext.form.ComboBox#select} event for the combobox for
     * a particular action. This will the corresponding content panel to show the correct
     * content type.
     * @param {Ext.form.ComboBox} combo The combobox which fired the event
     * @param {Ext.data.Record} record The record which was selected from the combobox
     * @param {Number} index The selected index from the combobox list
     * @private
     */
    onComboSelect : function(combo, record, index)
    {
        var panel = combo.ownerCt;
        var content = panel.get(1);

        var layout = content.getLayout();
        var value = record.get(combo.valueField);

        switch (value) {
            case Zarafa.common.rules.data.ConditionFlags.UNKNOWN:
            /* falls through*/
            default:
                layout.setActiveItem(panel.id + '-empty');
                break;
            case Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM:
                layout.setActiveItem(panel.id + '-from');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS:
                layout.setActiveItem(panel.id + '-senderwords');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.RECIPIENT_WORDS:
                layout.setActiveItem(panel.id + '-recipientwords');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS:
                layout.setActiveItem(panel.id + '-words');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.BODY_WORDS:
                layout.setActiveItem(panel.id + '-bodywords');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.TRANSPORTHEADER_WORDS:
                layout.setActiveItem(panel.id + '-headerwords');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.IMPORTANCE:
                layout.setActiveItem(panel.id + '-importance');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SENT_TO:
                layout.setActiveItem(panel.id + '-to');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY:
                layout.setActiveItem(panel.id + '-to-me-only');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME:
                layout.setActiveItem(panel.id + '-to-me');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.ATTACHMENT:
                layout.setActiveItem(panel.id + '-attachment');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SENSITIVITY:
                layout.setActiveItem(panel.id + '-sensitivity');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.SENT_CC_ME:
                layout.setActiveItem(panel.id + '-cc-me');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.NAME_TO_CC:
                layout.setActiveItem(panel.id + '-name-to-cc');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.NAME_BCC:
                layout.setActiveItem(panel.id + '-name-to-bcc');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.RECEIVED_AFTER:
                layout.setActiveItem(panel.id + '-received-after');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.RECEIVED_BEFORE:
                layout.setActiveItem(panel.id + '-received-before');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.ATLEAST_SIZE:
                layout.setActiveItem(panel.id + '-atleastsize');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.ATMOST_SIZE:
                layout.setActiveItem(panel.id + '-atmostsize');
                layout.activeItem.setCondition(value);
                break;
            case Zarafa.common.rules.data.ConditionFlags.NONE:
                layout.setActiveItem(panel.id + '-no-condition');
                layout.activeItem.setCondition(value);
                break;
        }
    }
});

Ext.reg('zarafa.basecontainer', Zarafa.common.rules.dialogs.BaseContainer);
