<?php
	/**
	* Upload Attachment
	* This file is used to upload an file.
	*/
	// required to handle php errors
	require_once(__DIR__ . '/exceptions/class.ZarafaErrorException.php');

	// Get Attachment data from state
	$attachment_state = new AttachmentState();
	$attachment_state->open();

	// For legacy browsers we don't send the Content-type header, because we use a form to do the upload in those browsers
	// instead of ajax communication. The header would trigger the browser's Download dialog
	if ( !preg_match('/(?i)msie [1-9]/',$_SERVER['HTTP_USER_AGENT'])){
		header('Content-Type: application/json; charset=utf-8');
	}	

	try {
		// Check if dialog_attachments is set
		if(isset($_REQUEST['dialog_attachments'])) {
			// Check if attachments have been uploaded
			if(isset($_FILES['attachments']) && is_array($_FILES['attachments'])) {
				$FILES = Array();

				if(isset($_FILES['attachments']['name']) && is_array($_FILES['attachments']['name'])){
					// Parse all information from the updated files,
					// validate the contents and add it to the $FILES array.
					foreach($_FILES['attachments']['name'] as $key => $name){
						$FILE = Array(
							'name'     => $_FILES['attachments']['name'][$key],
							'type'     => $_FILES['attachments']['type'][$key],
							'tmp_name' => $_FILES['attachments']['tmp_name'][$key],
							'error'    => $_FILES['attachments']['error'][$key],
							'size'     => $_FILES['attachments']['size'][$key]
						);

						/**
						 * content-type sent by browser for eml and ics attachments will be
						 * message/rfc822 and text/calendar respectively, but these content types are
						 * used for message-in-message embedded objects, so we have to send it as
						 * application/octet-stream.
						 */
						if ($FILE['type'] == 'message/rfc822' || $FILE['type'] == 'text/calendar') {
							$FILE['type'] = 'application/octet-stream';
						}

						// validate the FILE object to see if the size doesn't exceed
						// the configured MAX_FILE_SIZE
						if (isset($FILE['size']) && !(isset($_POST['MAX_FILE_SIZE']) && $FILE['size'] > $_POST['MAX_FILE_SIZE'])) {
							$FILES[] = $FILE;
						}
					}
				}

				// Go over all files and register them
				$returnfiles = array();

				foreach($FILES as $FILE) {
					// Parse the filename, strip it from
					// any illegal characters.
					$filename = mb_basename(stripslashes($FILE['name']));

					// set sourcetype as default if sourcetype is unset.
					$sourcetype = isset($_POST['sourcetype']) ? $_POST['sourcetype'] : 'default';

					$attachID = uniqid();
					// Move the uploaded file into the attachment state
					$attachTempName = $attachment_state->addUploadedAttachmentFile($_REQUEST['dialog_attachments'], $filename, $FILE['tmp_name'], array(
						'name'       => $filename,
						'size'       => $FILE['size'],
						'type'       => $FILE['type'],
						'sourcetype' => $sourcetype,
						'attach_id'  => $attachID
					));

					// Allow hooking in to handle uploads in plugins
					$GLOBALS['PluginManager']->triggerHook('server.upload_attachment.upload', array(
						'tmpname'  => $attachment_state->getAttachmentPath($attachTempName),
						'name' => $filename,
						'size' => $FILE['size'],
						'sourcetype' => $sourcetype,
						'returnfiles' =>& $returnfiles,
						'attach_id'   => $attachID
					));

					if($sourcetype === 'contactphoto') {
						$returnfiles[] = Array(
							'props' => Array(
								'attach_num' => -1,
								'attachment_contactphoto' => true,
								'tmpname' => $attachTempName,
								'attach_id' => $attachID,
								'name' => $filename,
								'size' => $FILE['size']
							)
						);
					} else if($sourcetype === 'default') {
						$returnfiles[] = Array(
							'props' => Array(
								'attach_num' => -1,
								'tmpname' => $attachTempName,
								'attach_id' => $attachID,
								'name' => $filename,
								'size' => $FILE['size']
							)
						);
					} else {
						// Backwards compatibility for Plugins (S/MIME)
						$lastKey = count($returnfiles) - 1;
						if ($lastKey >= 0) {
							$returnfiles[$lastKey]['props']['attach_id'] = $attachID;
						}
					}
				}

				$return = Array(
					// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
					'success' => true,
					'zarafa' => Array(
						sanitizeGetValue('module', '', STRING_REGEX) => Array(
							sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
								'update' => Array(
									'item'=> $returnfiles
								)
							)
						)
					)
				);

				echo json_encode($return);
			} else if(isset($_POST['deleteattachment'])) { // Delete uploaded file
				$num = sanitizePostValue('attach_num', false, NUMERIC_REGEX);

				if($num === false) {
					// string is passed in attachNum so get it
					// Parse the filename, strip it from any illegal characters
					$num = mb_basename(stripslashes(sanitizePostValue('attach_num', '', FILENAME_REGEX)));

					// Delete the file instance and unregister the file
					$attachment_state->deleteUploadedAttachmentFile($_REQUEST['dialog_attachments'], $num);
				} else {
					// Set the correct array structure
					$attachment_state->addDeletedAttachment($_REQUEST['dialog_attachments'], $num);
				}

				$return = Array(
					// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
					'success' => true,
					'zarafa' => Array(
						sanitizeGetValue('module', '', STRING_REGEX) => Array(
							sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
								'delete' => Array(
									'success'=> true
								)
							)
						)
					)
				);

				echo json_encode($return);
			} else if (isset($_POST['entryid'])) {	// Check for adding of embedded attachments
				$attachID = uniqid();
				$attachTampName = $attachment_state->addEmbeddedAttachment($_REQUEST['dialog_attachments'], array(
					'entryid' => sanitizePostValue('entryid', '', ID_REGEX),
					'store_entryid' => sanitizePostValue('store_entryid', '', ID_REGEX),
					// indicate that this is actually an embedded attachment
					'sourcetype' => 'embedded',
					'attach_id' => $attachID,
				));

				$returnfiles[] = Array(
					'props' => Array(
						'attach_num' => -1,
						'tmpname' => $attachTampName,
						'attach_id' => $attachID,
						// we are not using this data here, so we can safely use $_POST directly without any sanitization
						// this is only needed to identify response for a particular attachment record on client side
						'name' => $_POST['name']
					)
				);

				$return = Array(
					// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
					'success' => true,
					'zarafa' => Array(
						sanitizeGetValue('module', '', STRING_REGEX) => Array(
							sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
								'update' => Array(
									'item'=> $returnfiles
								)
							)
						)
					)
				);

				echo json_encode($return);
			}
		} else if($_GET && isset($_GET['attachment_id'])) { // this is to upload the file to server when the doc is send via OOo
			$providedFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $_GET['attachment_id'];

			// check wheather the doc is already moved
			if (file_exists($providedFile)) {
				$filename = mb_basename(stripslashes($_GET['name']));

				// Move the uploaded file to the session
				$attachment_state->addProvidedAttachmentFile($_REQUEST['attachment_id'], $filename, $providedFile, array(
					'name'       => $filename,
					'size'       => filesize($tmpname),
					'type'       => mime_content_type($tmpname),
					'sourcetype' => 'default'
				));
			}else{
				// Check if no files are uploaded with this attachmentid
				$attachment_state->clearAttachmentFiles($_GET['attachment_id']);
			}
		}
	} catch (ZarafaErrorException $e) {
		/**
		 * Return Exception message only if uploading attachment is done through
		 * attachment dialog, not by drag n drop.
		 */
		if(sanitizeGetValue('load', '', STRING_REGEX) == 'upload_attachment'){
			$return = Array(
				// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
				'success' => false,
				'zarafa' => Array(
					sanitizeGetValue('module', '', STRING_REGEX) => Array(
						sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
							'error' => array(
								'type' => ERROR_GENERAL,
								'info' => array(
									'file' => $e->getFileLine(),
									'display_message' => _('Could not upload attachment.'),
									'original_message' => $e->getMessage()
								)
							)
						)
					)
				)
			);

			echo json_encode($return);
		}
	}

	$attachment_state->close();
?>
