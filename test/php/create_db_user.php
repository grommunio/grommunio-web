<?php

require_once "config.php";

for ($i = 1; $i < 6; ++$i) {
	$user = constant("GROMMUNIO_USER{$i}_NAME");
	$pass = constant("GROMMUNIO_USER{$i}_PASSWORD");

	$email_address = constant("GROMMUNIO_USER{$i}_EMAIL_ADDRESS");
	$display_name = constant("GROMMUNIO_USER{$i}_DISPLAY_NAME");

	shell_exec("grommunio-admin -c {$user} -p {$pass} -e {$email_address} -f '{$display_name}'");
}

# Public store
shell_exec("grommunio-admin -s");

shell_exec("grommunio-admin -g " . GROMMUNIO_GROUP1_NAME . " -e " . GROMMUNIO_GROUP1_EMAIL_ADDRESS);
shell_exec("grommunio-admin -b " . GROMMUNIO_USER5_NAME . " -i " . GROMMUNIO_GROUP1_NAME);
