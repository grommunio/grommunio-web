<?php
// required to handle php errors
require_once(__DIR__ . '/exceptions/class.ZarafaErrorException.php');
require_once(__DIR__ . '/download_base.php');

/**
 * DownloadContact
 *
 * A class to manage downloading of contact as a file,
 * it will generate the contact as RFC6350-formatted vCard stream.
 * It extends the DownloadBase class.
 */
class DownloadContact extends DownloadBase
{
	/**
	 * Function get contact-stream using respective mapi function.
	 * It also sends the vcf file to the client.
	 */
	function downloadContactAsFile()
	{
		if($this->message && $this->store) {
			// Get addressbook for current session
			$addrBook = $GLOBALS['mapisession']->getAddressbook();

			// get message properties.
			$messageProps = mapi_getprops($this->message, array(PR_DISPLAY_NAME));

			// Read the contact as RFC6350-formatted vCard stream.
			$contactStream = mapi_mapitovcf($GLOBALS['mapisession']->getSession(), $addrBook, $this->message, array());

			$filename = (!empty($messageProps[PR_DISPLAY_NAME])) ? $messageProps[PR_DISPLAY_NAME] : _('Untitled');
			$filename .= '.vcf';

			$this->setNecessaryHeaders($filename, strlen($contactStream));

			$split = str_split($contactStream, BLOCK_SIZE);
			foreach ($split as $s) echo $s;
		}
	}

	/**
	 * Generic function to check received data and download vcf file.
	 */
	public function download()
	{
		// download contact as file
		$this->downloadContactAsFile();
	}
}

// create instance of class to download message as file
$messageInstance = new DownloadContact();

try {
	// initialize variables
	$messageInstance->init($_GET);

	// download message
	$messageInstance->download();
} catch (Exception $e) {
	$messageInstance->handleSaveMessageException($e);
}
?>
