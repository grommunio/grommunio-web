<?php

namespace Files\Backend;

interface iFeatureSharing {
	/**
	 * Get all shares in the specified folder.
	 *
	 * Returned value should like:
	 *
	 * array(
	 *  path1 => array(
	 *      id1 => details1,
	 *      id2 => details2
	 *  ),
	 *  path2 => array(
	 *      id1 => ....
	 *  )
	 * )
	 *
	 * @param mixed $path
	 *
	 * @return array
	 */
	public function getShares($path);

	/**
	 * Get details about the shared files/folders.
	 *
	 * Returned value should like:
	 *
	 * array(
	 *  path1 => array(
	 *      id1 => details1,
	 *      id2 => details2
	 *  ),
	 *  path2 => array(
	 *      id1 => ....
	 *  )
	 * )
	 *
	 * @param string[] $patharray paths to files or folders
	 *
	 * @return array|false sharing details, or false when no paths were supplied
	 */
	public function sharingDetails($patharray);

	/**
	 * Share one or multiple files.
	 * As the sharing dialog might differ for different backends, it is implemented as
	 * MetaForm - meaning that the argumentnames/count might differ.
	 * That's the cause why this function uses an array as parameter.
	 *
	 * $shareparams should look somehow like this:
	 *
	 * array(
	 *      "path1" => options1,
	 *      "path2" => options2
	 * )
	 *
	 * @param array $shareparams
	 * @param bool  $update
	 *
	 * @return array|false updated sharing data, or false when no parameters were supplied
	 */
	public function share($shareparams, $update = false);

	/**
	 * Disable sharing for the given files/folders.
	 *
	 * @param $patharray Simple array with path's to files or folders
	 *
	 * @return bool
	 */
	public function unshare($patharray);
}
