<?php

/**
 * Restriction
 *
 * Helper class for creating restrictions
 */
class Restriction {

	/**
	 * Generate a restriction in which all given restrictions
	 * from the array are combined in a large 'AND' statement
	 * @param Array $restrictions An array of subrestrictions which must be 'AND'ed together
	 * @return Array The AND restriction
	 */
	public static function ResAnd($restrictions)
	{
		return array(RES_AND, $restrictions);
	}

	/**
	 * Generate a restriction in which all given restrictions
	 * from the array are combined in a large 'OR' statement
	 * @param Array $restrictions An array of subrestrictions which must be 'OR'ed together
	 * @return Array The OR restriction
	 */
	public static function ResOr($restrictions)
	{
		return array(RES_OR, $restrictions);
	}

	/**
	 * Generate a inversion for the given restriction
	 * @param Array $restriction The restriction which should be inverted
	 * @return Array The NOT restriction
	 */
	public static function ResNot($restriction)
	{
		return array(RES_NOT, $restriction);
	}

	/**
	 * Generate a restriction which checks if the given property exists
	 * @param Mixed $property The property which must exist
	 * @return Array the EXIST restriction
	 */
	public static function ResExist($property)
	{
		return array(RES_EXIST, array(
			ULPROPTAG => $property
		));
	}

	/**
	 * Generate a restriction which will look for items where the given tag matches
	 * the requested value.
	 * @param Mixed $property The property for which the restriction is needed
	 * @param Mixed $propvalue The value which must be assigned to the property
	 * @param Number $relop The comparison (e.g. RELOP_EQ) which should be applied
	 * @param Mixed $propertyForValue The property that will be used as PROPTAG in VALUES part
	 * @return Mixed The restriction for the proptag/propvalue combination
	 */
	public static function ResProperty($property, $propvalue, $relop, $propertyForValue = null)
	{
		if($propertyForValue === null) {
			$propertyForValue = $property;
		}

		return array(RES_PROPERTY, array(
			RELOP => $relop,
			ULPROPTAG => $property,
			VALUE => array(
				$propertyForValue => $propvalue
			)
		));
	}

	/**
	 * Generate a restriction which checks the content of a property.
	 * @param Mixed $property The property which must be checked
	 * @param Mixed $propvalue The value which must be set on the property
	 * @param Number $fuzzy The fuzzy level
	 * @param Mixed $propertyForValue The property that will be used as PROPTAG in VALUES part
	 * @return Array the CONTENT restriction
	 */
	public static function ResContent($property, $propvalue, $fuzzy = FL_FULLSTRING, $propertyForValue = null)
	{
		if($propertyForValue === null) {
			$propertyForValue = $property;
		}

		return array(RES_CONTENT, array(
			ULPROPTAG => $property, 
			FUZZYLEVEL => $fuzzy,
			VALUE => array(
				$propertyForValue => $propvalue
			)
		));
	}

	/**
	 * Create a restriction for adding comments to restrictions which is ignored
	 * by mapi functions. in a special case this can be used in RES_SUBRESTRICTION to
	 * hold RES_PROPERTY restriction that will be applied on given property list.
	 * @param Mixed $restriction The restriction
	 * @param Mixed $properties The property list
	 * @return Array the RES_COMMENT restriction
	 */
	public static function ResComment($restriction, $properties)
	{
		return array(RES_COMMENT, array(
			RESTRICTION => $restriction,
			PROPS => $properties
		));
	}

	/**
	 * Create a subrestriction which is used for placing a restriction on properties
	 * that holds object pointers for attachment and recipient tables.
	 * @param Mixed $property The property wich must be checked
	 * @param Mixed $restriction The subrestriction for the $proptag
	 * @return Array the RES_SUBRESTRICTION restriction
	 */
	public static function ResSubRestriction($property, $restriction)
	{
		return array(RES_SUBRESTRICTION, array(
			ULPROPTAG => $property,
			RESTRICTION => $restriction
		));
	}
}

?>
