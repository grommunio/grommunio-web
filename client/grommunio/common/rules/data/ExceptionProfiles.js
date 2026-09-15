/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/common/rules/data/ConditionFlags.js
 */
Ext.namespace('Grommunio.common.rules.data');

/**
 * @class Grommunio.common.rules.data.ExceptionProfiles
 * @singleton
 */
Grommunio.common.rules.data.ExceptionProfiles = [{
    name: _('is received from…'),
    value: Grommunio.common.rules.data.ConditionFlags.RECEIVED_FROM
},{
    name: _('includes these words in the sender\'s address…'),
    value: Grommunio.common.rules.data.ConditionFlags.SENDER_WORDS
},{
    name: _('includes these words in the recipient\'s address…'),
    value: Grommunio.common.rules.data.ConditionFlags.RECIPIENT_WORDS
},{
    name: _('includes these words in the subject…'),
    value: Grommunio.common.rules.data.ConditionFlags.SUBJECT_WORDS
},{
    name: _('includes these words in the body…'),
    value: Grommunio.common.rules.data.ConditionFlags.BODY_WORDS
},{
    name: _('includes these words in the transport headers…'),
    value: Grommunio.common.rules.data.ConditionFlags.TRANSPORTHEADER_WORDS
},{
    name: _('has importance…'),
    value: Grommunio.common.rules.data.ConditionFlags.IMPORTANCE
},{
    name: _('has an attachment'),
    value: Grommunio.common.rules.data.ConditionFlags.ATTACHMENT
},{
    name: _('is sent to…'),
    value: Grommunio.common.rules.data.ConditionFlags.SENT_TO
},{
    name: _('is sent only to me'),
    value: Grommunio.common.rules.data.ConditionFlags.SENT_TO_ME_ONLY
},{
    name: _('has my name in the Cc field'),
    value: Grommunio.common.rules.data.ConditionFlags.SENT_CC_ME
},{
    name: _('does not have my name in the To or Cc field'),
    value: Grommunio.common.rules.data.ConditionFlags.NAME_BCC
},{
    name: _('has my name in the To or Cc field'),
    value: Grommunio.common.rules.data.ConditionFlags.NAME_TO_CC
},{
    name: _('has sensitivity…'),
    value: Grommunio.common.rules.data.ConditionFlags.SENSITIVITY
},{
    name: _('is received after…'),
    value: Grommunio.common.rules.data.ConditionFlags.RECEIVED_AFTER
},{
    name: _('is received before…'),
    value: Grommunio.common.rules.data.ConditionFlags.RECEIVED_BEFORE
},{
    name: _('size is at least…'),
    value: Grommunio.common.rules.data.ConditionFlags.ATLEAST_SIZE
},{
    name: _('size is at most…'),
    value: Grommunio.common.rules.data.ConditionFlags.ATMOST_SIZE
},{
    name: _('has my name in the To field'),
    value: Grommunio.common.rules.data.ConditionFlags.SENT_TO_ME
}];
