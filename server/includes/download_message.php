<?php
// required to handle php errors
require_once(__DIR__ . '/exceptions/class.ZarafaErrorException.php');
require_once(__DIR__ . '/download_base.php');
/**
 * DownloadMessage
 *
 * A class to manage downloading of message as a file,
 * it will generate the message as RFC822-formatted e-mail stream.
 * It extends the DownloadBase class.
  */
class DownloadMessage extends DownloadBase
{
	/**
	 * Function get message-stream using respective mapi function.
	 * It also sends the eml file to the client.
	 */
	function downloadMessageAsFile()
	{
		if($this->message && $this->store) {
			// get message properties.
			$messageProps = mapi_getprops($this->message, array(PR_SUBJECT, PR_EC_IMAP_EMAIL, PR_MESSAGE_CLASS));

			$stream = $this->getEmlStream($messageProps);

			$filename = (!empty($messageProps[PR_SUBJECT])) ? $messageProps[PR_SUBJECT] : _('Untitled');
			$filename .= '.eml';

			// Set the file length
			$stat = mapi_stream_stat($stream);

			$this->setNecessaryHeaders($filename, $stat['cb']);

			// Read whole message and echo it.
			for($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
				// Print stream
				echo mapi_stream_read($stream, BLOCK_SIZE);

				// Need to discard the buffer contents to prevent memory
				// exhaustion while echoing large content.
				ob_flush();
			}
		}
	}

	/**
	 * Function will create a ZIP archive and add eml files into the same.
	 * It also configures necessary header information which required to send the ZIP file to client.
	 * Send ZIP to the client if all the requested eml files included successfully into the same.
	 */
	function downloadMessageAsZipFile()
	{
		if($this->store) {
			// Generate random ZIP file name at default temporary path of PHP
			$randomZipName = tempnam(sys_get_temp_dir(), 'zip');

			// Create an open zip archive.
			$zip = new ZipArchive();
			$result = $zip->open($randomZipName, ZipArchive::CREATE);

			if ($result === TRUE) {
				for($index = 0, $count = count($this->entryIds); $index < $count; $index++) {

					$this->message = mapi_msgstore_openentry($this->store, hex2bin($this->entryIds[$index]));

					// get message properties.
					$messageProps = mapi_getprops($this->message, array(PR_SUBJECT, PR_EC_IMAP_EMAIL, PR_MESSAGE_CLASS));

					$stream = $this->getEmlStream($messageProps);
					$stat = mapi_stream_stat($stream);

					// Get the stream
					$datastring = '';
					for($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
						$datastring .=  mapi_stream_read($stream, BLOCK_SIZE);
						// Need to discard the buffer contents to prevent memory
						// exhaustion.
						ob_flush();
					}

					$filename = (!empty($messageProps[PR_SUBJECT])) ? $messageProps[PR_SUBJECT] : _('Untitled');
					$filename .= '.eml';

					$filename = $this->handleDuplicateFileNames($filename);
					// Remove slashes to prevent unwanted directories to be created in the zip file.
					$filename = str_replace('\\', '_', $filename);
					$filename = str_replace('/', '_', $filename);

					// Add file into zip by stream
					$zip->addFromString($filename, $datastring);
				}
			} else {
				$zip->close();
				// Remove the zip file to avoid unnecessary disk-space consumption
				unlink($randomZipName);

				// Throw exception if ZIP is not created successfully
				throw new ZarafaException(_("ZIP is not created successfully"));
			}

			$zip->close();

			// Set the headers
			header('Pragma: public');
			header('Expires: 0'); // set expiration time
			header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
			header('Content-Disposition: attachment; filename="' . addslashes(browserDependingHTTPHeaderEncode(_("Messages").date(" d-m-Y").".zip")) . '"');
			header('Content-Transfer-Encoding: binary');
			header('Content-Type:  application/zip');
			header('Content-Length: ' . filesize($randomZipName));

			// Send the actual response as ZIP file
			readfile($randomZipName);

			// Remove the zip file to avoid unnecessary disk-space consumption
			unlink($randomZipName);
		}
	}

	/**
	 * Function will obtain stream from the message, For email messages it will open email as
	 * inet object and get the stream content as eml format, when user has IMAP enabled.
	 * The below mentioned properties are configured with the whole message as a stream in it, while IMAP is enabled :
	 * PR_EC_IMAP_EMAIL
	 * PR_EC_IMAP_EMAIL_SIZE
	 * PR_EC_IMAP_BODY
	 * PR_EC_IMAP_BODYSTRUCTURE
	 * @param Array $messageProps Properties of this particular message.
	 * @return Stream $stream The eml stream obtained from message.
	 */
	function getEmlStream($messageProps)
	{
		// If RFC822-formatted stream is already available in PR_EC_IMAP_EMAIL property
		// than directly use it, generate otherwise.
		if(isset($messageProps[PR_EC_IMAP_EMAIL]) || propIsError(PR_EC_IMAP_EMAIL, $messageProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
			// Stream the message to properly get the PR_EC_IMAP_EMAIL property
			$stream = mapi_openproperty($this->message, PR_EC_IMAP_EMAIL, IID_IStream, 0, 0);
		} else {
			// Get addressbook for current session
			$addrBook = $GLOBALS['mapisession']->getAddressbook();

			// Read the message as RFC822-formatted e-mail stream.
			$stream = mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $addrBook, $this->message, array());
		}

		return $stream;
	}

	/**
	 * Check received data and decide either the eml file or
	 * ZIP file is requested to be downloaded.
	 */
	public function download()
	{
		if($this->allAsZip){
			// download multiple eml messages in a ZIP file
			$this->downloadMessageAsZipFile();
		} else {
			// download message as file
			$this->downloadMessageAsFile();
		}
	}
}

// create instance of class to download message as file
$messageInstance = new DownloadMessage();

try {
	// initialize variables
	$messageInstance->init($_GET);

	// download message
	$messageInstance->download();
} catch (Exception $e) {
	$messageInstance->handleSaveMessageException($e);
}
?>
