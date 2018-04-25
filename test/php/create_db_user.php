<?php
require_once("/usr/share/kopano/php/mapi/mapi.util.php");
require_once("/usr/share/kopano/php/mapi/mapidefs.php");
require_once("/usr/share/kopano/php/mapi/mapitags.php");
require_once("/usr/share/kopano/php/mapi/mapicode.php");
require_once("/usr/share/kopano/php/mapi/mapiguid.php");

require_once("config.php");

for($i = 1; $i < 6; $i++) {
	$user = constant("KOPANO_USER${i}_NAME");
	$pass = constant("KOPANO_USER${i}_PASSWORD");

	$email_address = constant("KOPANO_USER${i}_EMAIL_ADDRESS");
	$display_name = constant("KOPANO_USER${i}_DISPLAY_NAME");

	shell_exec("kopano-admin -c $user -p $pass -e $email_address -f '$display_name'");
	shell_exec("kopano-admin --create-store $user");
}

# Public store
shell_exec("kopano-admin -s");

shell_exec("kopano-admin -g " . KOPANO_GROUP1_NAME . " -e " . KOPANO_GROUP1_EMAIL_ADDRESS);
shell_exec("kopano-admin -b " . KOPANO_USER5_NAME . " -i " . KOPANO_GROUP1_NAME);
?>
