<?php
require_once("/usr/share/kopano/php/mapi/mapi.util.php");
require_once("/usr/share/kopano/php/mapi/mapidefs.php");
require_once("/usr/share/kopano/php/mapi/mapitags.php");
require_once("/usr/share/kopano/php/mapi/mapicode.php");
require_once("/usr/share/kopano/php/mapi/mapiguid.php");

require_once("config.php");

function getstore() {
	$session = mapi_logon_zarafa(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD, DEFAULT_SERVER);
	if (!$session) {
		return [];
	}

	$stores = mapi_getmsgstorestable($session);
	$storeslist = mapi_table_queryallrows($stores);
	$adminstore = mapi_openmsgstore($session, $storeslist[0][PR_ENTRYID]);
	return $adminstore;
}


function getusers() {
	$adminstore = getstore();
	$users = mapi_zarafa_getuserlist($adminstore);
	return $users;
}

function getgroups() {
	$adminstore = getstore();
	$groups = mapi_zarafa_getgrouplist($adminstore);
	return $groups;
}

$users = getusers();

for($i = 1; $i < 6; $i++) {
	$user = constant("KOPANO_USER${i}_NAME");
	$pass = constant("KOPANO_USER${i}_PASSWORD");

	if (array_key_exists($user, $users)) {
		continue;
	}

	$email_address = constant("KOPANO_USER${i}_EMAIL_ADDRESS");
	$display_name = constant("KOPANO_USER${i}_DISPLAY_NAME");

	//$userid = mapi_zarafa_createuser($adminstore, $user, $user, $display_name, $email_address);
	
	# XXX: insecure
	shell_exec("kopano-admin -c $user -p $pass -e $email_address -f '$display_name'");
	shell_exec("kopano-storeadm -Cn $user");
}

# Public store
shell_exec("kopano-storeadm -P");

if (!array_key_exists(KOPANO_GROUP1_NAME, getgroups())) {
	shell_exec("kopano-admin -g " . KOPANO_GROUP1_NAME . " -e " . KOPANO_GROUP1_EMAIL_ADDRESS);
	shell_exec("kopano-admin -b " . KOPANO_USER5_NAME . " -i " . KOPANO_GROUP1_NAME);
}
?>
