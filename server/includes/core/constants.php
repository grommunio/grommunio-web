<?php
	/**
	 * This file contains only some constants used anyware in the WebApp
	 */

	// These are the events, which a module can register for.
	define("OBJECT_SAVE", 				0x0001);
	define("OBJECT_DELETE", 			0x0002);
	define("TABLE_SAVE",				0x0004);
	define("TABLE_DELETE",				0x0008);
	define("REQUEST_START",				0x0010);
	define("REQUEST_END",				0x0020);
	define("HIERARCHY_UPDATE",			0x0022);

	// dummy entryid, used for the REQUEST events
	define("REQUEST_ENTRYID",			"dummy_value");

	// dummy entryid, used for the Update addressbook
	define("ADDRESSBOOK_ENTRYID", "dummy_addressbook_value");

	// used in operations->getHierarchyList
	define("HIERARCHY_GET_ALL",			0);
	define("HIERARCHY_GET_DEFAULT",		1);
	define("HIERARCHY_GET_ONE",			2);

	// used by distribution lists
	define("DL_GUID",				pack("H*", "C091ADD3519DCF11A4A900AA0047FAA4"));
	define("DL_USER",				0xC3);		//	195
	define("DL_USER2",				0xD3);		//	211
	define("DL_USER3",				0xE3);		//	227
	/**
	 * According to Exchange protocol, type property for oneoff contact
	 * will be 0x00.
	 */
	define("DL_EXTERNAL_MEMBER",	0x00);		//	0
	define("DL_DIST",				0xB4);		//	180
	define("DL_USER_AB",			0xB5);		//	181
	define("DL_DIST_AB",			0xB6);		//	182

	// @FIXME these needs to be changed in mapitags.php
	define('PR_PROPOSEDNEWTIME_START', PR_PROPOSENEWTIME_START);
	define('PR_PROPOSEDNEWTIME_END', PR_PROPOSENEWTIME_END);

	// Constants are used to indicate error type on client
	define("ERROR_MAPI",			1);
	define("ERROR_ZARAFA",			2);
	define("ERROR_GENERAL",			3);
?>
