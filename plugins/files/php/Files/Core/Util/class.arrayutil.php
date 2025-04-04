<?php

namespace Files\Core\Util;

class ArrayUtil {
	/**
	 * Sort multidimensional array by any key.
	 *
	 * @static
	 *
	 * @param array  $arr the array to sort
	 * @param string $key the key to sort
	 * @param string $dir ASC or DESC sort direction
	 *
	 * @return array the sorted array
	 */
	public static function sort_by_key($arr, $key, $dir) {
		global $key2sort;
		$key2sort = $key;

		if ($dir == "DESC") {
			usort($arr, self::class . '::invsort');
		}
		else {
			usort($arr, self::class . '::sort');
		}

		return $arr;
	}

	/**
	 * Sort multidimensional properties array by any key.
	 *
	 * @static
	 *
	 * @param array  $arr the array to sort
	 * @param string $key the key to sort
	 * @param string $dir ASC or DESC sort direction
	 *
	 * @return array the sorted array
	 */
	public static function sort_props_by_key($arr, $key, $dir) {
		global $key2sort;
		$key2sort = $key;

		if ($dir == "DESC") {
			usort($arr, self::class . '::invpropsort');
		}
		else {
			usort($arr, self::class . '::propsort');
		}

		return $arr;
	}

	/**
	 * compare function for multidimensional array sorting.
	 *
	 * @static
	 *
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be -1.
	 */
	public static function sort($a, $b) {
		global $key2sort;

		if ($a['isFolder'] == $b['isFolder']) {
			if (is_numeric($a[$key2sort]) && is_numeric($b[$key2sort])) {
				if ($a[$key2sort] == $b[$key2sort]) {
					return 0;
				}

				return ($a[$key2sort] < $b[$key2sort]) ? -1 : 1;
			}

			return strcasecmp((string) $a[$key2sort], (string) $b[$key2sort]);
		}

		return (int) $a['isFolder'] - (int) $b['isFolder'];
	}

	/**
	 * inverse compare function for multidimensional array sorting.
	 *
	 * @static
	 *
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be 1.
	 */
	public static function invsort($a, $b) {
		global $key2sort;

		if ($a['isFolder'] == $b['isFolder']) {
			if (is_numeric($a[$key2sort]) && is_numeric($b[$key2sort])) {
				if ($a[$key2sort] == $b[$key2sort]) {
					return 0;
				}

				return ($a[$key2sort] < $b[$key2sort]) ? 1 : -1;
			}

			return -1 * strcasecmp((string) $a[$key2sort], (string) $b[$key2sort]);
		}

		return (int) $b['isFolder'] - (int) $a['isFolder'];
	}

	/**
	 * compare function for multidimensional array sorting.
	 *
	 * @static
	 *
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be -1.
	 */
	public static function propsort($a, $b) {
		global $key2sort;

		if ($a['props']['type'] == $b['props']['type']) {
			if (is_numeric($a['props'][$key2sort]) && is_numeric($b['props'][$key2sort])) {
				if ($a['props'][$key2sort] == $b['props'][$key2sort]) {
					return 0;
				}

				return ($a['props'][$key2sort] < $b['props'][$key2sort]) ? -1 : 1;
			}

			return strcasecmp((string) $a['props'][$key2sort], (string) $b['props'][$key2sort]);
		}

		return $a['props']['type'] - $b['props']['type'];
	}

	/**
	 * inverse compare function for multidimensional array sorting.
	 *
	 * @static
	 *
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be 1.
	 */
	public static function invpropsort($a, $b) {
		global $key2sort;

		if ($a['props']['type'] == $b['props']['type']) {
			if (is_numeric($a['props'][$key2sort]) && is_numeric($b['props'][$key2sort])) {
				if ($a['props'][$key2sort] == $b['props'][$key2sort]) {
					return 0;
				}

				return ($a['props'][$key2sort] < $b['props'][$key2sort]) ? 1 : -1;
			}

			return -1 * strcasecmp((string) $a['props'][$key2sort], (string) $b['props'][$key2sort]);
		}

		return $b['props']['type'] - $a['props']['type'];
	}
}
