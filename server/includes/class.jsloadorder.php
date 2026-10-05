<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Orders JS source files by their @class, @extends and #dependsFile annotations.
 * Only used for LOAD_SOURCE mode.
 */
class JsLoadOrder {
	/**
	 * @param array $files     List of files that have to be included
	 * @param array $coreFiles (Optional) List of folders that contain core files
	 * @param array $libFiles  (Optional) List of library files
	 *
	 * @return array List of files sorted in the correct loading sequence
	 */
	public static function sort($files, $coreFiles = [], $libFiles = []) {
		$libFileLookup = self::scanLibFiles($libFiles);
		$classFileLookup = [];
		$fileDataLookup = [];
		$fileDependencies = [];

		foreach ($files as $filename) {
			$fileData = self::scanFile($filename, $coreFiles);
			$fileDataLookup[$filename] = $fileData;
			$fileDependencies[$filename] = [
				'depends' => [],
				'core' => $fileData['core'],
			];
			foreach ($fileData['class'] as $class) {
				$classFileLookup[$class] = $filename;
			}
		}

		foreach ($fileDataLookup as $filename => $fileData) {
			$fileDependencies[$filename]['depends'] = array_merge(
				self::resolveExtends($filename, $fileData['extends'], $libFileLookup, $classFileLookup),
				self::resolveDependsFile($filename, $fileData['dependsFile'], $fileDataLookup)
			);
		}

		return self::depthOrder($fileDependencies);
	}

	/**
	 * @param array $libFiles List of library files
	 *
	 * @return array Library filenames and the classes they define
	 */
	private static function scanLibFiles($libFiles) {
		$libFileLookup = [];
		foreach ($libFiles as $filename) {
			$content = file_get_contents(strtok($filename, '?'));
			$class = [];
			preg_match_all('(@class\W([^\n\r]*))', $content, $class);

			$libFileLookup[$filename] = ['class' => $class[1]];
			foreach ($class[1] as $className) {
				$libFileLookup[$className] = true;
			}
		}

		return $libFileLookup;
	}

	/**
	 * @param string $filename  File to scan
	 * @param array  $coreFiles List of folders that contain core files
	 *
	 * @return array The annotations of the file
	 */
	private static function scanFile($filename, $coreFiles) {
		$content = file_get_contents(strtok($filename, '?'));
		$extends = [];
		$dependsFile = [];
		$class = [];

		preg_match_all('(@extends\W([^\n\r]*))', $content, $extends);
		preg_match_all('(@class\W([^\n\r]*))', $content, $class);
		preg_match_all('(#dependsFile\W([^\n\r\*]+))', $content, $dependsFile);

		return [
			'class' => $class[1],
			'extends' => $extends[1],
			'dependsFile' => $dependsFile[1],
			'core' => str_contains($content, '#core') || self::inCoreFolder($filename, $coreFiles),
		];
	}

	private static function inCoreFolder($filename, $coreFiles) {
		foreach ($coreFiles as $coreFile) {
			if (str_starts_with((string) $filename, (string) $coreFile)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @param mixed $filename
	 * @param mixed $extends
	 * @param mixed $libFileLookup
	 * @param mixed $classFileLookup
	 *
	 * @return array Files defining the Grommunio classes $filename extends
	 */
	private static function resolveExtends($filename, $extends, $libFileLookup, $classFileLookup) {
		$depends = [];
		foreach ($extends as $className) {
			if (!str_starts_with($className, 'Grommunio') || isset($libFileLookup[$className])) {
				continue;
			}
			if (!isset($classFileLookup[$className])) {
				trigger_error('Unable to find @extends dependency "' . $className . '" for file "' . $filename . '"');

				continue;
			}
			if ($classFileLookup[$className] != $filename) {
				$depends[] = $classFileLookup[$className];
			}
		}

		return $depends;
	}

	/**
	 * @param mixed $filename
	 * @param mixed $dependsFile
	 * @param mixed $fileDataLookup
	 *
	 * @return array Files named by the #dependsFile annotations of $filename
	 */
	private static function resolveDependsFile($filename, $dependsFile, $fileDataLookup) {
		$depends = [];
		foreach ($dependsFile as $dependencyFilename) {
			if (!isset($fileDataLookup[$dependencyFilename])) {
				trigger_error('Unable to find file #dependsFile dependency "' . $dependencyFilename . '" for file "' . $filename . '"');

				continue;
			}
			if ($dependencyFilename != $filename) {
				$depends[] = $dependencyFilename;
			}
		}

		return $depends;
	}

	/**
	 * @param array $fileData List of files with dependency data
	 *
	 * @return array List of filenames ordered by dependency depth, core files first at each depth
	 */
	private static function depthOrder($fileData) {
		$fileDepths = self::depths($fileData);
		if (count($fileDepths) < count($fileData)) {
			$errorMsg = '[LOADER] Could not compute all dependencies. The following files cannot be resolved properly: ';
			$errorMsg .= implode(', ', array_diff(array_keys($fileData), array_keys($fileDepths)));
			trigger_error($errorMsg);
		}

		$fileWeights = [];
		foreach ($fileData as $file => $dependencyData) {
			if (isset($fileDepths[$file])) {
				$weight = $fileDepths[$file] * 2 + ($dependencyData['core'] ? 0 : 1);
			}
			else {
				$weight = count($fileData);
			}
			$fileWeights[$weight][] = $file;
		}
		ksort($fileWeights);

		return array_merge(...array_values($fileWeights));
	}

	/**
	 * @param array $fileData List of files with dependency data
	 *
	 * @return array Dependency depth per file, missing for files in a cycle
	 */
	private static function depths($fileData) {
		$fileDepths = [];
		$changed = true;
		while ($changed && count($fileDepths) < count($fileData)) {
			$changed = false;
			foreach ($fileData as $file => $dependencyData) {
				if (isset($fileDepths[$file])) {
					continue;
				}
				$depth = self::depth($dependencyData['depends'], $fileDepths);
				if ($depth !== null) {
					$fileDepths[$file] = $depth;
					$changed = true;
				}
			}
		}

		return $fileDepths;
	}

	/**
	 * @param mixed $dependencies
	 * @param mixed $fileDepths
	 *
	 * @return null|int one more than the deepest dependency, null while one is unassigned
	 */
	private static function depth($dependencies, $fileDepths) {
		if (count($dependencies) === 0) {
			return 0;
		}
		$highestParentDepth = 0;
		foreach ($dependencies as $dependency) {
			if (!isset($fileDepths[$dependency])) {
				return null;
			}
			$highestParentDepth = max($highestParentDepth, $fileDepths[$dependency]);
		}

		return $highestParentDepth + 1;
	}
}
