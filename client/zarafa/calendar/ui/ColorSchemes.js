/**
 * This file defines the color fields for color schemes that we need for
 * the calendar context.
 */

// Add the fields we need for the calendar colors
// TODO: Gradients are removed by setting the start and end colors to the
// same value. So we now have more color fields than we need. These can
// be removed.
// TODO: The names of the fields are not always very well chosen. They could
// be changed to be more descriptive.
Zarafa.core.ColorSchemes.addField([
	{
		name : 'header',
		weight : 1
	},
	{
		name : 'border',
		weight : 1.80
	},
	{
		name : 'borderInner',
		weight : 1.42
	},
	{
		name : 'startcolorappointment',
		weight : 1
	},
	{
		name : 'endcolorappointment',
		weight : 1
	},
	{
		name : 'startcolorappointmentbox',
		weight : 1.29
	},
	{
		name : 'endcolorappointmentbox',
		weight : 1.29
	},
	{
		name : 'stripnormal',
		weight : 1.86
	},
	{
		name : 'stripworking',
		color : '#ffffff'
	},
	{
		name : 'linenormal',
		weight : 1.73
	},
	{
		name : 'hourline',
		weight : 1.33
	}
]);
