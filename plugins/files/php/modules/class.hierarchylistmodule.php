<?php
require_once __DIR__ . "/class.fileslistmodule.php";

/**
 * This module handles all list and change requests for the files browser.
 *
 * @class HierarchyListModule
 * @extends FilesListModule
 */
class HierarchyListModule extends FilesListModule
{
	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	function createNotifiers()
	{
		$entryid = $this->getEntryID();
		$GLOBALS["bus"]->registerNotifier('filesbrowsernotifier', $entryid);
		$GLOBALS["bus"]->registerNotifier('fileshierarchynotifier', REQUEST_ENTRYID);
	}

	/**
	 * @return bool|void
	 */
	function execute()
	{
		$result = false;
		foreach ($this->data as $actionType => $actionData) {
			if (isset($actionType)) {
				try {
					switch ($actionType) {
						case "list":
							$this->hierarchyList($actionData);
							break;
						case "updatelist":
							$this->updateHierarchy($actionData);
							break;
						case "save":
							$this->save($actionData);
							break;
						case "delete":
							$result = $this->delete($actionData);
							break;
						default:
							$this->handleUnknownActionType($actionType);
					}
				} catch (MAPIException $e) {
					$this->sendFeedback(false, $this->errorDetailsFromException($e));
				}
				catch (AccountException $e) {
					$this->sendFeedback(false, array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'title' => $e->getTitle(),
							'original_message' => $e->getMessage(),
							'display_message' => $e->getMessage()
						)
					));
				} catch (BackendException $e) {
					$this->sendFeedback(false, array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'title' => $e->getTitle(),
							'original_message' => $e->getMessage(),
							'display_message' => $e->getMessage(),
							'code' => $e->getCode()
						)
					));
				} catch (Exception $e) {
					$this->sendFeedback(false, array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'title' => $e->getTitle(),
							'original_message' => $e->getMessage(),
							'display_message' => $e->getMessage(),
							'code' => $e->getCode()
						)
					));
				}
			}
		}

		return $result;
	}

	/**
	 * Generates the hierarchy list. All folders and sub folders are added to response data.
	 */
	function hierarchyList($action)
	{
		$isReload = isset($action['reload']) ? $action['reload'] : false;
		$data = $this->getHierarchyList($isReload);
		$this->addActionData("list", $data);
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * Function used to retrieve the child folders of given folder id.
	 *
	 * @param {Array} $action The action data which passed in request.
	 */
	function updateHierarchy($action)
	{
		$nodeId = $action["folder_id"];
		$account = $this->accountFromNode($nodeId);
		$backend = $this->initializeBackend($account,true);
		$subFolders = $this->getSubFolders($nodeId, $backend);

		$this->addActionData("updatelist", array("item"=>$subFolders));
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * @param $actionData
	 * @return array|void
	 * @throws \Files\Backend\Exception
	 */
	function save($actionData)
	{
		$messageProps = parent::save($actionData);
		if(!empty($messageProps)) {
			// Notify all subfolders for update folder.
			$this->notifySubFolders($messageProps["props"]["folder_id"]);

			// Need to add message class to update the files grid record through notification
			$messageProps["props"]["message_class"] = "IPM.Files";
			$GLOBALS["bus"]->notify($messageProps["parent_entryid"], OBJECT_SAVE, $messageProps);
		}
	}

	/**
	 * Deletes the selected files on the backend server
	 *
	 * @access private
	 * @param string $actionType name of the current action
	 * @param array $actionData all parameters contained in this request
	 * @return bool
	 * @throws BackendException if the backend request fails
	 */
	function delete($actionData)
	{
		// TODO: Do we need this if block code?
		if (isset($actionData['records']) && is_array($actionData['records'])) {
			foreach ($actionData['records'] as $record) {
				$nodeId = $record['entryid'];
				$relNodeId = substr($nodeId, strpos($nodeId, '/'));

				$account = $this->accountFromNode($nodeId);

				// initialize the backend
				$initializedBackend = $this->initializeBackend($account);

				$initializedBackend->delete($relNodeId);
				//Logger::debug(self::LOG_CONTEXT, "deleted: " . $nodeId . ", worked: " . $result);

				// clear the cache
				$this->deleteCache($account->getId(), dirname($relNodeId));

				$GLOBALS["bus"]->notify($record["parent_entryid"], OBJECT_DELETE, array(
					"id"=> $nodeId,
					"entryid"=> $nodeId,
					"parent_entryid"=> $record["parent_entryid"],
					"store_entryid"=> $record["store_entryid"]
				));
			}

			$this->sendFeedback(true);
		} else {
			$nodeId = $actionData['folder_id'];
			$relNodeId = substr($nodeId, strpos($nodeId, '/'));

			$account = $this->accountFromNode($nodeId);
			$accountId = $account->getId();

			// initialize the backend
			$initializedBackend = $this->initializeBackend($account);

			try {
				$initializedBackend->delete($relNodeId);
			} catch (\Files\Backend\Exception $e) {
				// TODO: this might fails because the file was already deleted.
				// fire error message if any other error occured.
				//Logger::debug(self::LOG_CONTEXT, "deleted a directory that was no longer available");
			}

			// Get old cached data.
			$cachedDir = $this->getCache($accountId, dirname($relNodeId));

			if (isset($cachedDir[$relNodeId]) && !empty($cachedDir[$relNodeId])) {
				// Delete the folder from cached data.
				unset($cachedDir[$relNodeId]);
			}

			// clear the cache of parent directory.
			$this->deleteCache($accountId, dirname($relNodeId));
			// clear the cache of selected directory.
			$this->deleteCache($accountId, rtrim($relNodeId, '/'));

			// Set data in cache.
			$this->setCache($accountId, dirname($relNodeId), $cachedDir);

			$this->sendFeedback(true);
			$GLOBALS["bus"]->notify($actionData["parent_entryid"], OBJECT_DELETE, array(
				"id"=> $actionData["entryid"],
				"folder_id"=> $nodeId,
				"entryid"=> $actionData["entryid"],
				"parent_entryid"=> $actionData["parent_entryid"],
				"store_entryid"=> $actionData["store_entryid"]
			));
		}

		return true;
	}
}
