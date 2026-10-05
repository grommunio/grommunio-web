<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/class.GrommunioException.php';

/**
 * Builds the user-facing exception for a file that could not be imported into a folder.
 */
class ImportError {
	/**
	 * @param Exception $e          conversion failure
	 * @param string    $filename   name of the imported file
	 * @param resource  $folder     destination folder
	 * @param callable  $otherStore returns the delegate store owning the folder
	 * @param string    $emptyText  message for a file without importable items
	 */
	public static function fromException($e, $filename, $folder, callable $otherStore, $emptyText): GrommunioException {
		$message = sprintf(_("Unable to import '%s' to '%s'. "), $filename, self::qualifiedFolderName($folder, $otherStore));
		if ($e->getCode() === MAPI_E_TABLE_EMPTY) {
			$message .= $emptyText;
		}
		elseif ($e->getCode() === MAPI_E_CORRUPT_DATA) {
			$message .= _("The file is corrupt.");
		}
		elseif ($e->getCode() === MAPI_E_INVALID_PARAMETER) {
			$message .= _("The file is invalid.");
		}
		else {
			$message = sprintf(_("Unable to import '%s'. "), $filename) . $e->getMessage();
		}

		$error = new GrommunioException($message);
		$error->setTitle(_("Import error"));

		return $error;
	}

	/**
	 * Folder name followed by the public store name or the delegate store owner.
	 *
	 * @param resource $folder
	 *
	 * @return string
	 */
	private static function qualifiedFolderName($folder, callable $otherStore) {
		$folderProps = mapi_getprops($folder, [PR_DISPLAY_NAME, PR_MDB_PROVIDER]);
		$name = $folderProps[PR_DISPLAY_NAME];
		if ($folderProps[PR_MDB_PROVIDER] === ZARAFA_STORE_PUBLIC_GUID) {
			$publicStore = $GLOBALS["mapisession"]->getPublicMessageStore();
			$publicStoreName = mapi_getprops($publicStore, [PR_DISPLAY_NAME]);
			$name .= " - " . $publicStoreName[PR_DISPLAY_NAME];
		}
		elseif ($folderProps[PR_MDB_PROVIDER] === ZARAFA_STORE_DELEGATE_GUID) {
			$ownerName = mapi_getprops($otherStore(), [PR_MAILBOX_OWNER_NAME]);
			$name .= " - " . $ownerName[PR_MAILBOX_OWNER_NAME];
		}

		return $name;
	}
}
