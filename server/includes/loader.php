<?php

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
			$jsLoadingSequence[] = "client/extjs/ux/ux-all.js";
			$jsLoadingSequence[] = "client/extjs-mod/extjs-mod.js";
			$jsLoadingSequence[] = "client/tinymce/tinymce.min.js";
			$jsLoadingSequence[] = "client/third-party/ux-thirdparty.js";
			$jsLoadingSequence[] = "client/dompurify/purify.js";
		}
		elseif ($load == LOAD_DEBUG) {
			$jsLoadingSequence[] = "client/extjs/ext-base-debug.js";
			$jsLoadingSequence[] = "client/extjs/ext-all-debug.js";
			$jsLoadingSequence[] = "client/extjs/ux/ux-all-debug.js";
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
				$this->buildJSLoadingSequence(
					$this->getListOfFiles('js', 'client/extjs-mod')
				)
			);
			$jsLoadingSequence[] = "client/tinymce/tinymce.js";
			$jsLoadingSequence[] = "client/dompurify/purify.js";
			$jsLoadingSequence = array_merge(
				$jsLoadingSequence,
				$this->buildJSLoadingSequence(
					$this->getListOfFiles('js', 'client/third-party')
				)
			);
		}

		return $jsLoadingSequence;
	}

	/**
	 * Obtain the list of Extjs & UX CSS files.
	 *
	 * @param number $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *
	 * @return array The array of CSS files
	 */
	public function getExtjsCSSFiles($load) {
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
	public function getZarafaJavascriptFiles($load, $libFiles = []) {
		if ($load == LOAD_RELEASE) {
			return ["client/grommunio.js"];
		}
		elseif ($load == LOAD_DEBUG) {
			return ["client/grommunio-debug.js"];
		}

		return $this->buildJSLoadingSequence(
			$this->getListOfFiles('js', 'client/zarafa'),
			['client/zarafa/core'],
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
			return $this->buildJSLoadingSequence(
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
				$file = $file . "?version=" . $this->getVersion();
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
		return trim(file_get_contents('version'));
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
	 * Build the correct loading sequence for JS files based on @class, @extends
	 * and #dependsFile annotations. Only used for LOAD_SOURCE mode.
	 *
	 * @param $files     Array List of files that have to be included
	 * @param $coreFiles Array (Optional) List of folders that contain core files
	 * @param $libFiles  Array (Optional) List of library files
	 *
	 * @return array List of files sorted in the correct loading sequence
	 */
	private function buildJSLoadingSequence($files, $coreFiles = [], $libFiles = []) {
		$libFileLookup = [];
		$classFileLookup = [];
		$fileDataLookup = [];
		$fileDependencies = [];

		for ($i = 0, $len = count($libFiles); $i < $len; ++$i) {
			$filename = $libFiles[$i];
			$content = file_get_contents(strtok($filename, '?'));

			$class = [];
			preg_match_all('(@class\W([^\n\r]*))', $content, $class);

			$libFileLookup[$filename] = ['class' => $class[1]];
			for ($j = 0, $lenJ = count($class[1]); $j < $lenJ; ++$j) {
				$libFileLookup[$class[1][$j]] = true;
			}
		}

		for ($i = 0, $len = count($files); $i < $len; ++$i) {
			$content = file_get_contents(strtok($files[$i], '?'));
			$filename = $files[$i];

			$extends = [];
			$dependsFile = [];
			$class = [];

			preg_match_all('(@extends\W([^\n\r]*))', $content, $extends);
			preg_match_all('(@class\W([^\n\r]*))', $content, $class);
			preg_match_all('(#dependsFile\W([^\n\r\*]+))', $content, $dependsFile);
			$core = str_contains($content, '#core');

			for ($j = 0, $lenJ = count($coreFiles); $j < $lenJ; ++$j) {
				if (str_starts_with((string) $filename, (string) $coreFiles[$j])) {
					$core = true;
					break;
				}
			}

			$fileDataLookup[$filename] = [
				'class' => $class[1],
				'extends' => $extends[1],
				'dependsFile' => $dependsFile[1],
			];
			$fileDependencies[$filename] = [
				'depends' => [],
				'core' => $core,
			];

			for ($j = 0, $lenJ = count($class[1]); $j < $lenJ; ++$j) {
				$classFileLookup[$class[1][$j]] = $filename;
			}
		}

		foreach ($fileDataLookup as $filename => &$fileData) {
			for ($i = 0, $len = count($fileData['extends']); $i < $len; ++$i) {
				if (str_starts_with($fileData['extends'][$i], 'Zarafa')) {
					if (isset($libFileLookup[$fileData['extends'][$i]])) {
						// Found in library — no dependency needed
					}
					elseif (isset($classFileLookup[$fileData['extends'][$i]])) {
						$dependencyFilename = $classFileLookup[$fileData['extends'][$i]];
						if ($dependencyFilename != $filename) {
							$fileDependencies[$filename]['depends'][] = $dependencyFilename;
						}
					}
					else {
						trigger_error('Unable to find @extends dependency "' . $fileData['extends'][$i] . '" for file "' . $filename . '"');
					}
				}
			}

			for ($i = 0, $len = count($fileData['dependsFile']); $i < $len; ++$i) {
				$dependencyFilename = $fileData['dependsFile'][$i];
				if (isset($fileDataLookup[$dependencyFilename])) {
					if ($dependencyFilename != $filename) {
						$fileDependencies[$filename]['depends'][] = $dependencyFilename;
					}
				}
				else {
					trigger_error('Unable to find file #dependsFile dependency "' . $fileData['dependsFile'][$i] . '" for file "' . $filename . '"');
				}
			}
		}
		unset($fileData);

		return $this->generateDependencyBasedFileSeq($fileDependencies);
	}

	/**
	 * Generate a loading sequence based on dependency depth.
	 * Core files get priority at each depth level.
	 *
	 * @param $fileData Array List of files with dependency data
	 *
	 * @return array List of filenames in the calculated loading sequence
	 */
	private function generateDependencyBasedFileSeq($fileData) {
		$fileDepths = [];

		$changed = true;
		while ($changed && (count($fileDepths) < count($fileData))) {
			$changed = false;

			foreach ($fileData as $file => $dependencyData) {
				$dependencies = $dependencyData['depends'];

				if (!isset($fileDepths[$file])) {
					if (count($dependencies) > 0) {
						$parentsDepthAssigned = true;
						$highestParentDepth = 0;
						$dependenciesCount = count($dependencies);
						for ($i = 0; $i < $dependenciesCount; ++$i) {
							if (!isset($fileDepths[$dependencies[$i]])) {
								$parentsDepthAssigned = false;
								break;
							}
							$highestParentDepth = max($highestParentDepth, $fileDepths[$dependencies[$i]]);
						}
						if ($parentsDepthAssigned) {
							$fileDepths[$file] = $highestParentDepth + 1;
							$changed = true;
						}
					}
					else {
						$fileDepths[$file] = 0;
						$changed = true;
					}
				}
			}
		}

		if (count($fileDepths) < count($fileData)) {
			$errorMsg = '[LOADER] Could not compute all dependencies. The following files cannot be resolved properly: ';
			$errorMsg .= implode(', ', array_diff(array_keys($fileData), array_keys($fileDepths)));
			trigger_error($errorMsg);
		}

		$fileWeights = [];
		foreach ($fileData as $file => $dependencyData) {
			if ($fileDepths[$file] !== null) {
				$weight = $fileDepths[$file] * 2;
				if (!$dependencyData['core']) {
					++$weight;
				}
			}
			else {
				$weight = count($fileData);
			}
			if (!isset($fileWeights[$weight])) {
				$fileWeights[$weight] = [];
			}
			$fileWeights[$weight][] = $file;
		}

		ksort($fileWeights);

		$fileSequence = [];
		foreach ($fileWeights as $fileList) {
			foreach ($fileList as $file) {
				$fileSequence[] = $file;
			}
		}

		return $fileSequence;
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
			$this->webappFiles = $this->getZarafaJavascriptFiles(DEBUG_LOADER, $this->extjsFiles);
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

		$this->printFiles(["client/resources/css/grommunio.css"], $cssTemplate);

		$pluginFiles = $this->getPluginCSSFiles(DEBUG_LOADER);
		$this->printFiles($pluginFiles, $cssTemplate);

		$remoteFiles = $this->getRemoteCSSFiles(DEBUG_LOADER);
		$this->printFiles($remoteFiles, $cssTemplate);
	}
}
