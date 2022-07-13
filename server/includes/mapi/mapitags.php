<?php
/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * SPDX-FileCopyrightText: Copyright 2005-2016 Zarafa Deutschland GmbH
 * SPDX-FileCopyrightText: Copyright 2020-2022 grommunio GmbH
 */

/* Search folder properties */
define('PR_EC_SUGGESTION', mapi_prop_tag(PT_TSTRING, 0x6707));

// custom properties to hold size units
define('PR_RULE_ATLEAST_MESSAGE_SIZEUNIT', mapi_prop_tag(PT_STRING8, 0x6715));
define('PR_RULE_ATMOST_MESSAGE_SIZEUNIT', mapi_prop_tag(PT_STRING8, 0x6717));
// custom properties which holds size units for exceptions
define('PR_RULE_EXCEPTION_ATLEAST_MESSAGE_SIZEUNIT', mapi_prop_tag(PT_STRING8, 0x6718));
define('PR_RULE_EXCEPTION_ATMOST_MESSAGE_SIZEUNIT', mapi_prop_tag(PT_STRING8, 0x6719));

/* storage for the settings for the webaccess 7.xx */
define('PR_EC_RECIPIENT_HISTORY_JSON', mapi_prop_tag(PT_STRING8, 0x6773));

/* The persistent settings are settings that will not be touched when the settings are reset */
define('PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON', mapi_prop_tag(PT_STRING8, 0x6774));

define('PR_EC_DISABLED_FEATURES', mapi_prop_tag(PT_MV_TSTRING, 0x67B4));

define('PR_EC_ARCHIVE_SERVERS', mapi_prop_tag(PT_MV_TSTRING, 0x67C4));

define('PR_EC_WA_ATTACHMENT_ID', mapi_prop_tag(PT_STRING8, 0x67E1));
define('PR_EC_WA_FILES_ENCRYPTION_KEY', mapi_prop_tag(PT_BINARY, 0x67E2));
