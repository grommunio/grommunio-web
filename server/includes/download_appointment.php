<?php
// required to handle php errors
require_once(__DIR__ . '/exceptions/class.ZarafaErrorException.php');
require_once(__DIR__ . '/download_base.php');

/**
 * DownloadAppointment
 *
 * A class to manage downloading of appointment as a file,
 * it will generate the appointment as RFC2445-formatted ics stream.
 * It extends the DownloadBase class.
 */
class DownloadAppointment extends DownloadBase
{
	/**
	 * Function get appointment using respective mapi function.
	 * It also sends the ics file to the client.
	 */
	function downloadAppointmentAsFile()
	{
		if($this->message && $this->store) {
			// Get addressbook for current session
			$addrBook = $GLOBALS['mapisession']->getAddressbook();

			// get message properties.
			$messageProps = mapi_getprops($this->message, array(PR_SUBJECT));

			// Read the appointment as RFC2445-formatted ics stream.
			$appointmentStream = mapi_mapitoical($GLOBALS['mapisession']->getSession(), $addrBook, $this->message, array());

			$filename = (!empty($messageProps[PR_SUBJECT])) ? $messageProps[PR_SUBJECT] : _('Untitled');
			$filename .= '.ics';

			$this->setNecessaryHeaders($filename, strlen($appointmentStream));

			$split = str_split($appointmentStream, BLOCK_SIZE);
			foreach ($split as $s) echo $s;
		}
	}

	/**
	 * Generic function to check received data and download ics file.
	 */
	public function download()
	{
		$this->downloadAppointmentAsFile();
	}
}

// create instance of class to download message as file
$messageInstance = new DownloadAppointment();

try {
	// initialize variables
	$messageInstance->init($_GET);

	// download message
	$messageInstance->download();
} catch (Exception $e) {
	$messageInstance->handleSaveMessageException($e);
}
?>
