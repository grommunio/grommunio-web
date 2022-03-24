<?php
namespace Files\Backend;


abstract class AbstractJSLoader
{
	protected $jsBuffer = "";

	// path to js folder
	protected $JS_PATH;

	// get combined javascript string
	abstract public function get_combined_js($debug = false);
}