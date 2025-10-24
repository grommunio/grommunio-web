<?php

/**
 * This file contains only some constants used anywhere in grommunio Web.
 */

// These are the events, which a module can register for.
define("OBJECT_SAVE", 0x0001);
define("OBJECT_DELETE", 0x0002);
define("TABLE_SAVE", 0x0004);
define("TABLE_DELETE", 0x0008);
define("REQUEST_START", 0x0010);
define("REQUEST_END", 0x0020);
define("HIERARCHY_UPDATE", 0x0022);

// dummy entryid, used for the REQUEST events
define("REQUEST_ENTRYID", "dummy_value");

// dummy entryid, used for the Update addressbook
define("ADDRESSBOOK_ENTRYID", "dummy_addressbook_value");

// used in operations->getHierarchyList
define("HIERARCHY_GET_ALL", 0);
define("HIERARCHY_GET_DEFAULT", 1);
define("HIERARCHY_GET_ONE", 2);

// Distribution list constants moved to mapi-header-php/mapidefs.php

// Constants are used to indicate error type on client
define("ERROR_MAPI", 1);
define("ERROR_ZARAFA", 2);
define("ERROR_GENERAL", 3);

define("LOGLEVEL_OFF", 0);
define("LOGLEVEL_FATAL", 1);
define("LOGLEVEL_ERROR", 2);
define("LOGLEVEL_WARN", 3);
define("LOGLEVEL_INFO", 4);
define("LOGLEVEL_DEBUG", 5);

// Future last time date for out of office "19-01-2038"
define("FUTURE_ENDDATE", 0x7FFFFFFF);
