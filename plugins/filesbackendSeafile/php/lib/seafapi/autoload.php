<?php

declare(strict_types=1);

namespace Datamate\SeafileApi;

if (!is_callable('spl_autoload_register')) {
	throw new \RuntimeException('spl_autoload_register: n/a');
}

\spl_autoload_register(
	static function ($className) {
		$namespacePrefix = __NAMESPACE__ . '\\';
		$basePath = __DIR__ . '/';
		if (!str_starts_with($className, $namespacePrefix)) {
			return;
		}

		$classNamespaceSuffix = substr($className, strlen($namespacePrefix));
		$classFileName = $basePath . str_replace('\\', '/', $classNamespaceSuffix) . '.php';
		if (is_file($classFileName)) {
			require $classFileName;
		}
		else {
			throw new \RuntimeException(sprintf('class: %s: no such file: %s', $className, $classFileName));
		}
	}
);
