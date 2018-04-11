<?php

/**
 * DownloadAttachment
 *
 * A class to manage downloading of attachments from message, additionally
 * this class can be used to download inline images from message as well.
 *
 * Main reason to create this class is to not pollute the global namespace.
 */
class DownloadAttachment
{
	/**
	 * Resource of the MAPIStore which holds the message which contains attachments
	 * This will be used to get MAPIMessage resource to open attachment table and get attachments
	 */
	private $store;

	/**
	 * Entryid of the MAPIMessage that contains attachments, this is only needed when we are trying to access
	 * saved attachments from saved message
	 */
	private $entryId;

	/**
	 * Resource of MAPIMessage that contains attachments.
	 */
	private $message;

	/**
	 * Content disposition type for the attachment that will be sent with header with the attachment data
	 * Possible values are 'inline' and 'attachment'. When content-type is application/octet-stream and
	 * content disposition type is 'attachment' then browser will show dialog to save attachment as instead of
	 * directly displaying content inline.
	 */
	private $contentDispositionType;

	/**
	 * Attachment number of the attachment that should be downloaded. For normal attachments this will contain
	 * a single element array with numeric value as sequential attachment number, for attachments that are not saved
	 * in AttachmentTable of MAPIMessage yet (recently uploaded attachments) this will give single element array
	 * having value as a string in form of 'filename randomstring'. When accessing embedded messages this array can contain
	 * multiple elements indicating attachment numbers at each level, So value [0, 1] will indicate we want to download
	 * second attachment of first embedded message.
	 */
	private $attachNum;

	/**
	 * Attachment Content Id is used to download inline images of the MAPIMessage, When requesting inline images only
	 * content id is passed but if we are accessing inline image from embedded message then besides content id,
	 * attachment number is also passed to access embedded message.
	 */
	private $attachCid;

	/**
	 * A boolean value, set to false by default, to define if all the attachments are requested to be downloaded in a zip or not.
	 */
	private $allAsZip;

	/**
	 * A string that will be initialized with WebApp-specific and common-for-all file name for ZIP file.
	 */
	private $zipFileName;

	/**
	 * A random string that will be generated with every MAPIMessage instance to uniquely identify attachments that
	 * belongs to this MAPIMessage, this is mainly used to get recently uploaded attachments for MAPIMessage.
	 */
	private $dialogAttachments;

	/**
	 * A boolean value, set to false by default, to define if the message, of which the attachments are required to be wrapped in ZIP,
	 * is a sub message of other webapp item or not.
	 */
	private $isSubMessage;

	/**
	 * Entryid of the MAPIFolder to which the given attachment needs to be imported as webapp item.
	 */
	private $destinationFolder;

	/**
	 * A boolean value, set to false by default, to define if the attachment needs to be imported into folder as webapp item.
	 */
	private $import;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		$this->storeId = false;
		$this->entryId = false;
		$this->contentDispositionType = 'attachment';
		$this->attachNum = array();
		$this->attachCid = false;
		$this->allAsZip = false;
		$this->zipFileName = _('Attachments').'%s.zip';
		$this->messageSubject = '';
		$this->isSubMessage = false;
		$this->destinationFolder = false;
		$this->import = false;
	}

	/**
	 * Function will initialize data for this class object. it will also sanitize data
	 * for possible XSS attack because data is received in $_GET
	 */
	public function init($data)
	{
		if(isset($data['store'])) {
			$this->store = sanitizeValue($data['store'], '', ID_REGEX);
		}

		if(isset($data['entryid'])) {
			$this->entryId = sanitizeValue($data['entryid'], '', ID_REGEX);
		}

		if(isset($data['contentDispositionType'])) {
			$this->contentDispositionType = sanitizeValue($data['contentDispositionType'], 'attachment', STRING_REGEX);
		}

		if(!empty($data['attachNum'])) {
			/**
			 * if you are opening an already saved attachment then $data["attachNum"]
			 * will contain array of numeric index for that attachment (like 0 or 1 or 2)
			 *
			 * if you are opening a recently uploaded attachment then $data["attachNum"]
			 * will be a one element array and it will contain a string in "filename.randomstring" format
			 * like README.txtu6K6AH
			 */
			foreach($data['attachNum'] as $attachNum) {
				$num = sanitizeValue($attachNum, false, NUMERIC_REGEX);

				if($num === false) {
					// string is passed in attachNum so get it
					$num = sanitizeValue($attachNum, '', FILENAME_REGEX);

					if(!empty($num)) {
						array_push($this->attachNum, $num);
					}
				} else {
					array_push($this->attachNum, (int) $num);
				}
			}
		}

		if(isset($data['attachCid'])) {
			$this->attachCid = sanitizeValue($data['attachCid'], '', FILENAME_REGEX);
		}

		if(isset($data['AllAsZip'])) {
			$this->allAsZip = sanitizeValue($data['AllAsZip'], '', STRING_REGEX);
		}

		if(isset($data['subject'])) {
			// Remove characters that we cannot use in a filename
			$data['subject'] = preg_replace('/[^a-z0-9 ()]/mi', '_', $data['subject']);
			$this->messageSubject = sanitizeValue($data['subject'], '', FILENAME_REGEX);
		}

		if($this->allAsZip && isset($data['isSubMessage'])){
			$this->isSubMessage = sanitizeValue($data['isSubMessage'], '', STRING_REGEX);
		}

		if(isset($data['dialog_attachments'])) {
			$this->dialogAttachments = sanitizeValue($data['dialog_attachments'], '', STRING_REGEX);
		}

		if($this->store && $this->entryId) {
			$this->store = $GLOBALS['mapisession']->openMessageStore(hex2bin($this->store));
			$this->message = mapi_msgstore_openentry($this->store, hex2bin($this->entryId));
			
			// Decode smime signed messages on this message
			parse_smime($this->store, $this->message);
		}

		if(isset($data['destination_folder'])) {
			$this->destinationFolder = sanitizeValue($data['destination_folder'], '', ID_REGEX);
		}

		if(isset($data['import'])) {
			$this->import = sanitizeValue($data['import'], '', STRING_REGEX);
		}
	}

	/**
	 * Returns inline image attachment based on specified attachCid, To get inline image attachment
	 * we need to compare passed attachCid with PR_ATTACH_CONTENT_ID, PR_ATTACH_CONTENT_LOCATION or
	 * PR_ATTACH_FILENAME and if that matches then we can get that attachment.
	 * @param MAPIAttach $attachment (optional) embedded message attachment from where we need to get the inline image
	 * @return MAPIAttach attachment that is requested and will be sent to client
	 */
	public function getAttachmentByAttachCid($attachment = false)
	{
		// If the inline image was in a submessage, we have to open that first
		if($attachment !== false) {
			$this->message = mapi_attach_openobj($attachment);
		}

		/**
		 * restriction to find inline image attachment with matching cid passed
		 */
		$restriction =	Array(RES_OR,
							Array(
								Array(RES_CONTENT,
									Array(
										FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
										ULPROPTAG => PR_ATTACH_CONTENT_ID,
										VALUE => array(PR_ATTACH_CONTENT_ID => $this->attachCid)
									)
								),
								Array(RES_CONTENT,
									Array(
										FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
										ULPROPTAG => PR_ATTACH_CONTENT_LOCATION,
										VALUE => array(PR_ATTACH_CONTENT_LOCATION => $this->attachCid)
									)
								),
								Array(RES_CONTENT,
									Array(
										FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
										ULPROPTAG => PR_ATTACH_FILENAME,
										VALUE => array(PR_ATTACH_FILENAME => $this->attachCid)
									)
								)
							)
						);

		// Get the attachment table
		$attachTable = mapi_message_getattachmenttable($this->message);
		mapi_table_restrict($attachTable, $restriction, TBL_BATCH);
		$attachments = mapi_table_queryallrows($attachTable, Array(PR_ATTACH_NUM));

		if(count($attachments) > 0) {
			// there should be only one attachment
			$attachment = mapi_message_openattach($this->message, $attachments[0][PR_ATTACH_NUM]);
		}

		return $attachment;
	}

	/**
	 * Returns attachment based on specified attachNum, additionally it will also get embedded message
	 * if we want to get the inline image attachment.
	 * @return MAPIAttach embedded message attachment or attachment that is requested
	 */
	public function getAttachmentByAttachNum()
	{
		$attachment = false;

		$len = count($this->attachNum);

		// Loop through the attachNums, message in message in message ...
		for($index = 0; $index < $len - 1; $index++) {
			// Open the attachment
			$tempattach = mapi_message_openattach($this->message, $this->attachNum[$index]);
			if($tempattach) {
				// Open the object in the attachment
				$this->message = mapi_attach_openobj($tempattach);
			}
		}

		// open the attachment
		$attachment = mapi_message_openattach($this->message, $this->attachNum[$len - 1]);

		return $attachment;
	}

	/**
	 * Function will open passed attachment and generate response for that attachment to send it to client.
	 * This should only be used to download attachment that is already saved in MAPIMessage.
	 * @param MAPIAttach $attachment attachment which will be dumped to client side
	 * @param Boolean $inline inline attachment or not
	 * @return Response response to sent to client including attachment data
	 */
	public function downloadSavedAttachment($attachment, $inline = False)
	{
		// Check if the attachment is opened
		if($attachment) {
			// Get the props of the attachment
			$props = mapi_attach_getprops($attachment, array(PR_ATTACH_FILENAME, PR_ATTACH_LONG_FILENAME, PR_ATTACH_MIME_TAG, PR_DISPLAY_NAME, PR_ATTACH_METHOD, PR_ATTACH_CONTENT_ID));
			// Content Type
			$contentType = 'application/octet-stream';
			// Filename
			$filename = 'ERROR';

			// Set filename
			if ($inline) {
				/*
				 * Inline attachments are set to "inline.txt" by Kopano Core, see inetmapi/VMIMEToMAPI.cpp and search for inline.txt.
				 * Kopano Core would have to extract the alt/title tag from the img tag when converting it to MAPI. Since it
				 * does not handle this, set the filename to CONTENT_ID plus mime tag.
				 */
				$tags = explode('/', $props[PR_ATTACH_MIME_TAG]);
				// IE 11 is weird, when a user renames the file it's not saved as in image, when
				// the filename is "test.jpeg", but it works when it's "test.jpg".
				$filename = $props[PR_ATTACH_CONTENT_ID] . '.' . str_replace('jpeg', 'jpg', $tags[1]);
			} else if(isset($props[PR_ATTACH_LONG_FILENAME])) {
				$filename = $props[PR_ATTACH_LONG_FILENAME];
			} else if(isset($props[PR_ATTACH_FILENAME])) {
				$filename = $props[PR_ATTACH_FILENAME];
			} else if(isset($props[PR_DISPLAY_NAME])) {
				$filename = $props[PR_DISPLAY_NAME];
			}

			// Set content type if available, otherwise it will be default to application/octet-stream
			if(isset($props[PR_ATTACH_MIME_TAG])) {
				$contentType = $props[PR_ATTACH_MIME_TAG];
			}
			
			$contentIsSentAsUTF8 = false;
			// For ODF files we must change the content type because otherwise
			// IE<11 cannot properly read it in the xmlhttprequest object
			// NOTE: We only need to check for IE<=10, so no need to check for TRIDENT (IE11)
			preg_match('/MSIE (.*?);/', $_SERVER['HTTP_USER_AGENT'], $matches);
			if (count($matches)>1){
				if ( strpos($contentType, 'application/vnd.oasis.opendocument.') !== false ){
					$contentType = 'text/plain; charset=UTF-8';
					$contentIsSentAsUTF8 = true;
				}
			}	
			
			// Set the headers
			header('Pragma: public');
			header('Expires: 0'); // set expiration time
			header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
			header('Content-Disposition: ' . $this->contentDispositionType . '; filename="' . addslashes(browserDependingHTTPHeaderEncode($filename)) . '"');
			header('Content-Type: ' . $contentType);
			header('Content-Transfer-Encoding: binary');

			// Open a stream to get the attachment data
			$stream = mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, 0);
			$stat = mapi_stream_stat($stream);
			// File length
			header('Content-Length: ' . $stat['cb']);

			// Read the attachment content from the stream
			$body = '';
			for($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
				$body .= mapi_stream_read($stream, BLOCK_SIZE);
			}
			
			// Convert the content to UTF-8 if we want to send it like that
			if ( $contentIsSentAsUTF8 ){
				$body = mb_convert_encoding($body, 'UTF-8');
			}
			echo $body;
		}
	}

	/**
	 * Helper function to configure header information which is required to send response as a ZIP archive
	 * containing all the attachments.
	 * @param String $randomZipName A random zip archive name.
	 */
	public function sendZipResponse($randomZipName)
	{
		$subject = isset($this->messageSubject) ? ' '.$this->messageSubject : '';
		
		// Set the headers
		header('Pragma: public');
		header('Expires: 0'); // set expiration time
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
		header('Content-Disposition: ' . $this->contentDispositionType . '; filename="' . addslashes(browserDependingHTTPHeaderEncode(sprintf($this->zipFileName, $subject))) . '"');
		header('Content-Transfer-Encoding: binary');
		header('Content-Type:  application/zip');
		header('Content-Length: ' . filesize($randomZipName));

		// Send the actual response as ZIP file
		readfile($randomZipName);

		// Remove the zip file to avoid unnecessary disk-space consumption
		unlink($randomZipName);
	}

	/**
	 * Function will open all attachments of message and prepare a ZIP file response for that attachment to send it to client.
	 * This should only be used to download attachment that is already saved in MAPIMessage.
	 * @param AttachmentState $attachment_state Object of AttachmentState class.
	 * @param ZipArchive $zip ZipArchive object.
	 */
	public function addAttachmentsToZipArchive($attachment_state, $zip)
	{
		// Get all the attachments from message
		$attachmentTable = mapi_message_getattachmenttable($this->message);
		$attachments = mapi_table_queryallrows($attachmentTable, array(PR_ATTACH_NUM, PR_ATTACH_METHOD));

		foreach($attachments as $attachmentRow) {
			if($attachmentRow[PR_ATTACH_METHOD] !== ATTACH_EMBEDDED_MSG) {
				$attachment = mapi_message_openattach($this->message, $attachmentRow[PR_ATTACH_NUM]);

				// Prevent inclusion of inline attachments and contact photos into ZIP
				if(!$attachment_state->isInlineAttachment($attachment) && !$attachment_state->isContactPhoto($attachment)){
					$props = mapi_attach_getprops($attachment, array(PR_ATTACH_LONG_FILENAME));

					// Open a stream to get the attachment data
					$stream = mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, 0);
					$stat = mapi_stream_stat($stream);

					// Get the stream
					$datastring = '';
					for($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
						$datastring .=  mapi_stream_read($stream, BLOCK_SIZE);
					}

					// Add file into zip by stream
					$zip->addFromString($props[PR_ATTACH_LONG_FILENAME], $datastring);
				}
			}

			// Go for adding unsaved attachments in ZIP, if any.
			// This situation arise while user upload attachments in draft.
			$attachmentFiles = $attachment_state->getAttachmentFiles($this->dialogAttachments);
			if($attachmentFiles){
				$this->addUnsavedAttachmentsToZipArchive($attachment_state, $zip);
			}
		}
	}

	/**
	 * Function will send attachment data to client side.
	 * This should only be used to download attachment that is recently uploaded and not saved in MAPIMessage.
	 * @return Response response to sent to client including attachment data
	 */
	public function downloadUnsavedAttachment()
	{
		// return recently uploaded file 
		$attachment_state = new AttachmentState();
		$attachment_state->open();

		// there will be only one value in attachNum so directly access 0th element of it
		$tmpname = $attachment_state->getAttachmentPath($this->attachNum[0]);
		$fileinfo = $attachment_state->getAttachmentFile($this->dialogAttachments, $this->attachNum[0]);

		// Check if the file still exists
		if (is_file($tmpname)) {
			// Set the headers
			header('Pragma: public');
			header('Expires: 0'); // set expiration time
			header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
			header('Content-Disposition: ' . $this->contentDispositionType . '; filename="' . addslashes(browserDependingHTTPHeaderEncode($fileinfo['name'])) . '"');
			header('Content-Transfer-Encoding: binary');
			header('Content-Type: application/octet-stream');
			header('Content-Length: ' . filesize($tmpname));

			// Open the uploaded file and print it
			$file = fopen($tmpname, 'r');
			fpassthru($file);
			fclose($file);
		}
		$attachment_state->close();
	}

	/**
	 * Function will send all the attachments to client side wrapped in a ZIP file.
	 * This should only be used to download all the attachments that are recently uploaded and not saved in MAPIMessage.
	 * @param AttachmentState $attachment_state Object of AttachmentState class.
	 * @param ZipArchive $zip ZipArchive object.
	 */
	public function addUnsavedAttachmentsToZipArchive($attachment_state, $zip)
	{
		//Get recently uploaded attachment files
		$attachmentFiles = $attachment_state->getAttachmentFiles($this->dialogAttachments);

		foreach ($attachmentFiles as $fileName => $fileInfo) {
			$filePath = $attachment_state->getAttachmentPath($fileName);
			// Avoid including contact photo and embedded messages in ZIP
			if ($fileInfo['sourcetype'] !== 'embedded' && $fileInfo['sourcetype'] !== 'contactphoto') {
				$zip->addFile($filePath, $fileInfo['name']);
			}
		}
	}

	/**
	 * Function will get the attachement and import it to the given MAPIFolder as webapp item.
	 */
	public function importAttachment()
	{
		$addrBook = $GLOBALS['mapisession']->getAddressbook();
		try {
			$destFolder = mapi_msgstore_openentry($this->store, hex2bin($this->destinationFolder));
		} catch(Exception $e) {
			// Try to find the folder from shared stores in case if it is not found in current user's store
			$destFolder = mapi_msgstore_openentry($GLOBALS['operations']->getOtherStoreFromEntryid($this->destinationFolder), hex2bin($this->destinationFolder));
		}

		$newMessage = mapi_folder_createmessage($destFolder);
		$attachment = $this->getAttachmentByAttachNum();
		$attachmentProps = mapi_attach_getprops($attachment, array(PR_ATTACH_LONG_FILENAME));
		$attachmentStream = streamProperty($attachment, PR_ATTACH_DATA_BIN);

		switch(pathinfo($attachmentProps[PR_ATTACH_LONG_FILENAME], PATHINFO_EXTENSION))
		{
			case 'eml':
				if ($this->isBroken($attachmentStream)) {
					throw new ZarafaException(_("Eml is corrupted"));
				} else {
					try {
						// Convert an RFC822-formatted e-mail to a MAPI Message
						$ok = mapi_inetmapi_imtomapi($GLOBALS['mapisession']->getSession(), $this->store, $addrBook, $newMessage, $attachmentStream, array());
					} catch(Exception $e) {
						throw new ZarafaException(_("The eml Attachment is not imported successfully"));
					}
				}
				break;

			case 'vcf':
				try {
					// Convert an RFC6350-formatted vCard to a MAPI Contact
					$ok = mapi_vcftomapi($GLOBALS['mapisession']->getSession(), $this->store, $newMessage, $attachmentStream);
				} catch(Exception $e) {
					throw new ZarafaException(_("The vcf attachment is not imported successfully"));
				}
				break;
		}

		if($ok === true) {
			mapi_message_savechanges($newMessage);
			$storeProps = mapi_getprops($this->store, array(PR_ENTRYID));
			$destinationFolderProps = mapi_getprops($destFolder, array(PR_PARENT_ENTRYID, PR_CONTENT_UNREAD));

			$return = Array(
				// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
				'success' => true,
				'zarafa' => Array(
					sanitizeGetValue('module', '', STRING_REGEX) => Array(
						sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
							'update' => Array(
								'success'=> true
							)
						)
					),
					'hierarchynotifier' => Array(
						'hierarchynotifier1' => Array(
							'folders' => Array(
								'item' => Array(
									0 => Array(
										'entryid' => $this->destinationFolder,
										'parent_entryid' => bin2hex($destinationFolderProps[PR_PARENT_ENTRYID]),
										'store_entryid' => bin2hex($storeProps[PR_ENTRYID]),
										'props' => Array(
											'content_unread' => $destinationFolderProps[PR_CONTENT_UNREAD] + 1
										)
									)
								)
							)
						)
					)
				)
			);

			echo json_encode($return);
		} else {
			throw new ZarafaException(_("Attachment is not imported successfully"));
		}
	}

	/**
	 * Check if the attached eml is corrupted or not
	 * @param String $attachment Content fetched from PR_ATTACH_DATA_BIN property of an attachment.
	 * @return True if eml is broken, false otherwise.
	 */
	public function isBroken($attachment)
	{
		// Get header part to process further
		$splittedContent = preg_split("/\r?\n\r?\n/", $attachment);

		// Fetch raw header
		if (preg_match_all('/([^:]+): ?.*\n/', $splittedContent[0], $matches)) {
			$rawHeaders = $matches[1];
		}

		// Compare if necessary headers are present or not
		if (isset($rawHeaders) && in_array('From', $rawHeaders) && in_array('Date', $rawHeaders)) {
			return false;
		}

		return true;
	}

	/**
	 * Generic function to check passed data and decide which type of attachment is requested.
	 */
	public function download()
	{
		$attachment = false;

		// Check if all attachments are requested to be downloaded as ZIP
		if ($this->allAsZip) {
			$attachment_state = new AttachmentState();
			$attachment_state->open();

			// Generate random ZIP file name at default temporary path of PHP
			$randomZipName = tempnam(sys_get_temp_dir(), 'zip');

			// Create an open zip archive.
			$zip = new ZipArchive();
			$result = $zip->open($randomZipName, ZipArchive::CREATE);

			if ($result === TRUE) {
				// Check if attachments are of saved message.
				// Only saved message has the entryid configured.
				if($this->entryId) {
					// Check if the requested attachment(s) are of an embedded message
					if($this->isSubMessage){
						// Loop through the attachNums, message in message in message ...
						for($index = 0, $len = count($this->attachNum); $index < $len - 1; $index++) {
							// Open the attachment
							$tempattach = mapi_message_openattach($this->message, $this->attachNum[$index]);
							if($tempattach) {
								// Open the object in the attachment
								$this->message = mapi_attach_openobj($tempattach);
							}
						}
					}
					$this->addAttachmentsToZipArchive($attachment_state, $zip);
				} else {
					$this->addUnsavedAttachmentsToZipArchive($attachment_state, $zip);
				}
			} else {
				// Throw exception if ZIP is not created successfully
				throw new ZarafaException(_("ZIP is not created successfully"));
			}

			$zip->close();

			$this->sendZipResponse($randomZipName);
			$attachment_state->close();
		// check if inline image is requested
		} else if($this->attachCid) {
			// check if the inline image is in a embedded message
			if(count($this->attachNum) > 0) {
				// get the embedded message attachment
				$attachment = $this->getAttachmentByAttachNum();
			}

			// now get the actual attachment object that should be sent back to client
			$attachment = $this->getAttachmentByAttachCid($attachment);

			// no need to return anything here function will echo all the output
			$this->downloadSavedAttachment($attachment, true);

		} else if(count($this->attachNum) > 0) {
			// check if the attachment needs to be imported
			if ($this->import) {
				$this->importAttachment();
				return;
			}

			// check if temporary unsaved attachment is requested
			if(is_string($this->attachNum[0])) {
				$this->downloadUnsavedAttachment();
			} else {
				// normal saved attachment is requested, so get it
				$attachment = $this->getAttachmentByAttachNum();

				if($attachment === false) {
					// something terrible happened and we can't continue
					return;
				}

				// no need to return anything here function will echo all the output
				$this->downloadSavedAttachment($attachment);
			}
		} else {
			throw new ZarafaException(_("Attachments can not be downloaded"));
		}
	}

	/**
	 * Function will encode all the necessary information about the exception
	 * into JSON format and send the response back to client.
	 *
	 * @param object $exception Exception object.
	 */
	function handleSaveMessageException($exception)
	{
		$return = array();

		// MAPI_E_NOT_FOUND exception contains generalize exception message.
		// Set proper exception message as display message should be user understandable.
		if($exception->getCode() == MAPI_E_NOT_FOUND) {
			$exception->setDisplayMessage(_('Could not find attachment.'));
		}

		// Set the headers
		header('Expires: 0'); // set expiration time
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

		// Set Content Disposition header
		header('Content-Disposition: inline');
		// Set content type header
		header('Content-Type: text/plain');

		//prepare exception response according to exception class
		if($exception instanceof MAPIException) {
			$return = array(
				'success' => false,
				'zarafa' => array(
					'error' => array(
						'type' => ERROR_MAPI,
						'info' => array(
							'hresult' => $exception->getCode(),
							'hresult_name' => get_mapi_error_name($exception->getCode()),
							'file' => $exception->getFileLine(),
							'display_message' => $exception->getDisplayMessage()
						)
					)
				)
			);
		} else if($exception instanceof ZarafaException) {
			$return = array(
				'success' => false,
				'zarafa' => array(
					'error' => array(
						'type' => ERROR_ZARAFA,
						'info' => array(
							'file' => $exception->getFileLine(),
							'display_message' => $exception->getDisplayMessage(),
							'original_message' => $exception->getMessage()
						)
					)
				)
			);
		} else if($exception instanceof BaseException) {
			$return = array(
				'success' => false,
				'zarafa' => array(
					'error' => array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'file' => $exception->getFileLine(),
							'display_message' => $exception->getDisplayMessage(),
							'original_message' => $exception->getMessage()
						)
					)
				)
			);
		} else {
			$return = array(
				'success' => false,
				'zarafa' => array(
					'error' => array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'display_message' => _('Operation failed'),
							'original_message' => $exception->getMessage()
						)
					)
				)
			);
		}
		echo json_encode($return);
	}
}

// create instance of class to download attachment
$attachInstance = new DownloadAttachment();

try{
	// initialize variables
	$attachInstance->init($_GET);

	// download attachment
	$attachInstance->download();
} catch (Exception $e) {
	$attachInstance->handleSaveMessageException($e);
}
?>
