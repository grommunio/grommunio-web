<?php
/**
 * suggestEmailAddressModule
 * 
 * Class is used to store/retrieve suggestion list entries from a mapi property PR_EC_RECIPIENT_HISTORY_JSON
 * on default store. The format of recipient history that is stored in this proeprty is shown below
 * {
 * 	 recipients : [
 *		'display_name' : 'foo bar',
 *		'smtp_address' : 'foo@local.com',
 *		'count' : 1,
 *		'last_used' : 1232313121,
 *		'object_type' : 6 // MAPI_MAILUSER
 *	 ]
 * }
 */

class suggestEmailAddressModule extends Module
{
	function __construct($id, $data)
	{
		parent::__construct($id, $data);
	}

	function execute()
	{
		try {
			// Retrieve the recipient history
			$storeProps  = mapi_getprops($GLOBALS["mapisession"]->getDefaultMessageStore(), array(PR_EC_RECIPIENT_HISTORY_JSON));
			$recipient_history = false;

			if(isset($storeProps[PR_EC_RECIPIENT_HISTORY_JSON]) || propIsError(PR_EC_RECIPIENT_HISTORY_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
				$stream = mapi_openproperty($GLOBALS["mapisession"]->getDefaultMessageStore(), PR_EC_RECIPIENT_HISTORY_JSON, IID_IStream, 0, 0);

				$stat = mapi_stream_stat($stream);
				mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
				$datastring = '';
				for($i=0;$i<$stat['cb'];$i+=1024){
					$datastring .= mapi_stream_read($stream, 1024);
				}

				if($datastring !== "") {
					$recipient_history = json_decode_data($datastring, true);
				}
			}

			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					switch($actionType) {
						case 'delete':
							$this->deleteRecipient($action, $recipient_history);
							break;
						case 'list':
							$data = $this->getRecipientList($action, $recipient_history);

							// Pass data on to be returned to the client
							$this->addActionData("list", $data);
							$GLOBALS["bus"]->addData($this->getResponseData());

							break;
					}
				}
			}
		} catch (MAPIException $e) {
			$this->processException($e, $actionType);
		}
	}


	static function cmpSortResultList($a, $b){
		if($a['count'] < $b['count']){
			return 1;
		}elseif($a['count'] > $b['count']){
			return -1;
		}else{
			$l_iReturnVal = strnatcasecmp($a['display_name'], $b['display_name']);
			if($l_iReturnVal == 0){
				$l_iReturnVal = strnatcasecmp($a['smtp_address'], $b['smtp_address']);
			}
			return $l_iReturnVal;
		}
	}

	/**
	 * Function is used to delete a recipient entry from already stored recipient history
	 * in mapi property. it searches for deleteRecipients key in the action array which will
	 * contain email addresses of recipients that should be deleted in semicolon seperated format.
	 * @param {Array} $action action data in associative array format.
	 * @param {Array} $recipient_history recipient history stored in mapi proeprty.
	 */
	function deleteRecipient($action, $recipient_history) {
		if(isset($action)  && !empty($recipient_history) && !empty($recipient_history['recipients'])) {
			/**
			 * A foreach is used instead of a normal for-loop to
			 * prevent the loop from finishing before the end of
			 * the array, because of the unsetting of elements 
			 * in that array.
			 **/
			foreach($recipient_history['recipients'] as $index => $recipient){
				if($action['email_address'] == $recipient['email_address'] || $action['smtp_address'] == $recipient['smtp_address']){
					unset($recipient_history['recipients'][$index]);
				}
			}
			// Re-indexing recipients' array to adjust index of deleted recipients
			$recipient_history['recipients'] = array_values($recipient_history['recipients']);
			
			// Write new recipient history to property
			$l_sNewRecipientHistoryJSON = json_encode($recipient_history);

			$stream = mapi_openproperty($GLOBALS["mapisession"]->getDefaultMessageStore(), PR_EC_RECIPIENT_HISTORY_JSON, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
			mapi_stream_setsize($stream, strlen($l_sNewRecipientHistoryJSON));
			mapi_stream_write($stream, $l_sNewRecipientHistoryJSON);
			mapi_stream_commit($stream);
			mapi_savechanges($GLOBALS["mapisession"]->getDefaultMessageStore());
		}

		// send success message to client
		$this->sendFeedback(true);
	}

	/**
	 * Function is used to get recipient history from mapi property based
	 * on the query specified by the client in action array.
	 * @param {Array} $action action data in associative array format.
	 * @param {Array} $recipient_history recipient history stored in mapi proeprty.
	 * @returns {Array} data holding recipients that matched the query.
	 */
	function getRecipientList($action, $recipient_history) {
		if(!empty($action["query"]) && !empty($recipient_history) && !empty($recipient_history['recipients'])) {
			// Setup result array with match levels
			$l_aResult = Array(
				0 => Array(),	// Matches on whole string
				1 => Array()	// Matches on part of string
			);

			// Loop through all the recipients

			for($i = 0, $len = count($recipient_history['recipients']); $i < $len; $i++) {
				// Prepare strings for case sensitive search
				$l_sName = strtolower($recipient_history['recipients'][$i]['display_name']);
				$l_sEmail = strtolower($recipient_history['recipients'][$i]['smtp_address']);
				$l_sSearchString = strtolower($action["query"]);

				// Check for the presence of the search string
				$l_ibPosName = strpos($l_sName, $l_sSearchString);
				$l_ibPosEmail = strpos($l_sEmail, $l_sSearchString);

				// Check if the string is present in name or email fields
				if($l_ibPosName !== false || $l_ibPosEmail !== false){
					// Check if the found string matches from the start of the word
					if($l_ibPosName === 0 || substr($l_sName, ($l_ibPosName-1), 1) == ' ' || $l_ibPosEmail === 0 || substr($l_sEmail, ($l_ibPosEmail-1), 1) == ' '){
						array_push($l_aResult[0], Array(
							'display_name' => $recipient_history['recipients'][$i]['display_name'],
							'smtp_address' => $recipient_history['recipients'][$i]['smtp_address'],
							'email_address' => $recipient_history['recipients'][$i]['email_address'],
							'address_type' => $recipient_history['recipients'][$i]['address_type'],
							'count' => $recipient_history['recipients'][$i]['count'],
							'last_used' => $recipient_history['recipients'][$i]['last_used'],
							'object_type' => $recipient_history['recipients'][$i]['object_type'],
						));
					// Does not match from start of a word, but start in the middle
					}else{
						array_push($l_aResult[1], Array(
							'display_name' => $recipient_history['recipients'][$i]['display_name'],
							'smtp_address' => $recipient_history['recipients'][$i]['smtp_address'],
							'email_address' => $recipient_history['recipients'][$i]['email_address'],
							'address_type' => $recipient_history['recipients'][$i]['address_type'],
							'count' => $recipient_history['recipients'][$i]['count'],
							'last_used' => $recipient_history['recipients'][$i]['last_used'],
							'object_type' => $recipient_history['recipients'][$i]['object_type'],
						));
					}
				}
			}

			// Prevent the displaying of the exact match of the whole email address when only one item is found.
			if(count($l_aResult[0]) == 1 && empty($l_aResult[1]) && $l_sSearchString == strtolower($l_aResult[0][0]['smtp_address'])){
				$recipientList = Array();
			}else{
				/**
				 * Sort lists
				 *
				 * This block of code sorts the two lists and creates one final list. 
				 * The first list holds the matches based on whole words or words 
				 * beginning with the search string and the second list contains the 
				 * partial matches that start in the middle of the words. 
				 * The first list is sorted on count (the number of emails sent to this 
				 * email address), name and finally on the email address. This is done 
				 * by a natural sort. When this first list already contains the maximum 
				 * number of returned items the second list needs no sorting. If it has 
				 * less, then the second list is sorted and included in the first list 
				 * as well. At the end the final list is sorted on name and email again.
				 * 
				 */
				$l_iMaxNumListItems = 10;
				$l_aSortedList = Array();
				usort($l_aResult[0], Array($this, 'cmpSortResultList'));
				for($i = 0, $len = min($l_iMaxNumListItems, count($l_aResult[0])); $i < $len; $i++){
					$l_aSortedList[] = $l_aResult[0][$i];
				}
				if(count($l_aSortedList) < $l_iMaxNumListItems){
					$l_iMaxNumRemainingListItems = $l_iMaxNumListItems - count($l_aSortedList);
					usort($l_aResult[1], Array($this, 'cmpSortResultList'));
					for($i = 0, $len = min($l_iMaxNumRemainingListItems, count($l_aResult[1])); $i < $len; $i++){
						$l_aSortedList[] = $l_aResult[1][$i];
					}
				}

				$recipientList = Array();
				foreach($l_aSortedList as $index => $recipient) {
					$recipient['id'] = count($recipientList) + 1;
					$recipientList[] = $recipient;
				}
			}

			$data = Array(
				'query' => $action["query"],
				'results' => $recipientList
			);
		} else {
			$data = Array(
				'query' => $action["query"],
				'results' => Array()
			);
		}

		return $data;
	}
}
?>
