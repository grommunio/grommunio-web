<?php
/**
* Status codes returned by MAPI functions 
*
*
*/

/* From winerror.h */ 
//
// Success codes
//
define('S_OK',               0x00000000);
define('S_FALSE',            0x00000001);
define('SEVERITY_ERROR',     1);

/* from winerror.h */ 

/**
* Function to make an error
*/
function make_mapi_e($code)
{
    return (int) mapi_make_scode(1, $code);
}


/**
* Function to make a warning
*/
function make_mapi_s($code)
{
    return (int) mapi_make_scode(0, $code);
}

/* From mapicode.h */ 
/*
 *  On Windows NT 3.5 and Windows 95, scodes are 32-bit values
 *  laid out as follows:
 *  
 *    3 3 2 2 2 2 2 2 2 2 2 2 1 1 1 1 1 1 1 1 1 1
 *    1 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6 5 4 3 2 1 0
 *   +-+-+-+-+-+---------------------+-------------------------------+
 *   |S|R|C|N|r|    Facility         |               Code            |
 *   +-+-+-+-+-+---------------------+-------------------------------+
 *  
 *   where
 *  
 *      S - Severity - indicates success/fail
 *  
 *          0 - Success
 *          1 - Fail (COERROR)
 *  
 *      R - reserved portion of the facility code, corresponds to NT's
 *          second severity bit.
 *  
 *      C - reserved portion of the facility code, corresponds to NT's
 *          C field.
 *  
 *      N - reserved portion of the facility code. Used to indicate a
 *          mapped NT status value.
 *  
 *      r - reserved portion of the facility code. Reserved for internal
 *          use. Used to indicate HRESULT values that are not status
 *          values, but are instead message ids for display strings.
 *  
 *      Facility - is the facility code
 *          FACILITY_NULL                    0x0
 *          FACILITY_RPC                     0x1
 *          FACILITY_DISPATCH                0x2
 *          FACILITY_STORAGE                 0x3
 *          FACILITY_ITF                     0x4
 *          FACILITY_WIN32                   0x7
 *          FACILITY_WINDOWS                 0x8
 *  
 *      Code - is the facility's status code
 *  
 */
define('NOERROR'                                         ,0);

// The following codes don't use make_mapi_e because they are in the 0x000FF000 range,
// but we cannot use the HEX value as would make most sense as that would break in 64bit PHP
// (Gromox server will return a negative value, but PHP would convert this define into a positive
// value). Hence we declare the value exactly as we need it as integer and bypass the
// 32bit/64bit hell.
define('ecUnknownUser'                                   ,0x000003EB);
define('MAPI_E_CALL_FAILED'                              ,0x80004005);
define('MAPI_E_NOT_ENOUGH_MEMORY'                        ,0x8007000E);
define('MAPI_E_INVALID_PARAMETER'                        ,0x80070057);
define('MAPI_E_INTERFACE_NOT_SUPPORTED'                  ,0x80004002);
define('MAPI_E_NO_ACCESS'                                ,0x80070005);

define('MAPI_E_NO_SUPPORT'                               ,make_mapi_e(0x102));
define('MAPI_E_BAD_CHARWIDTH'                            ,make_mapi_e(0x103));
define('MAPI_E_STRING_TOO_LONG'                          ,make_mapi_e(0x105));
define('MAPI_E_UNKNOWN_FLAGS'                            ,make_mapi_e(0x106));
define('MAPI_E_INVALID_ENTRYID'                          ,make_mapi_e(0x107));
define('MAPI_E_INVALID_OBJECT'                           ,make_mapi_e(0x108));
define('MAPI_E_OBJECT_CHANGED'                           ,make_mapi_e(0x109));
define('MAPI_E_OBJECT_DELETED'                           ,make_mapi_e(0x10A));
define('MAPI_E_BUSY'                                     ,make_mapi_e(0x10B));
define('MAPI_E_NOT_ENOUGH_DISK'                          ,make_mapi_e(0x10D));
define('MAPI_E_NOT_ENOUGH_RESOURCES'                     ,make_mapi_e(0x10E));
define('MAPI_E_NOT_FOUND'                                ,make_mapi_e(0x10F));
define('MAPI_E_VERSION'                                  ,make_mapi_e(0x110));
define('MAPI_E_LOGON_FAILED'                             ,make_mapi_e(0x111));
define('MAPI_E_SESSION_LIMIT'                            ,make_mapi_e(0x112));
define('MAPI_E_USER_CANCEL'                              ,make_mapi_e(0x113));
define('MAPI_E_UNABLE_TO_ABORT'                          ,make_mapi_e(0x114));
define('MAPI_E_NETWORK_ERROR'                            ,make_mapi_e(0x115));
define('MAPI_E_DISK_ERROR'                               ,make_mapi_e(0x116));
define('MAPI_E_TOO_COMPLEX'                              ,make_mapi_e(0x117));
define('MAPI_E_BAD_COLUMN'                               ,make_mapi_e(0x118));
define('MAPI_E_EXTENDED_ERROR'                           ,make_mapi_e(0x119));
define('MAPI_E_COMPUTED'                                 ,make_mapi_e(0x11A));
define('MAPI_E_CORRUPT_DATA'                             ,make_mapi_e(0x11B));
define('MAPI_E_UNCONFIGURED'                             ,make_mapi_e(0x11C));
define('MAPI_E_FAILONEPROVIDER'                          ,make_mapi_e(0x11D));
define('MAPI_E_UNKNOWN_CPID'                             ,make_mapi_e(0x11E));
define('MAPI_E_UNKNOWN_LCID'                             ,make_mapi_e(0x11F));

/* Flavors of E_ACCESSDENIED, used at logon */

define('MAPI_E_PASSWORD_CHANGE_REQUIRED'                 ,make_mapi_e(0x120));
define('MAPI_E_PASSWORD_EXPIRED'                         ,make_mapi_e(0x121));
define('MAPI_E_INVALID_WORKSTATION_ACCOUNT'              ,make_mapi_e(0x122));
define('MAPI_E_INVALID_ACCESS_TIME'                      ,make_mapi_e(0x123));
define('MAPI_E_ACCOUNT_DISABLED'                         ,make_mapi_e(0x124));
define('MAPI_E_WEBAPP_FEATURE_DISABLED'                  ,make_mapi_e(0x125));

/* MAPI base function and status object specific errors and warnings */

define('MAPI_E_END_OF_SESSION'                           ,make_mapi_e(0x200));
define('MAPI_E_UNKNOWN_ENTRYID'                          ,make_mapi_e(0x201));
define('MAPI_E_MISSING_REQUIRED_COLUMN'                  ,make_mapi_e(0x202));
define('MAPI_W_NO_SERVICE'                               ,make_mapi_s(0x203));

/* Property specific errors and warnings */

define('MAPI_E_BAD_VALUE'                                ,make_mapi_e(0x301));
define('MAPI_E_INVALID_TYPE'                             ,make_mapi_e(0x302));
define('MAPI_E_TYPE_NO_SUPPORT'                          ,make_mapi_e(0x303));
define('MAPI_E_UNEXPECTED_TYPE'                          ,make_mapi_e(0x304));
define('MAPI_E_TOO_BIG'                                  ,make_mapi_e(0x305));
define('MAPI_E_DECLINE_COPY'                             ,make_mapi_e(0x306));
define('MAPI_E_UNEXPECTED_ID'                            ,make_mapi_e(0x307));

define('MAPI_W_ERRORS_RETURNED'                          ,make_mapi_s(0x380));

/* Table specific errors and warnings */

define('MAPI_E_UNABLE_TO_COMPLETE'                       ,make_mapi_e(0x400));
define('MAPI_E_TIMEOUT'                                  ,make_mapi_e(0x401));
define('MAPI_E_TABLE_EMPTY'                              ,make_mapi_e(0x402));
define('MAPI_E_TABLE_TOO_BIG'                            ,make_mapi_e(0x403));

define('MAPI_E_INVALID_BOOKMARK'                         ,make_mapi_e(0x405));

define('MAPI_W_POSITION_CHANGED'                         ,make_mapi_s(0x481));
define('MAPI_W_APPROX_COUNT'                             ,make_mapi_s(0x482));

/* Transport specific errors and warnings */

define('MAPI_E_WAIT'                                     ,make_mapi_e(0x500));
define('MAPI_E_CANCEL'                                   ,make_mapi_e(0x501));
define('MAPI_E_NOT_ME'                                   ,make_mapi_e(0x502));

define('MAPI_W_CANCEL_MESSAGE'                           ,make_mapi_s(0x580));

/* Message Store, Folder, and Message specific errors and warnings */

define('MAPI_E_CORRUPT_STORE'                            ,make_mapi_e(0x600));
define('MAPI_E_NOT_IN_QUEUE'                             ,make_mapi_e(0x601));
define('MAPI_E_NO_SUPPRESS'                              ,make_mapi_e(0x602));
define('MAPI_E_COLLISION'                                ,make_mapi_e(0x604));
define('MAPI_E_NOT_INITIALIZED'                          ,make_mapi_e(0x605));
define('MAPI_E_NON_STANDARD'                             ,make_mapi_e(0x606));
define('MAPI_E_NO_RECIPIENTS'                            ,make_mapi_e(0x607));
define('MAPI_E_SUBMITTED'                                ,make_mapi_e(0x608));
define('MAPI_E_HAS_FOLDERS'                              ,make_mapi_e(0x609));
define('MAPI_E_HAS_MESSAGES'                             ,make_mapi_e(0x60A));
define('MAPI_E_FOLDER_CYCLE'                             ,make_mapi_e(0x60B));
define('MAPI_E_STORE_FULL'                               ,make_mapi_e(0x60C));

define('MAPI_W_PARTIAL_COMPLETION'                       ,make_mapi_s(0x680));

/* Address Book specific errors and warnings */

define('MAPI_E_AMBIGUOUS_RECIP'                          ,make_mapi_e(0x700));

/* ICS errors and warnings */

define('SYNC_E_UNKNOWN_FLAGS',                    		MAPI_E_UNKNOWN_FLAGS);
define('SYNC_E_INVALID_PARAMETER',                		MAPI_E_INVALID_PARAMETER);
define('SYNC_E_ERROR',                            		MAPI_E_CALL_FAILED);
define('SYNC_E_OBJECT_DELETED',                   		make_mapi_e(0x800));
define('SYNC_E_IGNORE',                           		make_mapi_e(0x801));
define('SYNC_E_CONFLICT',                         		make_mapi_e(0x802));
define('SYNC_E_NO_PARENT',                        		make_mapi_e(0x803));
define('SYNC_E_INCEST',                           		make_mapi_e(0x804));
define('SYNC_E_UNSYNCHRONIZED',                   		make_mapi_e(0x805));

define('SYNC_W_PROGRESS',                         		make_mapi_s(0x820));
define('SYNC_W_CLIENT_CHANGE_NEWER',              		make_mapi_s(0x821));

function mapi_strerror($e)
{
	switch ($e) {
	case S_OK: return "success";
	case MAPI_E_CALL_FAILED: return "An error of unexpected or unknown origin occurred";
	case MAPI_E_NOT_ENOUGH_MEMORY: return "Not enough memory was available to complete the operation";
	case MAPI_E_INVALID_PARAMETER: return "An invalid parameter was passed to a function or remote procedure call";
	case MAPI_E_INTERFACE_NOT_SUPPORTED: return "MAPI interface not supported";
	case MAPI_E_NO_ACCESS: return "An attempt was made to access a message store or object for which the user has insufficient permissions";
	case MAPI_E_NO_SUPPORT: return "Function is not implemented";
	case MAPI_E_BAD_CHARWIDTH: return "An incompatibility exists in the character sets supported by the caller and the implementation";
	case MAPI_E_STRING_TOO_LONG: return "In the context of this method call, a string exceeds the maximum permitted length";
	case MAPI_E_UNKNOWN_FLAGS: return "One or more values for a flags parameter were not valid";
	case MAPI_E_INVALID_ENTRYID: return "invalid entryid";
	case MAPI_E_INVALID_OBJECT: return "A method call was made using a reference to an object that has been destroyed or is not in a viable state";
	case MAPI_E_OBJECT_CHANGED: return "An attempt to commit changes failed because the object was changed separately";
	case MAPI_E_OBJECT_DELETED: return "An operation failed because the object was deleted separately";
	case MAPI_E_BUSY: return "A table operation failed because a separate operation was in progress at the same time";
	case MAPI_E_NOT_ENOUGH_DISK: return "Not enough disk space was available to complete the operation";
	case MAPI_E_NOT_ENOUGH_RESOURCES: return "Not enough system resources were available to complete the operation";
	case MAPI_E_NOT_FOUND: return "The requested object could not be found at the server";
	case MAPI_E_VERSION: return "Client and server versions are not compatible";
	case MAPI_E_LOGON_FAILED: return "A client was unable to log on to the server";
	case MAPI_E_SESSION_LIMIT: return "A server or service is unable to create any more sessions";
	case MAPI_E_USER_CANCEL: return "An operation failed because a user cancelled it";
	case MAPI_E_UNABLE_TO_ABORT: return "A ropAbort or ropAbortSubmit ROP request was unsuccessful";
	case MAPI_E_NETWORK_ERROR: return "An operation was unsuccessful because of a problem with network operations or services";
	case MAPI_E_DISK_ERROR: return "There was a problem writing to or reading from disk";
	case MAPI_E_TOO_COMPLEX: return "The operation requested is too complex for the server to handle (often w.r.t. restrictions)";
	case MAPI_E_BAD_COLUMN: return "The column requested is not allowed in this type of table";
	case MAPI_E_EXTENDED_ERROR: return "extended error";
	case MAPI_E_COMPUTED: return "A property cannot be updated because it is read-only, computed by the server";
	case MAPI_E_CORRUPT_DATA: return "There is an internal inconsistency in a database, or in a complex property value";
	case MAPI_E_UNCONFIGURED: return "unconfigured";
	case MAPI_E_FAILONEPROVIDER: return "failoneprovider";
	case MAPI_E_UNKNOWN_CPID: return "The server is not configured to support the code page requested by the client";
	case MAPI_E_UNKNOWN_LCID: return "The server is not configured to support the locale requested by the client";
	case MAPI_E_PASSWORD_CHANGE_REQUIRED: return "password change required";
	case MAPI_E_PASSWORD_EXPIRED: return "password expired";
	case MAPI_E_INVALID_WORKSTATION_ACCOUNT: return "invalid workstation account";
	case MAPI_E_INVALID_ACCESS_TIME: return "The operation failed due to clock skew between servers";
	case MAPI_E_ACCOUNT_DISABLED: return "account disabled";
	case MAPI_E_END_OF_SESSION: return "The server session has been destroyed, possibly by a server restart";
	case MAPI_E_UNKNOWN_ENTRYID: return "The EntryID passed to OpenEntry was created by a different MAPI provider";
	case MAPI_E_MISSING_REQUIRED_COLUMN: return "missing required column";
	case MAPI_W_NO_SERVICE: return "no service";
	case MAPI_E_BAD_VALUE: return "bad value";
	case MAPI_E_INVALID_TYPE: return "invalid type";
	case MAPI_E_TYPE_NO_SUPPORT: return "type no support";
	case MAPI_E_UNEXPECTED_TYPE: return "unexpected_type";
	case MAPI_E_TOO_BIG: return "The table is too big for the requested operation to complete";
	case MAPI_E_DECLINE_COPY: return "The provider implements this method by calling a support object method, and the caller has passed the MAPI_DECLINE_OK flag";
	case MAPI_E_UNEXPECTED_ID: return "unexpected id";
	case MAPI_W_ERRORS_RETURNED: return "The call succeeded, but the message store provider has error information available";
	case MAPI_E_UNABLE_TO_COMPLETE: return "A complex operation such as building a table row set could not be completed";
	case MAPI_E_TIMEOUT: return "An asynchronous operation did not succeed within the specified time-out";
	case MAPI_E_TABLE_EMPTY: return "A table essential to the operation is empty";
	case MAPI_E_TABLE_TOO_BIG: return "The table is too big for the requested operation to complete";
	case MAPI_E_INVALID_BOOKMARK: return "The bookmark passed to a table operation was not created on the same table";
	case MAPI_W_POSITION_CHANGED: return "position changed";
	case MAPI_W_APPROX_COUNT: return "approx count";
	case MAPI_E_WAIT: return "A wait time-out has expired";
	case MAPI_E_CANCEL: return "The operation had to be canceled";
	case MAPI_E_NOT_ME: return "not me";
	case MAPI_W_CANCEL_MESSAGE: return "cancel message";
	case MAPI_E_CORRUPT_STORE: return "corrupt store";
	case MAPI_E_NOT_IN_QUEUE: return "not in queue";
	case MAPI_E_NO_SUPPRESS: return "The server does not support the suppression of read receipts";
	case MAPI_E_COLLISION: return "A folder or item cannot be created because one with the same name or other criteria already exists";
	case MAPI_E_NOT_INITIALIZED: return "The subsystem is not ready";
	case MAPI_E_NON_STANDARD: return "non standard";
	case MAPI_E_NO_RECIPIENTS: return "A message cannot be sent because it has no recipients";
	case MAPI_E_SUBMITTED: return "A message cannot be opened for modification because it has already been sent";
	case MAPI_E_HAS_FOLDERS: return "A folder cannot be deleted because it still contains subfolders";
	case MAPI_E_HAS_MESSAGES: return "A folder cannot be deleted because it still contains messages";
	case MAPI_E_FOLDER_CYCLE: return "A folder move or copy operation would create a cycle";
	case MAPI_W_PARTIAL_COMPLETION: return "The call succeeded, but not all entries were successfully operated on";
	case MAPI_E_AMBIGUOUS_RECIP: return "An unresolved recipient matches more than one directory entry";
	case MAPI_E_STORE_FULL: return "Store full";
	default: return sprintf("%xh", $e);
	}
}

?>
