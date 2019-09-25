/**
 * @class Zarafa.common.rules.dialogs.AtLeatSizeLink
 * @extends Zarafa.common.rules.dialogs.BaseLink
 * @xtype zarafa.atleatsizelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#ATLEAST_SIZE}
 * condition. This will allow the user to input a message size and select a size unit. This will generate a proper
 * condition for it and set 'rule_msg_atleast_size_unit' record property.
 */
Zarafa.common.rules.dialogs.AtLeatSizeLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
    /**
     * Size value for the message size for this condition which is '5' by default.
     * This is changed during {@link #getCondition} if user has changed input value.
     * @property
     * @type Number
     */
    sizeValue: 5,

    /**
     * Size unit value for the message size for this condition which is 'MB' by default.
     * This is changed during {@link #getCondition} if user has selected another value from combobox.
     * @property
     * @type String
     */
    comboValue: Zarafa.common.data.SizeUnits.MB,

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor : function(config)
    {
        config = config || {};

        Ext.applyIf(config, {
            xtype: 'container',
            style : {
                height: '100%',
                display: 'flex',
            },
            width: 600,
            items : [{
                xtype: 'zarafa.spinnerfield',
                plugins: [ 'zarafa.numberspinner' ],
                width: 60,
                minValue: 0,
                defaultValue: 5,
                ref : 'msgSize',
                listeners : {
                    change : this.setModified,
                    scope : this
                }
            },{
                xtype : 'combo',
                ref : 'sizeCombo',
                typeAhead: true,
                editable: false,
                triggerAction: 'all',
                lazyRender: true,
                mode: 'local',
                width: 80,
                style: {
                    margin: '0 0 0 5px'
                },
                store : {
                    xtype : 'jsonstore',
                    fields : [ 'id', 'size' ],
                    data : this.createComboData()
                },
                valueField: 'size',
                displayField: 'size',
                listeners : {
                    select : this.setModified,
                    scope : this
                }
            }]
        });

        Zarafa.common.rules.dialogs.AtLeatSizeLink.superclass.constructor.call(this, config);
    },

    /**
     * Function returns Data for store of size unit combo box.
     **/
    createComboData : function ()
    {
        return [{
            id : 0,
            size : Zarafa.common.data.SizeUnits.MB
        },{
            id : 1,
            size : Zarafa.common.data.SizeUnits.KB
        },{
            id : 2,
            size : Zarafa.common.data.SizeUnits.BYTES
        }];
    },

    /**
     * Handler for inout box and combo box value change. It will set component's isModified to true.
     */
    setModified : function()
    {
        this.isModified = true;
    },

    /**
     * Apply an action onto the DataView, this will parse the condition and show
     * the contents in a user-friendly way to the user.
     * @param {Zarafa.common.rules.data.ConditionFlags} conditionFlag The condition type
     * which identifies the exact type of the condition.
     * @param {Object} condition The condition to apply
     * @param {String} sizeUnit which user selected for this condition
     */
    setCondition : function(conditionFlag, condition, sizeUnit)
    {
        if (condition && sizeUnit) {
           var conditionSizeValue = condition[1][Zarafa.core.mapi.Restrictions.VALUE]['PR_MESSAGE_SIZE'];
           this.sizeValue = Zarafa.core.Util.convertBytesToKBorMB(conditionSizeValue, sizeUnit);
           this.comboValue = sizeUnit;
        }

        this.msgSize.setValue(this.sizeValue);
        this.sizeCombo.setValue(this.comboValue);

        Zarafa.common.rules.dialogs.AtLeatSizeLink.superclass.setCondition.call(this, arguments);
    },

    /**
     * Obtain the condition as configured by the user
     * @return {Object} The condition
     */
    getCondition : function()
    {
        if (this.isModified !== true) {
            return this.condition;
        }

        var useInpSize = this.msgSize.getValue();
        //If user has not selected any value then set default value.
        useInpSize = useInpSize ? useInpSize : this.sizeValue;

        this.sizeValue = Number(useInpSize);
        this.comboValue = this.sizeCombo.getValue();

        var isValidInput = this.isSafeToConvertIntoBytes(this.sizeValue, this.comboValue);

        // To avoid Integer range problem while converting to bytes,
        // check if user input is valid according to selected size unit.
        // If not than return rule as false.
        if (!isValidInput) {
            this.msgSize.markInvalid();
            return false;
        }

        var convertedSizeValue = Zarafa.core.Util.convertToBytes(this.sizeValue, this.comboValue);
        var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
        var Restrictions = Zarafa.core.mapi.Restrictions;

        if (this.atMostSizeLink) {
            return RestrictionFactory.dataResProperty('PR_MESSAGE_SIZE', Restrictions.RELOP_LE, convertedSizeValue);
        }
        return RestrictionFactory.dataResProperty('PR_MESSAGE_SIZE', Restrictions.RELOP_GE, convertedSizeValue);
    },

    /**
     * This function set 'rule_msg_atleast_size_unit' / 'rule_msg_atmost_size_unit' record property
     * with currently selected size unit comboValue.
     * @param {Zarafa.common.rules.data.RulesRecord} record which needs to be updated.
     * @param {Boolean} overwrite should be true to reset 'rule_msg_atleast_size_unit' / 'rule_msg_atmost_size_unit' property in record.
     * */
    setSizeUnit : function(record, overwrite)
    {
        var sizeunit;
        if (this.atMostSizeLink) {
            sizeunit = record.get('rule_msg_atmost_size_unit');
        } else {
            sizeunit = record.get('rule_msg_atleast_size_unit');
        }

        // For the case where we have multiple atleast or atmost size condition,
        // if value already exists than concat that value with ";" and new value.
        if (sizeunit && !overwrite) {
            sizeunit = sizeunit +';'+ this.comboValue;
        } else {
            sizeunit =  this.comboValue;
        }

        if (this.atMostSizeLink) {
            record.set('rule_msg_atmost_size_unit',sizeunit);
        } else {
            record.set('rule_msg_atleast_size_unit',sizeunit);
        }
    },

    /**
     * Function which will check if given input is safe to convert into Bytes size unit
     * from MB/KB size unit.
     * @param {Number} imput the number in KB/MB/Bytes size unit which needs to be checked for compatibility.
     * @param {Zarafa.common.data.SizeUnits} sizeUnit string which should indicate size unit of an input.
     * @return {Boolean} true if input is valid to convert into Bytes else false.
     */
    isSafeToConvertIntoBytes : function (input, sizeUnit)
    {
        var maxNumber = Math.pow(2,31)-1;

        switch (sizeUnit) {
            case Zarafa.common.data.SizeUnits.MB:
                var maxMB = parseInt(maxNumber / Math.pow(1024,2));
                if (input > maxMB) {
                    return false;
                }
                break;
            case Zarafa.common.data.SizeUnits.KB :
                var maxKB = parseInt(maxNumber / 1024);
                if (input > maxKB) {
                    return false;
                }
                break;
            case Zarafa.common.data.SizeUnits.BYTES :
                if (this.sizeValue > maxNumber) {
                    this.msgSize.markInvalid();
                    return false;
                }
                break;
            default : return false;
        }

        return true;
    }

});

Ext.reg('zarafa.atleatsizelink', Zarafa.common.rules.dialogs.AtLeatSizeLink);