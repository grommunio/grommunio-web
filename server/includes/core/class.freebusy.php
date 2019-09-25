<?php

/**
 * This class is just static class and will not be instantiate and
 * It contains the functionality to get freebusy message and folder.
 */
class FreeBusy
{
	/**
	 *  PR_FREEBUSY_ENTRYIDS contains 4 entryids
	 *	PR_FREEBUSY_ENTRYIDS[0] gives associated freebusy folder in calendar
	 *	PR_FREEBUSY_ENTRYIDS[1] Localfreebusy (used for delegate properties)
	 *	PR_FREEBUSY_ENTRYIDS[2] global Freebusydata in public store
	 *	PR_FREEBUSY_ENTRYIDS[3] Freebusydata in IPM_SUBTREE
	 */
	const ASSOCIATED_FREEBUSY_FOLDER = 0;
	const DELEGATE_PROPERTIES = 1;
	const GLOBAL_FREEBUSYDATA = 2;
	const FREEBUSYDATA_IPM_SUBTREE = 3;

	/**
	 * Function will return resource of the local freebusy message of the user's store.
	 * @param {MAPIStore} $store (optional) user's store.
	 * @return {MAPIMessage/Boolean} local freebusy message, otherwise false if message not found.
	 */
	public static function getLocalFreeBusyMessage($store = false)
	{
		if (!$store) {
			$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		}

		// Check Kopano-core has mapi_freebusy_openmsg function,
		// If yes then use mapi function to get freebusy message.
		if (function_exists('mapi_freebusy_openmsg')) {
			return mapi_freebusy_openmsg($store);
		} else {

			// Get 'LocalFreeBusy' message from FreeBusy Store
			$root = mapi_msgstore_openentry($store, null);
			$storeProps = mapi_getprops($root, array(PR_FREEBUSY_ENTRYIDS));
			$localFreeBusyEntryids = $storeProps[PR_FREEBUSY_ENTRYIDS];
			try {
				return mapi_msgstore_openentry($store, $localFreeBusyEntryids[self::DELEGATE_PROPERTIES]);
			} catch (MAPIException $e) {
				// Either user store have malformed entryid in PR_FREEBUSY_ENTRYIDS or
				// No message found of given entryid in 'Freebusy Data' folder.
				if ($e->getCode() == MAPI_E_NOT_FOUND || $e->getCode() == MAPI_E_INVALID_ENTRYID) {
					$freeBusyFolder = mapi_msgstore_openentry($store, $localFreeBusyEntryids[self::FREEBUSYDATA_IPM_SUBTREE]);
					$table = mapi_folder_getcontentstable($freeBusyFolder);
					mapi_table_restrict($table,
						[RES_CONTENT, [
							FUZZYLEVEL => FL_PREFIX,
							ULPROPTAG => PR_MESSAGE_CLASS,
							VALUE => [PR_MESSAGE_CLASS => "IPM.Microsoft.ScheduleData.FreeBusy"]]
						]
					);

					$items = mapi_table_queryallrows($table, array(PR_ENTRYID));
					if (empty($items)) {
						// FIXME recreate local freebusy message in 'Freebusy Data' folder.
						error_log("Unable to find local free busy message in 'Freebusy Data' folder");
						return false;
					}

					$localFreeBusyEntryids[1] = $items[0][PR_ENTRYID];

					// Updating the entryid in the PR_FREEBUSY_ENTRYIDS property of user store.
					mapi_setprops($root, array(PR_FREEBUSY_ENTRYIDS => $localFreeBusyEntryids));
					mapi_savechanges($root);
					return mapi_msgstore_openentry($store, $localFreeBusyEntryids[self::DELEGATE_PROPERTIES]);
				}
			}
		}
	}

	/**
	 * Function will return resource of the freebusy folder of the user's store.
	 * @param {MAPIStore} $store (optional) user's store.
	 * @return {MAPIFolder} freebusy folder.
	 */
	public static function getLocalFreeBusyFolder($store = false)
	{
		if (!$store) {
			$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		}
		// Get 'LocalFreeBusy' message from FreeBusy Store
		$root = mapi_msgstore_openentry($store, null);
		$storeProps = mapi_getprops($root, array(PR_FREEBUSY_ENTRYIDS));
		return mapi_msgstore_openentry($store, $storeProps[PR_FREEBUSY_ENTRYIDS][self::FREEBUSYDATA_IPM_SUBTREE]);
	}
}