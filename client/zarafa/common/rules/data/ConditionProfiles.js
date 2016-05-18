/*
 * #dependsFile client/zarafa/common/rules/data/ConditionFlags.js
 */
Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.ConditionProfiles
 * @singleton
 */
Zarafa.common.rules.data.ConditionProfiles = [{
	name : _('is received from ...'),
	value : Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM
},{
	name : _('includes these words in the sender\'s address ...'),
	value : Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS
},{
	name : _('includes these words in the subject ...'),
	value : Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS
},{
	name : _('includes these words in the body ...'),
	value : Zarafa.common.rules.data.ConditionFlags.BODY_WORDS
},{
	name : _('has importance ...'),
	value : Zarafa.common.rules.data.ConditionFlags.IMPORTANCE
},{
	name : _('is sent to ...'),
	value : Zarafa.common.rules.data.ConditionFlags.SENT_TO
},{
	name : _('is sent only to me'),
	value : Zarafa.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY
}];
