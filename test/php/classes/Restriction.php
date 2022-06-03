<?php

/**
 * Restriction.
 *
 * Helper class for creating restrictions
 */
class Restriction {
	/**
	 * Generate a restriction in which all given restrictions
	 * from the array are combined in a large 'AND' statement.
	 *
	 * @param array $restrictions An array of subrestrictions which must be 'AND'ed together
	 *
	 * @return array The AND restriction
	 */
	public static function ResAnd($restrictions) {
		return [RES_AND, $restrictions];
	}

	/**
	 * Generate a restriction in which all given restrictions
	 * from the array are combined in a large 'OR' statement.
	 *
	 * @param array $restrictions An array of subrestrictions which must be 'OR'ed together
	 *
	 * @return array The OR restriction
	 */
	public static function ResOr($restrictions) {
		return [RES_OR, $restrictions];
	}

	/**
	 * Generate a inversion for the given restriction.
	 *
	 * @param array $restriction The restriction which should be inverted
	 *
	 * @return array The NOT restriction
	 */
	public static function ResNot($restriction) {
		return [RES_NOT, $restriction];
	}

	/**
	 * Generate a restriction which checks if the given property exists.
	 *
	 * @param mixed $property The property which must exist
	 *
	 * @return array the EXIST restriction
	 */
	public static function ResExist($property) {
		return [RES_EXIST, [
			ULPROPTAG => $property,
		]];
	}

	/**
	 * Generate a restriction which will look for items where the given tag matches
	 * the requested value.
	 *
	 * @param mixed  $property         The property for which the restriction is needed
	 * @param mixed  $propvalue        The value which must be assigned to the property
	 * @param Number $relop            The comparison (e.g. RELOP_EQ) which should be applied
	 * @param mixed  $propertyForValue The property that will be used as PROPTAG in VALUES part
	 *
	 * @return mixed The restriction for the proptag/propvalue combination
	 */
	public static function ResProperty($property, $propvalue, $relop, $propertyForValue = null) {
		if ($propertyForValue === null) {
			$propertyForValue = $property;
		}

		return [RES_PROPERTY, [
			RELOP => $relop,
			ULPROPTAG => $property,
			VALUE => [
				$propertyForValue => $propvalue,
			],
		]];
	}

	/**
	 * Generate a restriction which checks the content of a property.
	 *
	 * @param mixed  $property         The property which must be checked
	 * @param mixed  $propvalue        The value which must be set on the property
	 * @param Number $fuzzy            The fuzzy level
	 * @param mixed  $propertyForValue The property that will be used as PROPTAG in VALUES part
	 *
	 * @return array the CONTENT restriction
	 */
	public static function ResContent($property, $propvalue, $fuzzy = FL_FULLSTRING, $propertyForValue = null) {
		if ($propertyForValue === null) {
			$propertyForValue = $property;
		}

		return [RES_CONTENT, [
			ULPROPTAG => $property,
			FUZZYLEVEL => $fuzzy,
			VALUE => [
				$propertyForValue => $propvalue,
			],
		]];
	}

	/**
	 * Create a restriction for adding comments to restrictions which is ignored
	 * by mapi functions. in a special case this can be used in RES_SUBRESTRICTION to
	 * hold RES_PROPERTY restriction that will be applied on given property list.
	 *
	 * @param mixed $restriction The restriction
	 * @param mixed $properties  The property list
	 *
	 * @return array the RES_COMMENT restriction
	 */
	public static function ResComment($restriction, $properties) {
		return [RES_COMMENT, [
			RESTRICTION => $restriction,
			PROPS => $properties,
		]];
	}

	/**
	 * Create a subrestriction which is used for placing a restriction on properties
	 * that holds object pointers for attachment and recipient tables.
	 *
	 * @param mixed $property    The property which must be checked
	 * @param mixed $restriction The subrestriction for the $proptag
	 *
	 * @return array the RES_SUBRESTRICTION restriction
	 */
	public static function ResSubRestriction($property, $restriction) {
		return [RES_SUBRESTRICTION, [
			ULPROPTAG => $property,
			RESTRICTION => $restriction,
		]];
	}
}
