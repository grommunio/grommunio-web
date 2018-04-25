<?php

/**
 * Util
 *
 * Utility functions
 */
class Util {

	/**
	 * Plucks the value of a property from each item in the Array
	 * For example:
	 *
	 * $arr = array( 0 => array('test' => 'value1'), 1 => array('test' => 'value2') );
	 * $pluck = pluckFromObject($arr, 'test');
	 *
	 * $pluck === array( 0 => 'value1', 1 => 'value2' );
	 *
	 * @param array $arr The array to pluck from
	 * @param string $pluck The key which we pluck from each item in $arr
	 * @return array The array of plucked values
	 */
	public static function pluckFromObject($arr, $pluck)
	{
		$names = array();

		foreach ($arr as $index => $item) {
			if (isset($item[$pluck])) {
				$names[] = $item[$pluck];
			}
		}

		return $names;
	}

	/**
	 * Returns the item in an array which has a $key which matches the given $value
	 * @param array $arr The array to search in
	 * @param String $key The key which we will check in all items
	 * @param String $value The value for which we are looking for
	 * @param Integer $skip Will skip this number of entries that match the search criteria
	 * @return array The item in the array which matches the $key-$value pair
	 */
	public static function searchInArray($arr, $key, $value, $skip = 0)
	{
		foreach ($arr as $index => $item) {
			if (isset($item[$key]) && $item[$key] == $value) {
				if($skip === 0){
					return $item;
				}else{
					$skip--;
				}
			}
		}

		return null;
	}

	/**
	 * Returns the index of an array which has a $key which matches the given $value
	 * @param array $arr The array to search in
	 * @param String $key The key which we will check in all items
	 * @param String $vlaue The value for which we are looking for
	 * @return Number The index of the item in the array which matches the $key-$value pair
	 */
	public static function indexInArray($arr, $key, $value, $skip = 0)
	{
		foreach ($arr as $index => $item) {
			if (isset($item[$key]) && $item[$key] == $value) {
				if($skip === 0){
					return $index;
				}else{
					$skip--;
				}
			}
		}

		return -1;
	}
}

?>
