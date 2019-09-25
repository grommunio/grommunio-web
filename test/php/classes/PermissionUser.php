<?php

require_once('IPMUser.php');

/**
 * PermissionUser
 *
 * An extension to a normal IPMUser to represent a user
 * which can work on permissions of a folder.
 */
class PermissionUser extends IPMUser {
	/**
	 * Add permissions to the default folder
	 *
	 * @param HierarchyUser $user The user which will receive the permissions
	 * @param Number $rights The rights value which the user will receive
	 * @param Binary $entryid The entryid of the folder to update
	 */
	public function addPermissions($user, $rights, $entryid = null)
	{
		$this->logon();

		$props = $user->getUserProps(array( PR_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME ));

		return $this->saveFolder(array(
			'entryid' => $entryid ? bin2hex($entryid) : bin2hex($this->defaultFolderEntryId),
			'permissions' => array(
				'add' => array(
					array(
						'entryid' => bin2hex($props[PR_ENTRYID]),
						'rights' => $rights
					)
				)
			)
		));
	}

	/**
	 * Modify permissions on the default folder
	 *
	 * @param HierarchyUser $user The user which will receive the permissions
	 * @param Number $rights The rights value which the user will receive
	 * @param Binary $entryid The entryid of the folder to update
	 */
	public function modifyPermissions($user, $rights, $entryid)
	{
		$this->logon();

		$props = $user->getUserProps(array( PR_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME ));

		return $this->saveFolder(array(
			'entryid' => $entryid ? bin2hex($entryid) : bin2hex($this->defaultFolderEntryId),
			'permissions' => array(
				'modify' => array(
					array(
						'entryid' => bin2hex($props[PR_ENTRYID]),
						'rights' => $rights
					)
				)
			)
		));
	}

	/**
	 * Delete permissions on the default folder
	 *
	 * @param HierarchyUser $user The user which permissions will be deleted
	 * @param Binary $entryid The entryid of the folder to update
	 */
	public function deletePermissions($user, $entryid)
	{
		$this->logon();

		$props = $user->getUserProps(array( PR_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME ));

		return $this->saveFolder(array(
			'entryid' => $entryid ? bin2hex($entryid) : bin2hex($this->defaultFolderEntryId),
			'permissions' => array(
				'remove' => array(
					array(
						'entryid' => bin2hex($props[PR_ENTRYID]),
						'display_name' => $props[PR_DISPLAY_NAME]
					)
				)
			)
		));
	}

	/**
	 * Cleanup folder inside the store which might have been affected during testing.
	 * This will additionally clear any permissions which might have been set
	 *
	 * @param MAPI_STORE The store which must be cleaned. Defaults to getDefaultMessageStore().
	 * @param String $entryId The entryid of the folder to cleaned up
	 */
	public function cleanFolder($store = false, $entryId)
	{
		parent::cleanFolder($store, $entryId);

		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		// In case of the IPM_SUBTREE we should act on the store
		if ($entryId !== $this->getDefaultFolderEntryID(PR_IPM_SUBTREE_ENTRYID)) {
			$folder = mapi_msgstore_openentry($store, $entryId);
		} else {
			$folder = $store;
		}

		$grants = mapi_zarafa_getpermissionrules($folder, ACCESS_TYPE_GRANT);
		if (!empty($grants)) {
			foreach ($grants as $i => &$grant) {
				$grant['rights'] = ecRightsNone;
				$grant['state'] = RIGHT_DELETED | RIGHT_AUTOUPDATE_DENIED;
			}
			unset($grant);
			mapi_zarafa_setpermissionrules($folder, $grants);
			mapi_savechanges($folder);
		}

		if($entryId === $this->getDefaultFolderEntryID(PR_IPM_APPOINTMENT_ENTRYID)) {
			// when removing calendar permissions we should also remove permissions from freebusy folder
			$freeBusyFolder = $this->getFreeBusyFolder($store);
			$grants = mapi_zarafa_getpermissionrules($freeBusyFolder, ACCESS_TYPE_GRANT);

			if (!empty($grants)) {
				foreach ($grants as $i => &$grant) {
					$grant['rights'] = ecRightsNone;
					$grant['state'] = RIGHT_DELETED | RIGHT_AUTOUPDATE_DENIED;
				}
				unset($grant);
				mapi_zarafa_setpermissionrules($freeBusyFolder, $grants);
				mapi_savechanges($freeBusyFolder);
			}
		}
	}

	/**
	 * Get permissions for default folder on the basis of passed entryid.
	 * @param Folder $folder The folder for which the permissions are requested
	 * @param store The store to which the folder belongs requested.
	 * If not provided, then defaultMessageStore is used.
	 * @return Array permission array.
	 */
	public function getDefaultFolderPermission($folder, $store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		return $this->getFolderPermission($folder, $store);
	}

	/**
	 * Get permissions for folder.
	 * @param MAPI_FOLDER $folder The mapi folder
	 * @param MAPI_STORE $store The store store of the passed folder.
	 * If not provided, then defaultMessageStore is used.
	 * @return Array permission array.
	 */
	public function getFolderPermission($folder, $store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		return mapi_zarafa_getpermissionrules($folder, ACCESS_TYPE_GRANT);
	}
}
?>
