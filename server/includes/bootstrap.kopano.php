<?php

	/*************************************************************************************
	 * 
	 * This script contains all includes that are necessary for kopano.php
	 * 
	 *************************************************************************************/

	 // First include all generally necessary classes
	require_once('server/includes/bootstrap.php');

	// Following classes are needed for kopano.php
	require_once(BASE_PATH . 'server/includes/core/class.jsonrequest.php');
	require_once(BASE_PATH . 'server/includes/notifiers/class.notifier.php');
	require_once(BASE_PATH . 'server/includes/modules/class.module.php');
	require_once(BASE_PATH . 'server/includes/modules/class.listmodule.php');
	require_once(BASE_PATH . 'server/includes/modules/class.itemmodule.php');
	require_once(BASE_PATH . 'server/includes/core/class.dispatcher.php');
	require_once(BASE_PATH . 'server/includes/core/class.properties.php');
	require_once(BASE_PATH . 'server/includes/core/class.bus.php');
	