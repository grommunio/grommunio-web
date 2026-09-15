<?php

/*
 * SPDX-FileCopyrightText: Copyright 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * Strings that reach the user through grommunio Web but live in a package it only
 * consumes. tools/update_translations scans this checkout, so without this list
 * they never enter the catalogues and stay English in every language.
 *
 * Nothing includes this file; it exists for xgettext. Keep it in step with the
 * sources named below.
 */

return;
// mapi-header-php, class.meetingrequest.php: subject prefix of a meeting response
_('Tentatively accepted');
_('New Time Proposed');

// mapi-header-php, class.taskrequest.php: subject prefix of a task response
_("Task Accepted:");
_("Task Declined:");
_("Task Updated:");
_("Task Completed:");
_("Cannot assign tasks in public folders. Public folders are not mail-enabled and cannot send task assignment notifications.");

// mapi-header-php, class.mapiexception.php: what the user reads when a MAPI call fails
_("Can not connect to Gromox.");
_("Can not find object.");
_("Can not open object with provided id.");
_("Logon Failed. Please check your name/password.");
_("Operation failed: Server does not have enough memory.");
_("There are no recipients in the message.");
_("You have insufficient privileges to open this object.");
