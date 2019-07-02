/*
 * #dependsFile client/zarafa/common/rules/data/ConditionFlags.js
 */
Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.ExceptionProfiles
 * @singleton
 */
Zarafa.common.rules.data.ExceptionProfiles = [{
    name : _('is received from ...'),
    value : Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM
},{
    name : _('includes these words in the sender\'s address ...'),
    value : Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS
},{
    name : _('includes these words in the recipient\'s address ...'),
    value : Zarafa.common.rules.data.ConditionFlags.RECIPIENT_WORDS
},{
    name : _('includes these words in the subject ...'),
    value : Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS
},{
    name : _('includes these words in the body ...'),
    value : Zarafa.common.rules.data.ConditionFlags.BODY_WORDS
},{
    name : _('includes these words in the transport-headers ...'),
    value : Zarafa.common.rules.data.ConditionFlags.TRANSPORTHEADER_WORDS
},{
    name : _('has importance ...'),
    value : Zarafa.common.rules.data.ConditionFlags.IMPORTANCE
},{
    name : _('has an attachment'),
    value : Zarafa.common.rules.data.ConditionFlags.ATTACHMENT
},{
    name : _('is sent to ...'),
    value : Zarafa.common.rules.data.ConditionFlags.SENT_TO
},{
    name : _('is sent only to me'),
    value : Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY
},{
    name : _('has my name in the Cc field'),
    value : Zarafa.common.rules.data.ConditionFlags.SENT_CC_ME
},{
    name : _('does not have my name in the To or Cc field'),
    value : Zarafa.common.rules.data.ConditionFlags.NAME_BCC
},{
    name : _('has my name in the To or Cc field'),
    value : Zarafa.common.rules.data.ConditionFlags.NAME_TO_CC
},{
    name : _('has sensitivity'),
    value : Zarafa.common.rules.data.ConditionFlags.SENSITIVITY
},{
    name : _('is received after'),
    value : Zarafa.common.rules.data.ConditionFlags.RECEIVED_AFTER
},{
    name : _('is received before'),
    value : Zarafa.common.rules.data.ConditionFlags.RECEIVED_BEFORE
},{
    name : _('has my name in the To field'),
    value : Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME
}];
