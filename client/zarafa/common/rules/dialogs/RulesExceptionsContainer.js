Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesExceptionContainer
 * @extends Zarafa.common.rules.dialogs.BaseContainer
 * @xtype zarafa.rulesexceptionscontainer
 *
 * The container in which all exceptions can be edited. This container
 * can be expanded to include multiple exceptions, and is able to parse
 * the rules_conditions property of a {@link Zarafa.common.rules.data.RulesRecord rule}.
 */
Zarafa.common.rules.dialogs.RulesExceptionContainer = Ext.extend(Zarafa.common.rules.dialogs.BaseContainer, {
    /**
     * Array which holds selected Exceptions by user.
     * This Array is changed by {@link #update}.
     * @property
     * @type Array
     * @private
     */
    exceptions : [],

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor : function(config)
    {
        config = Ext.apply(config || {},{
            id : 'rule-exception-container',
            addBtnName : _('Add exception'),
            removeBtnName : _('Remove exception'),
        });

        Zarafa.common.rules.dialogs.RulesExceptionContainer.superclass.constructor.call(this, config);
    },

    /**
     * Generic function to create containers in which a exception is represented. This consists of
     * two components, the first one is the combobox in which the exception type is selected, and the
     * second in which special option for the given exception can be configured.
     * @override {@link Zarafa.common.rules.dialogs.BaseContainer#createComboBoxContainer}.
     * @param {Number} The index of the exception which is created
     * @return {Object} config object to create a {@link Ext.Container}.
     * @private
     */
    createComboBoxContainer : function(index)
    {
        var id =  'rule-exception-' + String(index);
        var profileStore = {
            xtype : 'jsonstore',
            fields : [
                { name : 'name' },
                { name : 'value', type : 'int' }
            ],
            data : Zarafa.common.rules.data.ExceptionProfiles
        };

        return Zarafa.common.rules.dialogs.RulesExceptionContainer.superclass.createComboBoxContainer.call(this, id, profileStore);
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
        // 'Remove exception' button would be disabled when there's no exceptions selected.
        // Enable 'Remove exception' button on select of any exception.
        // So, user can remove exception when there is only one exception.
        if (this.removeBtn.disabled) {
            this.removeBtn.setDisabled(false);
        }

        Zarafa.common.rules.dialogs.RulesExceptionContainer.superclass.onComboSelect.call(this, combo, record, index);
    },

    /**
     * Updates the panel by loading data from the record into the form panel.
     * @param {Zarafa.common.rules.data.RulesRecord} record The record update the panel with.
     * @param {Boolean} contentReset force the component to perform a full update of the data.
     */
    update : function(record, contentReset)
    {
        this.record = record;
        var exceptions = record.getExceptions(this);
        var isExceptionChanged = false;

        if (!this.exceptions && exceptions) {
            isExceptionChanged = true;
        } else if (this.exceptions && exceptions) {
            isExceptionChanged = !exceptions.equals(this.exceptions);
        }

        // If exceptions value has been changed only then update view.
        if (contentReset || isExceptionChanged) {
            this.exceptions = exceptions;

            // When the rule doesn't have any exception specified,
            // we will create an empty exception.
            if (Ext.isEmpty(exceptions)) {
                this.setBoxContainerCount(1);
                return;
            }

            // We have to ensure that there are sufficient exception fields
            // present in the container.
            var count = Math.max(1, exceptions.length);
            this.setBoxContainerCount(count);

            var atleastSizeUnit = record.get('rule_exception_atleast_size_unit');
            var atmostSizeUnit = record.get('rule_exception_atmost_size_unit');
            var atleastSizes = atleastSizeUnit.split(';');
            var atmostSizes = atmostSizeUnit.split(';');

            for (var i = 0, len = exceptions.length; i < len; i++) {
                var exceptionFlag = this.getExceptionFlagFromCondition(exceptions[i]);
                var isAtleastSizeException = exceptionFlag === Zarafa.common.rules.data.ConditionFlags.ATLEAST_SIZE;
                var isAtmostSizeException = exceptionFlag === Zarafa.common.rules.data.ConditionFlags.ATMOST_SIZE;
                if (isAtleastSizeException) {
                    //sending sizeUnits values according to condition in order.
                    this.applyException(this.get(i), exceptions[i], atleastSizes.shift());
                } else if (isAtmostSizeException) {
                    //sending sizeUnits values according to condition in order.
                    this.applyException(this.get(i), exceptions[i], atmostSizes.shift());
                } else {
                    if (exceptions[i] && exceptions[i] !== Zarafa.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION) {
                        this.applyException(this.get(i), exceptions[i]);
                    }
                }
            }
        }
    },

    /**
     * Function that can be used to remove a exception from a rule dialog.
     * This will always remove the last exception.
     * @private
     */
    removeComboBoxContainer : function()
    {
        if (this.boxContainerCount >= 1) {
            // if removed condition was atleast / atmost size condition then reset the size unit property in the record accordingly.
            var conditionBoxToRemove = this.get(this.items.getCount() - 2).get(0);
            var exceptionFlag = conditionBoxToRemove.getValue();
            if (exceptionFlag === Zarafa.common.rules.data.ConditionFlags.ATMOST_SIZE) {
                this.record.set('rule_exception_atmost_size_unit', '');
            } else if (exceptionFlag === Zarafa.common.rules.data.ConditionFlags.ATLEAST_SIZE) {
                this.record.set('rule_exception_atleast_size_unit', '');
            }

            this.remove(this.get(this.items.getCount() - 2));
            this.boxContainerCount--;
            // Exception is optional. So user can remove all Exceptions but
            // We need to add empty combo box if all the exceptions are removed.
            if (this.boxContainerCount < 1) {
                this.addComboBoxContainer();
            }
            this.doLayout();
        }
    },

    /**
     * Read a exception object as located in the {@link Zarafa.common.rules.data.RulesRecord Rule}
     * and convert it to the corresponding ExceptionFlag which properly represents the exception.
     * @param {Object} exception The exception which should be converted to a Exception Flag
     * @return {Zarafa.common.rules.data.ConditionFlags} The Exception Flag
     * @private
     */
    getExceptionFlagFromCondition : function(exception)
    {
        if (exception === Zarafa.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION) {
            return Zarafa.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION;
        }

       // We are using ConditionFlags as ExceptionFlags.
       var condition = exception[1];
       return this.getConditionFlagFromCondition(condition);
    },

    /**
     * Update the given {@link Zarafa.core.data.IPMRecord record} with
     * the values from this {@link Ext.Panel panel}.
     * @param {Zarafa.core.data.IPMRecord} record The record to update
     */
    updateRecord : function(record)
    {
        var exceptions = [];
        var exceptionsValid = true;
        var RestrictionFactory = Zarafa.core.data.RestrictionFactory;

        // initAtleastException and initAtmostException are flags for initial atleast and atmost conditions respectively.
        var initAtleastException = true;
        var initAtmostException = true;

        for (var i = 0; i < this.boxContainerCount; i++) {
            var exception = null;
            var panel = this.get(i);
            var combo = panel.get(0);
            var activeItem = panel.get(1).layout.activeItem;

            if (Ext.isFunction(activeItem.getCondition)) {
                exception = activeItem.getCondition();
            }

            // For exceptions Atleast and Atmost, for first time in loop 'rule_exception_atleast_size_unit' and
            // 'rule_exception_atmost_size_unit' props in record will be overwritten.
            if (activeItem.id.indexOf('atleastsize') >= 0) {
                activeItem.setSizeUnit(record, initAtleastException, true);
                if (initAtleastException) {
                    initAtleastException = false;
                }
            } else if (activeItem.id.indexOf('atmostsize') >= 0) {
                activeItem.setSizeUnit(record, initAtmostException, true);
                if (initAtmostException) {
                    initAtmostException = false;
                }
            }

            // If no exceptions exist then mark combobox invalid
            // and set value to {@Zarafa.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION}.
            // Also if only one combobox available and exception value is null,
            // then we are not setting it invalid because exceptions are not mandatory.
            if (exception === false || (this.boxContainerCount > 1 && exception === null)) {
                combo.markInvalid();
                exceptionsValid = false;
                exception = Zarafa.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION;
            } else if (this.boxContainerCount === 1 && exception === null) {
                break;
            }

            // If a proper condition exist only then convert it into exception.
            if (exception && exception !== Zarafa.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION) {
                exception = RestrictionFactory.createResNot(exception);
            }

            // preparing final conditions by adding Exceptions after it.
            exceptions.push(exception);
        }

        // Only if any exception is invalid, setConditionsValid to false.
        // This will prevent unnecessary update
        // of 'rule_condition' property of {@link Zarafa.core.data.IPMRecord record}
        // Because this property is shared between Conditions and Exceptions.
        if(!exceptionsValid) {
            record.setConditionsValid(exceptionsValid);
        }

        // Set latest Exceptions in the the record.
        this.updateConditionsInRecord(record, exceptions, true);
    },

    /**
     * Load a Exception from a {@Link Zarafa.common.rules.data.RulesRecord} and apply it
     * onto the {@link Ext.Container} which was created by {@link #addComboBoxContainer}.
     * @param {Ext.Container} panel The container on which the exception will be loaded
     * @param {Object} exception The exception which should be loaded
     * @param {Zarafa.common.data.SizeUnits} sizeUnit selected size unit for the atleast and atmost size exception components.
     * @private
     */
    applyException : function(panel, exception, sizeUnit)
    {
        // Parsing original condition by removing NOT part of the condition.
        // And sending to {@link Zarafa.common.rules.dialogs.RuleConditionsContainer}
        Zarafa.common.rules.dialogs.RulesExceptionContainer.superclass.applyCondition.call(this, panel, exception[1], sizeUnit);
    }

});

Ext.reg('zarafa.rulesexceptionscontainer', Zarafa.common.rules.dialogs.RulesExceptionContainer);
