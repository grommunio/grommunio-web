<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/class.jsloadorder.php';

/**
 * Manager for including JS and CSS files into the desired order.
 */
class FileLoader {
	private $extjsFiles;
	private $webappFiles;
	private $pluginFiles;
	private $remoteFiles;

	/**
	 * Obtain the list of Extjs & UX files.
	 *
	 * @param number $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *
	 * @return array The array of Javascript files
	 */
	public function getExtjsJavascriptFiles($load) {
		$jsLoadingSequence = [];

		if ($load == LOAD_RELEASE) {
			$jsLoadingSequence[] = "client/extjs/ext-base-all.js";
			$jsLoadingSequence[] = "client/extjs-mod/extjs-mod.js";
			$jsLoadingSequence[] = "client/tinymce/tinymce.min.js";
			$jsLoadingSequence[] = "client/third-party/ux-thirdparty.js";
			$jsLoadingSequence[] = "client/dompurify/purify.js";
		}
		elseif ($load == LOAD_DEBUG) {
			$jsLoadingSequence[] = "client/extjs/ext-base-all-debug.js";
			$jsLoadingSequence[] = "client/extjs-mod/extjs-mod-debug.js";
			$jsLoadingSequence[] = "client/tinymce/tinymce.js";
			$jsLoadingSequence[] = "client/third-party/ux-thirdparty-debug.js";
			$jsLoadingSequence[] = "client/dompurify/purify.js";
		}
		else {
			$jsLoadingSequence[] = "client/extjs/ext-base-debug.js";
			$jsLoadingSequence[] = "client/extjs/ext-all-debug.js";
			$jsLoadingSequence[] = "client/extjs/ux/ux-all-debug.js";
			$jsLoadingSequence = array_merge(
				$jsLoadingSequence,
				JsLoadOrder::sort(
					$this->getListOfFiles('js', 'client/extjs-mod')
				)
			);
			$jsLoadingSequence[] = "client/tinymce/tinymce.js";
			$jsLoadingSequence[] = "client/dompurify/purify.js";
			$jsLoadingSequence = array_merge(
				$jsLoadingSequence,
				JsLoadOrder::sort(
					$this->getListOfFiles('js', 'client/third-party')
				)
			);
		}

		return $jsLoadingSequence;
	}

	/**
	 * Obtain the list of Extjs & UX CSS files.
	 *
	 * The stylesheet is shared by all load modes, but this method follows the
	 * same mode-aware public contract as the other loader methods.
	 *
	 * @param int $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *
	 * @return array The array of CSS files
	 */
	public function getExtjsCSSFiles(/* @scrutinizer ignore-unused */ $load) {
		return ["client/extjs/resources/css/ext-all-ux.css"];
	}

	/**
	 * Obtain the list of grommunio Web files.
	 *
	 * @param number $load     the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 * @param array  $libFiles (optional) library files when $load = LOAD_SOURCE
	 *
	 * @return array The array of Javascript files
	 */
	public function getGrommunioJavascriptFiles($load, $libFiles = []) {
		if ($load == LOAD_RELEASE) {
			return ["client/grommunio.js"];
		}
		if ($load == LOAD_DEBUG) {
			return ["client/grommunio-debug.js"];
		}

		return JsLoadOrder::sort(
			$this->getListOfFiles('js', 'client/grommunio'),
			['client/grommunio/core'],
			$libFiles
		);
	}

	/**
	 * Obtain the list of all Javascript files as registered by the plugins.
	 *
	 * @param number $load     the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 * @param array  $libFiles (optional) library files when $load = LOAD_SOURCE
	 *
	 * @return array The array of Javascript files
	 */
	public function getPluginJavascriptFiles($load, $libFiles = []) {
		if ($load === LOAD_SOURCE) {
			return JsLoadOrder::sort(
				$GLOBALS['PluginManager']->getClientFiles($load),
				[],
				$libFiles
			);
		}

		return $GLOBALS['PluginManager']->getClientFiles($load);
	}

	/**
	 * Obtain the list of all CSS files as registered by the plugins.
	 *
	 * @param number $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *
	 * @return array The array of CSS files
	 */
	public function getPluginCSSFiles($load) {
		return $GLOBALS['PluginManager']->getResourceFiles($load);
	}

	/**
	 * Obtain the list of all Javascript files as provided by plugins using PluginManager#triggerHook
	 * for the hook 'server.main.include.jsfiles'.
	 *
	 * @param number $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *
	 * @return array The array of Javascript files
	 */
	public function getRemoteJavascriptFiles($load) {
		$files = [];
		$GLOBALS['PluginManager']->triggerHook('server.main.include.jsfiles', ['load' => $load, 'files' => &$files]);

		return $files;
	}

	/**
	 * Obtain the list of all CSS files as provided by plugins using PluginManager#triggerHook
	 * for the hook 'server.main.include.cssfiles'.
	 *
	 * @param number $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *
	 * @return array The array of CSS files
	 */
	public function getRemoteCSSFiles($load) {
		$files = [];
		$GLOBALS['PluginManager']->triggerHook('server.main.include.cssfiles', ['load' => $load, 'files' => &$files]);

		return $files;
	}

	/**
	 * Print each file on a new line using the given $template.
	 *
	 * @param array  $files         The files to print
	 * @param string $template      The template used to print each file, the string {file} will
	 *                              be replaced with the filename
	 * @param bool   $base          True if only the basename of the file must be printed
	 * @param bool   $concatVersion true if concatenate unique webapp version
	 *                              with file name to avoid the caching issue
	 */
	public function printFiles($files, $template = '{file}', $base = false, $concatVersion = true) {
		foreach ($files as $file) {
			$file = $base === true ? basename((string) $file) : $file;
			if ($concatVersion) {
				$file = versionedUrl($file);
			}
			echo str_replace('{file}', $file, $template) . PHP_EOL;
		}
	}

	/**
	 * Return grommunio Web version.
	 *
	 * @return string returns grommunio Web version
	 */
	public function getVersion() {
		return getWebappVersion();
	}

	/**
	 * getCSSFiles.
	 *
	 * Scanning files and subdirectories that can be found within the supplied
	 * path and add all located CSS files to a list.
	 *
	 * @param $path         String Path of the directory to scan
	 * @param $recursive    Boolean If set to true scans subdirectories as well
	 * @param $excludeFiles Array Optional Paths of files or directories that
	 *                      are excluded from the search
	 *
	 * @return array list of arrays containing the paths to files that have to be included
	 */
	public function getCSSFiles($path, $recursive = true, $excludeFiles = []) {
		return $this->getListOfFiles('css', $path, $recursive, $excludeFiles);
	}

	/**
	 * Scanning files and subdirectories that can be found within the supplied
	 * path and add the files to a list.
	 *
	 * @param $ext          The extension of files that are included ("js" or "css")
	 * @param $path         String Path of the directory to scan
	 * @param $recursive    Boolean If set to true scans subdirectories as well
	 * @param $excludeFiles Array Optional Paths of files or directories that
	 *                      are excluded from the search
	 *
	 * @return array list of arrays containing the paths to files that have to be included
	 */
	private function getListOfFiles($ext, $path, $recursive = true, $excludeFiles = []) {
		$files = [];
		$subDirFiles = [];

		$dir = opendir($path);
		if (!is_resource($dir)) {
			return $files;
		}

		while (($file = readdir($dir)) !== false) {
			$filepath = $path . '/' . $file;
			if (!str_starts_with($file, ".") && !in_array($filepath, $excludeFiles)) {
				$info = pathinfo($filepath, PATHINFO_EXTENSION);

				if (is_file($filepath) && $info == $ext) {
					$files[] = $filepath;
				}
				elseif ($recursive && is_dir($filepath)) {
					$subDirFiles = array_merge($subDirFiles, $this->getListOfFiles($ext, $filepath, $recursive, $excludeFiles));
				}
			}
		}

		sort($files);
		sort($subDirFiles);

		return array_merge($files, $subDirFiles);
	}

	/**
	 * The JavaScript load order for grommunio Web.
	 */
	public function jsOrder() {
		[$extjsFiles, $webappFiles, $pluginFiles, $remoteFiles] = $this->getJsFiles();

		$jsTemplate = "\t\t<script src=\"{file}\"></script>";
		$this->printFiles($extjsFiles, $jsTemplate);
		$this->printFiles($webappFiles, $jsTemplate);
		$this->printFiles($pluginFiles, $jsTemplate);
		$this->printFiles($remoteFiles, $jsTemplate);
	}

	/**
	 * Returns an array with all javascript files.
	 *
	 * @return array An array that contains the names of all the javascript files that should be loaded
	 */
	private function getJsFiles() {
		if (!isset($this->extjsFiles)) {
			$this->extjsFiles = $this->getExtjsJavascriptFiles(DEBUG_LOADER);
			$this->webappFiles = $this->getGrommunioJavascriptFiles(DEBUG_LOADER, $this->extjsFiles);
			$this->pluginFiles = $this->getPluginJavascriptFiles(DEBUG_LOADER, array_merge($this->extjsFiles, $this->webappFiles));
			$this->remoteFiles = $this->getRemoteJavascriptFiles(DEBUG_LOADER);
		}

		return [$this->extjsFiles, $this->webappFiles, $this->pluginFiles, $this->remoteFiles];
	}

	/**
	 * The CSS load order for grommunio Web.
	 */
	public function cssOrder() {
		$cssTemplate = "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"{file}\">";
		$extjsFiles = $this->getExtjsCSSFiles(DEBUG_LOADER);
		$this->printFiles($extjsFiles, $cssTemplate);

		$this->printFiles(["client/resources/css/grommunio.css", "client/resources/css/message-security.css"], $cssTemplate);

		$pluginFiles = $this->getPluginCSSFiles(DEBUG_LOADER);
		$this->printFiles($pluginFiles, $cssTemplate);

		$remoteFiles = $this->getRemoteCSSFiles(DEBUG_LOADER);
		$this->printFiles($remoteFiles, $cssTemplate);
	}
}
