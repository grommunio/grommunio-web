<?php
namespace Files\Core\Util;


class ArrayUtil
{
	/**
	 * Sort multidimensional array by any key
	 *
	 * @static
	 * @param array $arr the array to sort
	 * @param string $key the key to sort
	 * @param string $dir ASC or DESC sort direction
	 *
	 * @return array the sorted array
	 */
	static function sort_by_key($arr, $key, $dir)
	{
		global $key2sort;
		$key2sort = $key;

		if ($dir == "DESC") {
			usort($arr, array('self', 'invsort'));
		} else {
			usort($arr, array('self', 'sort'));
		}
		return ($arr);
	}

	/**
	 * Sort multidimensional properties array by any key
	 *
	 * @static
	 * @param array $arr the array to sort
	 * @param string $key the key to sort
	 * @param string $dir ASC or DESC sort direction
	 *
	 * @return array the sorted array
	 */
	static function sort_props_by_key($arr, $key, $dir)
	{
		global $key2sort;
		$key2sort = $key;

		if ($dir == "DESC") {
			usort($arr, array('self', 'invpropsort'));
		} else {
			usort($arr, array('self', 'propsort'));
		}
		return ($arr);
	}

	/**
	 * compare function for multidimensional array sorting
	 *
	 * @static
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be -1.
	 */
	static function sort($a, $b)
	{
		global $key2sort;

		if ($a['isFolder'] == $b['isFolder']) {
			if (is_numeric($a[$key2sort]) && is_numeric($b[$key2sort])) {
				if ($a[$key2sort] == $b[$key2sort]) {
					return 0;
				}
				return ($a[$key2sort] < $b[$key2sort]) ? -1 : 1;
			} else {
				return (strcasecmp($a[$key2sort], $b[$key2sort]));
			}
		}

		return ((int)$a['isFolder'] - (int)$b['isFolder']);
	}

	/**
	 * inverse compare function for multidimensional array sorting
	 *
	 * @static
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be 1.
	 */
	static function invsort($a, $b)
	{
		global $key2sort;

		if ($a['isFolder'] == $b['isFolder']) {
			if (is_numeric($a[$key2sort]) && is_numeric($b[$key2sort])) {
				if ($a[$key2sort] == $b[$key2sort]) {
					return 0;
				}
				return ($a[$key2sort] < $b[$key2sort]) ? 1 : -1;
			} else {
				return (-1 * strcasecmp($a[$key2sort], $b[$key2sort]));
			}
		}

		return ((int)$b['isFolder'] - (int)$a['isFolder']);
	}

	/**
	 * compare function for multidimensional array sorting
	 *
	 * @static
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be -1.
	 */
	static function propsort($a, $b)
	{
		global $key2sort;

		if ($a['props']['type'] == $b['props']['type']) {
			if (is_numeric($a['props'][$key2sort]) && is_numeric($b['props'][$key2sort])) {
				if ($a['props'][$key2sort] == $b['props'][$key2sort]) {
					return 0;
				}
				return ($a['props'][$key2sort] < $b['props'][$key2sort]) ? -1 : 1;
			} else {
				return (strcasecmp($a['props'][$key2sort], $b['props'][$key2sort]));
			}
		}

		return ($a['props']['type'] - $b['props']['type']);
	}

	/**
	 * inverse compare function for multidimensional array sorting
	 *
	 * @static
	 * @param array $a this argument will be compared with argument $b
	 * @param array $b this argument will be compared with argument $a
	 *
	 * @return int compare value. If $a < $b the return value will be 1.
	 */
	static function invpropsort($a, $b)
	{
		global $key2sort;

		if ($a['props']['type'] == $b['props']['type']) {
			if (is_numeric($a['props'][$key2sort]) && is_numeric($b['props'][$key2sort])) {
				if ($a['props'][$key2sort] == $b['props'][$key2sort]) {
					return 0;
				}
				return ($a['props'][$key2sort] < $b['props'][$key2sort]) ? 1 : -1;
			} else {
				return (-1 * strcasecmp($a['props'][$key2sort], $b['props'][$key2sort]));
			}
		}

		return ($b['props']['type'] - $a['props']['type']);
	}
}