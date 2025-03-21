<?php

/**
 * Manager for including JS and CSS files into the desired order.
 */
class FileLoader {
	private $source;
	private $cacheFile;
	private $cacheSum;
	private $extjsFiles;
	private $webappFiles;
	private $pluginFiles;
	private $remoteFiles;

	public function __construct() {
		// Unique cache file per grommunio Web location.
		$basePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . '.' . md5(realpath(__FILE__));
		$this->cacheFile = "{$basePath}-loadcache";
		$this->cacheSum = "{$basePath}-loadsum";
		$this->source = DEBUG_LOADER === LOAD_SOURCE;
	}

	/**
	 * Obtain the list of Extjs & UX files.
	 *
	 * @param number $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *                     to indicate which files should be loaded
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
	 * Obtain the list of Extjs & UX files.
	 *
	 * @param number $load the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *                     to indicate which files should be loaded
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
	 *                         to indicate which files should be loaded
	 * @param array  $libFiles (optional) library files when $load = LOAD_SOURCE
	 *
	 * @return array The array of Javascript files
	 */
	public function getZarafaJavascriptFiles($load, $libFiles = []) {
		$jsLoadingSequence = [];

		if ($load == LOAD_RELEASE) {
			$jsLoadingSequence[] = "client/grommunio.js";
		}
		elseif ($load == LOAD_DEBUG) {
			$jsLoadingSequence[] = "client/grommunio-debug.js";
		}
		else {
			$jsLoadingSequence = array_merge(
				$jsLoadingSequence,
				$this->buildJSLoadingSequence(
					$this->getListOfFiles('js', 'client/zarafa'),
					['client/zarafa/core'],
					$libFiles
				)
			);
		}

		return $jsLoadingSequence;
	}

	/**
	 * Obtain the list of all Javascript files as registered by the plugins.
	 *
	 * @param number $load     the LOAD_RELEASE | LOAD_DEBUG | LOAD_SOURCE flag
	 *                         to indicate which files should be loaded
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
	 *                     to indicate which files should be loaded
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
	 *                     to indicate which files should be loaded
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
	 *                     to indicate which files should be loaded
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
	 * getJavascriptFiles.
	 *
	 * Scanning files and subdirectories that can be found within the supplied
	 * path and add all located Javascript files to a list.
	 *
	 * @param $path         String Path of the directory to scan
	 * @param $recursive    Boolean If set to true scans subdirectories as well
	 * @param $excludeFiles Array Optional Paths of files or directories that
	 *                      are excluded from the search
	 *
	 * @return array list of arrays containing the paths to files that have to be included
	 */
	public function getJavascriptFiles($path, $recursive = true, $excludeFiles = []) {
		return $this->getListOfFiles('js', $path, $recursive, $excludeFiles);
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
	 * getListOfFiles.
	 *
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
		/*
		 * We are using two lists of files to make sure the files from the
		 * subdirectories are added after the current directory files.
		 */
		$files = [];
		$subDirFiles = [];

		$dir = opendir($path);
		if (!is_resource($dir)) {
			return $files;
		}

		while (($file = readdir($dir)) !== false) {
			$filepath = $path . '/' . $file;
			// Skip entries like ".", ".." and ".svn"
			if (substr($file, 0, 1) != "." && !in_array($filepath, $excludeFiles)) {
				// Make sure we have files to include
				$info = pathinfo($filepath, PATHINFO_EXTENSION);

				if (is_file($filepath) && $info == $ext) {
					$files[] = $filepath;
				// Subdirectories will be scanned as well
				}
				elseif ($recursive && is_dir($filepath)) {
					$subDirFiles = array_merge($subDirFiles, $this->getListOfFiles($ext, $filepath, $recursive, $excludeFiles));
				}
			}
		}

		/*
		 * Make the lists alphabetically sorted, doing this separate makes sure
		 * the subdirectories are added after the files in the directory above.
		 */
		sort($files);
		sort($subDirFiles);

		return array_merge($files, $subDirFiles);
	}

	/**
	 * buildJSLoadingSequence.
	 *
	 * Will build the correct loading sequence for the JS files in application based on the class,
	 * extends and depends statements in the files itself. It will first extract the class
	 * definitions and dependencies. It will put that information in a list that holds the
	 * dependencies for each file. With that list the proper sequence of loading can be constructed.
	 * Files that originate from any of the specified coreFiles folders will be marked as core files.
	 *
	 * @param $files     Array List of files that have to be included
	 * @param $coreFiles Array (Optional) List of folders that contain core files
	 * @param $libFiles  Array (Optional) List of files that is used as library (and can contain
	 *                   classed which are depended upon by the given files)
	 *
	 * @return array List of files that are sorted in the correct sequence
	 */
	private function buildJSLoadingSequence($files, $coreFiles = [], $libFiles = []) {
		// Create a lookup table to easily get the classes which are defined in the library files
		$libFileLookup = [];
		// Create a lookup table to easily get the name of the file the class is defined in
		$classFileLookup = [];

		$fileDataLookup = [];
		$fileDependencies = [];

		// Read all library files to determine the classes which are defined
		for ($i = 0, $len = count($libFiles); $i < $len; ++$i) {
			$filename = $libFiles[$i];
			$content = $this->getFileContents($filename);

			$class = [];
			preg_match_all('(@class\W([^\n\r]*))', $content, $class);

			$libFileLookup[$filename] = [
				'class' => $class[1],
			];

			for ($j = 0, $lenJ = count($class[1]); $j < $lenJ; ++$j) {
				$libFileLookup[$class[1][$j]] = true;
			}
		}

		for ($i = 0, $len = count($files); $i < $len; ++$i) {
			$content = $this->getFileContents($files[$i]);
			$filename = $files[$i];

			$extends = [];
			$dependsFile = [];
			$class = [];

			preg_match_all('(@extends\W([^\n\r]*))', $content, $extends);
			preg_match_all('(@class\W([^\n\r]*))', $content, $class);
			preg_match_all('(#dependsFile\W([^\n\r\*]+))', $content, $dependsFile);
			$core = (str_contains($content, '#core')) ? true : false;

			for ($j = 0, $lenJ = count($coreFiles); $j < $lenJ; ++$j) {
				if (strpos((string) $filename, (string) $coreFiles[$j]) === 0) {
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
				'core' => $core,		// Based on tag or on class or on file path?
			];

			for ($j = 0, $lenJ = count($class[1]); $j < $lenJ; ++$j) {
				$classFileLookup[$class[1][$j]] = $filename;
			}
		}

		// Convert dependencies found by searching for @extends to a filename.
		foreach ($fileDataLookup as $filename => &$fileData) {
			// First get the extended class dependencies. We also have to convert them into files names using the $classFileLookup.
			for ($i = 0, $len = count($fileData['extends']); $i < $len; ++$i) {
				// The check if it extends the Zarafa namespace is needed because we do not index other namespaces.
				if (substr($fileData['extends'][$i], 0, strlen('Zarafa')) == 'Zarafa') {
					if (isset($libFileLookup[$fileData['extends'][$i]])) {
						// The @extends is found in the library file.
						// No need to update the dependencies
					}
					elseif (isset($classFileLookup[$fileData['extends'][$i]])) {
						// The @extends is found as @class in another file
						// Convert the class dependency into a filename
						$dependencyFilename = $classFileLookup[$fileData['extends'][$i]];
						// Make sure the file does not depend on itself
						if ($dependencyFilename != $filename) {
							$fileDependencies[$filename]['depends'][] = $dependencyFilename;
						}
					}
					else {
						trigger_error('Unable to find @extends dependency "' . $fileData['extends'][$i] . '" for file "' . $filename . '"');
					}
				}
			}

			// Add the file dependencies that have been added by using #dependsFile in the file.
			for ($i = 0, $len = count($fileData['dependsFile']); $i < $len; ++$i) {
				$dependencyFilename = $fileData['dependsFile'][$i];
				// Check if the file exists to prevent non-existent dependencies
				if (isset($fileDataLookup[$dependencyFilename])) {
					// Make sure the file does not depend on itself
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

		$fileSequence = $this->generateDependencyBasedFileSeq($fileDependencies);

		return $fileSequence;
	}

	/**
	 * generateDependencyBasedFileSeq.
	 *
	 * This function will generate a loading sequence for the supplied list of files and their
	 * dependencies. This function calculates the depth of each file in the dependencytree. Based on
	 * that depth it calculates a weight for each file and that will determine the order in which
	 * the files will be included.
	 * The weight consists of two times the depth of the node and a penalty for files that have not
	 * been marked as a core file. This way core files get included prior to other files at the same
	 * depth. Files with the same weight are added in the order they are in the list and that should
	 * be alphabetically.
	 *
	 * @param $fileData Array List of files with dependency data in the format of
	 *                  $fileData[ FILENAME ] = Array(
	 *                  'depends' => Array(FILENAME1, FILENAME2),
	 *                  'core' => true|false
	 *                  );
	 *
	 * @return array List of filenames in the calculated loading sequence
	 */
	private function generateDependencyBasedFileSeq($fileData) {
		$fileDepths = [];

		$changed = true;
		while ($changed && (count($fileDepths) < count($fileData))) {
			$changed = false;

			// Loop through all the files and see if for each file we can get a depth assigned based on their parents depth.
			foreach ($fileData as $file => $dependencyData) {
				$dependencies = $dependencyData['depends'];

				if (!isset($fileDepths[$file])) {
					if (count($dependencies) > 0) {
						$parentsDepthAssigned = true;
						$highestParentDepth = 0;
						// See if all the parents already have a depth assigned and if so take the highest one.
						$dependenciesCount = count($dependencies);
						for ($i = 0; $i < $dependenciesCount; ++$i) {
							// Not all parents depths have been assigned yet, wait another turn
							if (!isset($fileDepths[$dependencies[$i]])) {
								$parentsDepthAssigned = false;
								break;
							}
							// We should only take the highest depth
							$highestParentDepth = max($highestParentDepth, $fileDepths[$dependencies[$i]]);
						}
						// All parents have a depth assigned, we can calculate the one for this node.
						if ($parentsDepthAssigned) {
							$fileDepths[$file] = $highestParentDepth + 1;
							$changed = true;
						}
					// The node does not have any dependencies so its a root node.
					}
					else {
						$fileDepths[$file] = 0;
						$changed = true;
					}
				}
			}
		}

		// If not all the files have been assigned a depth, but nothing changed the last round there
		// must be something wrong with the dependencies of the skipped files. So lets tell someone.
		if (count($fileDepths) < count($fileData)) {
			$errorMsg = '[LOADER] Could not compute all dependencies. The following files cannot be resolved properly: ';
			$errorMsg .= implode(', ', array_diff(array_keys($fileData), array_keys($fileDepths)));
			trigger_error($errorMsg);
		}

		$fileWeights = [];
		// Now lets determine each file's weight
		foreach ($fileData as $file => $dependencyData) {
			if ($fileDepths[$file] !== null) {
				$weight = $fileDepths[$file] * 2;
				// Add a penalty of 1 to non-core files to up the core-files in the sequence.
				if (!$dependencyData['core']) {
					++$weight;
				}
			}
			else {
				// Make up a weight to put it at the end
				$weight = count($fileData);
			}
			if (!isset($fileWeights[$weight])) {
				$fileWeights[$weight] = [];
			}
			$fileWeights[$weight][] = $file;
		}

		// The weights have not been added in the correct order, so sort it first on the keys.
		ksort($fileWeights);

		// Now put it all in the correct order. Files with the same weight are added in the order
		// they are in the list. This order should still be alphabetically.
		$fileSequence = [];
		foreach ($fileWeights as $weight => $fileList) {
			$fileListCount = count($fileList);
			for ($i = 0; $i < $fileListCount; ++$i) {
				$fileSequence[] = $fileList[$i];
			}
		}

		return $fileSequence;
	}

	/**
	 * getFileContents.
	 *
	 * Returns the content of the supplied file name.
	 *
	 * @param $fn String File name
	 *
	 * @return string Content of the file
	 */
	private function getFileContents($fn) {
		$fn = strtok($fn, '?');

		$fc = "";
		$fh = fopen($fn, "r");
		if ($fh) {
			while (!feof($fh)) {
				$fc .= fgets($fh, 4096);
			}
			fclose($fh);
		}

		return $fc;
	}

	/**
	 * The JavaScript load order for grommunio Web. The loader order is cached when grommunio Web
	 * is LOAD_SOURCE mode, since calculating the loader is quite expensive.
	 */
	public function jsOrder() {
		if ($this->source) {
			if ($this->cacheExists()) {
				echo file_get_contents($this->cacheFile);

				return;
			}
			ob_start();
		}

		list($extjsFiles, $webappFiles, $pluginFiles, $remoteFiles) = $this->getJsFiles();

		$jsTemplate = "\t\t<script src=\"{file}\"></script>";
		$this->printFiles($extjsFiles, $jsTemplate);
		$this->printFiles($webappFiles, $jsTemplate);
		$this->printFiles($pluginFiles, $jsTemplate);
		$this->printFiles($remoteFiles, $jsTemplate);

		if ($this->source) {
			$contents = ob_get_contents();
			ob_end_clean();
			echo $contents;
			file_put_contents($this->cacheFile, $contents);
		}
	}

	/**
	 * Returns an array with all javascript files. The array has four entries, for the ExtJS files,
	 * the Zarafa files, the plugin files and the remote files respectively.
	 * This function will make sure that the directories are read only once.
	 *
	 * @return array An array that contains the names of all the javascript files that should be loaded
	 */
	private function getJsFiles() {
		if (!isset($this->extjsfiles)) {
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

		// Since we only have one css file, we can add that directly
		$this->printFiles(["client/resources/css/grommunio.css"], $cssTemplate);

		$pluginFiles = $this->getPluginCSSFiles(DEBUG_LOADER);
		$this->printFiles($pluginFiles, $cssTemplate);

		$remoteFiles = $this->getRemoteCSSFiles(DEBUG_LOADER);
		$this->printFiles($remoteFiles, $cssTemplate);
	}

	/**
	 * Checks if the JavaScript or CSS files on disk have been changed
	 * and writes a new md5 of the files to the disk.
	 *
	 * return boolean False if cache is outdated
	 */
	private function cacheExists() {
		list($extjsFiles, $webappFiles, $pluginFiles, $remoteFiles) = $this->getJsFiles();
		$files = [$extjsFiles, $webappFiles, $pluginFiles, $remoteFiles];
		$md5 = md5(json_encode($files));

		if (!file_exists($this->cacheSum) || file_get_contents($this->cacheSum) !== $md5) {
			file_put_contents($this->cacheSum, $md5);

			return false;
		}

		return true;
	}
}
