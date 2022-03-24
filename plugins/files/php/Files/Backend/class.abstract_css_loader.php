<?php
namespace Files\Backend;


abstract class AbstractCSSLoader
{

	protected $cssBuffer = "";

	// path to css folder
	protected $CSS_PATH;

	// get combined css string
	abstract public function get_combined_css($debug = false);
}