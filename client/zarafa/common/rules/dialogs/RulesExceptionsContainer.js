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
     * Function that can be used to remove a exceptions from a rule.
     * This will always remove the last exception.
     * @override {@link Zarafa.common.rules.dialogs.BaseContainer#removeComboBoxContainer}.
     * @private
     */
    removeComboBoxContainer : function()
    {
        if (this.boxContainerCount >= 1) {
            this.remove(this.get(this.items.getCount() - 2));
            this.boxContainerCount--;

            if (this.boxContainerCount === 0) {
                // For resetting exception box.
                this.addComboBoxContainer();
                return;
            } else if (this.boxContainerCount === 1) {
                var conditionBoxToRemove = this.get(this.items.getCount() - 2).get(0);
                var conditionFlag = conditionBoxToRemove.getValue();

                // If no exceptions are selected then disable remove exception button.
                if (typeof(conditionFlag) !== "number") {
                    this.removeBtn.setDisabled(true);
                }
            }
            this.doLayout();
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

            for (var i = 0, len = exceptions.length; i < len; i++) {
                // Apply the exception to the corresponding container
                if (exceptions[i] && exceptions[i] !== Zarafa.common.rules.data.ExceptionsConstants.INVALID_EXCEPTION) {
                    this.applyException(this.get(i), exceptions[i]);
                }
            }
        }
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

        for (var i = 0; i < this.boxContainerCount; i++) {
            var exception = null;
            var panel = this.get(i);
            var combo = panel.get(0);
            var activeItem = panel.get(1).layout.activeItem;

            if (Ext.isFunction(activeItem.getCondition)) {
                exception = activeItem.getCondition();
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
     * @private
     */
    applyException : function(panel, exception)
    {
        // Parsing original condition by removing NOT part of the condition.
        // And sending to {@link Zarafa.common.rules.dialogs.RuleConditionsContainer}
        Zarafa.common.rules.dialogs.RulesExceptionContainer.superclass.applyCondition.call(this, panel,exception[1]);
    }

});

Ext.reg('zarafa.rulesexceptionscontainer', Zarafa.common.rules.dialogs.RulesExceptionContainer);
