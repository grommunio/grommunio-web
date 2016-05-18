Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.IconCache
 * @extends Object
 * @singleton
 *
 * Special class which contains a number of
 * icons which are used within the Calendar.
 * These icons can be used inside the Canvas
 * for drawing, because this implies that the
 * images must be downloaded to the client,
 * we do that in this cache class.
 */
Zarafa.calendar.ui.IconCache = {

	/**
	 * Obtain a dashed Image object
	 * @return {Image} The dashed image
	 */
	getDashedImage : function()
	{
		var image = new Image();
		image.src = 'data:image/gif;base64,R0lGODlhCAAIAIABAP///wAAACH5BAEKAAEALAAAAAAIAAgAAAIPhIN2qRgKHIwPslZxpq8AADs=';
		return function () { return image; };
	}(),

	/**
	 * Obtain a icon for Private appointments
	 * @return {Image} The private icon
	 */
	getPrivateIcon : function()
	{
		var image = new Image();
		image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADaSURBVCiRfZE9SkNRFIS/GbMBW0uthKQVBCEbMNroBrIE95BtBMGfgJDKFYQUWgQEwR1Y2VgYbQxMCl/kRd/NwMA9l++eM5xLEpoMnEt6kvQhaQb0klCCjyWl5kdJn8CJKmBNtp+BzqpOsi1pCixa/+gf7dQLSe/Vce7Cg7fC/UtT/v6f/CsvgO7aBEm7tveBe+ALGAMPkm6TtJNM6p1PJcX2je1roNu4wQq+kPRq+8r2CDja8D+cSZravrR9BxyW4CRQxRhKGgMHm+AkbAHfwF6SQZJZYZ2/WgIY6MDMF1W9zwAAAABJRU5ErkJggg==';
		return function() { return image; };
	}(),

	getPrivateIconActive : function()
	{
		var image = new Image();
		image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADDSURBVCiRhZExakJREEWPNtbiDtIJsRJSCX8DUQnoBlyCZZaRBaRRYyUWtjaioIUgCNlBKrEzSfXhpPnKN7ynFwZmhjszd2ZQiVhX3akndas2VWLkZ6+xUX/UVkElgD1Qy8VlYAmksYIjUAnkv4shNnCI5D9D+nuGkarJ/wkPQBWYAb/ABFgDH8AjsMh3bmedRupQTUIXPDt99UsdqGO1EftPEegAL8AcKAFvwCqyNGQy3tWJ+nTj8xdJr+pUrd8jq/wBj4Qn+tCooUUAAAAASUVORK5CYII=';
		return function() { return image; };
	}(),

	/**
	 * Obtain a icon for Recurring appointments
	 * @return {Image} The recurring icon
	 */
	getRecurringIcon : function()
	{
		var image = new Image();
		image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAMCAYAAABbayygAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAC8SURBVBiVjdAxSoNhEITh5wsBK0EkeIUUVqaytAsWKTyBjW1IpaAewsbCI1h4gBQeQ8EiB7ASjIkQElmbTfj4IeLCwMK+DDsjItTCHlq5X+MgItTACG8ILPCCJR7yruAJn7jEEU4SDKxwCOf4QrdyP05orTG84qr5a1MF+5hGxMofU9aPbgVK6WDxH/ARO3CLKWaYY1iFOsMPerCL90z3gQFOcZ/V3GwKx0WCE3yn8zP6G/cEW7ir9naznl/h/Yxfc66Y/AAAAABJRU5ErkJggg==';
		return function() { return image; };
	}(),

	/**
	 * Obtain a icon for Recurring appointments that are active
	 * @return {Image} The recurring icon
	 */
	getRecurringIconActive : function()
	{
		var image = new Image();
		image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAMCAYAAABbayygAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAC+SURBVBiVjdA9SoNRFITh+ULAShARt2BhpZWlnVhYZAU2tmKloC7CJoVLsHABFi7DQIosIJVg/IFg5LHwfnATJGRg4MB5Gc6ZIAveQKfM19hGauACQ3+a4gXfuG/BBo94wyX2cFhAmGE3OMU7dqr0A/N6Cga4+ufWOTfYTDJJMssSNVi2T5KtJNNVwIcka8EtJvjAJ86r23r4wX6wjnH57hUnOEa/VHNTF35WwBG+SvIzjtr0Fuzgrpq7i/X8AnV2PLeO7j8sAAAAAElFTkSuQmCC';
		return function() { return image; };
	}(),

	/**
	 * Obtain a icon for Exception appointments
	 * @return {Image} The exception icon
	 */
	getExceptionIcon : function()
	{
		var image = new Image();
		image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADlSURBVCiRfdG9LsRBFMbhZ3wUQmk7dFuQyMqWmyAhEbRb2HtwAUTpClBpJFpXoBGVXkMh8dFJkG0QiUJG4SxT/NdJTjFzzm/yvu/APmZyzqoa25gszjp4RAObOMcb7nCKT5z8AkFtxOAKa6hhGpfI0Ys5ZwN+qh7L4+jmnF8wgTl/dZBSGoQR3GAK63hCq6+nkDRUmFrBc09CJVCRzFJAy70HMdwXiKWFgFaxhcNS0hle8Y4PtOO+hW7M6mVKOxjDKB5wnVJqYh4pYp2FUsIRvnCBe9ziOP6jGel1SqCG3X88NbD3DfGjzICsYsYEAAAAAElFTkSuQmCC';
		return function() { return image; };
	}(),

	getExceptionIconActive : function()
	{
		var image = new Image();
		image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADsSURBVCiRfdHNKsRRHMbxJy+zMSuZjYWNUuyU15IkUmY1WbsA5QJkaa/kDiyVS+AOrGdjITWi7OQlpI/FHPzNwlNP53ee0/fX+Z0THGMKqXgEA6Xew9j3WdBCB7M4xLWu3tEu61kVCLbxgXvsYg5NXPnVWhU4LZ3vMFOydX/VxmAwjjfMYxW3WOiZ6cffxWglXC7Q0n9ArxcLtFL2dTT+A1JerVOGPcJlFTjHI57wgq2ST+MBn9hA+tLVfpJ6kqEkd0kekzST7CQZTvKcpJbkz5VOSqfr8lmvuMAmJnGDVhVo4KDU/aj1zDSB4y/Ev7tGkhQziQAAAABJRU5ErkJggg==';
		return function() { return image; };
	}(),

	/**
	 * Obtain a icon for Meetings
	 * @return {Image} The meeting icon
	 */
	getMeetingIcon : function()
	{
		var image = new Image();
		image.src = 'data:image/png;base64,'+
			'iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz' +
			'AAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHRSURB' +
			'VCiRnZNNa1pBFIafuc4dGxdSibaIgg2kKZSCItKNuHRhf4H9WInLLov5Af4GweX9A125cRPINhRE' +
			'IUWK2Un01uIm4tfccKeL4BdtF83AYQ7nzHvOe17OCGMMjz3WxnEcZ+U4zpP9pOM4f1Tej4kPn78a' +
			'gLPodwbT1xgjtg9fxa758evNAXg/JgGOw6csFt94FjlDqSOUrZBSMv95xcsXb7n37tGeRmvNfH7F' +
			'cfiU6d3NjvZSvscSNpawsCyLQCDA0+QXAoEAwhII8WBL+XHLQgJM724eJZj89O6ITCbz38But/vQ' +
			'GWA8HmPbNp7nYds26/UaKSVa6+29yadSqR1tACkl0WiU0WhEvV4HwPf9f5oxZgdeLpfc3t6yWq0I' +
			'h8Pkcjm01lSrVUKhEABaa5rNJovFgk6ns1NbKUUikUApRTAYpFKpkE6nqdVq9Pt9XNfl/PycZDJJ' +
			'sVhEKbXrbIxhMpmwWVfbtsnn8wghaDQaeJ5HqVQim80SiUQOZ47H4wdqGmPo9XoMh0PK5TKz2YzB' +
			'YEA8Ht+CRbvddn3ff74PbLVaFAoFTk5OyGazGGO2Il1eXuK6LhcXF4i//apyuWxisdiB4psCvu/j' +
			'eR6TyYTf1e/eakeXUAkAAAAASUVORK5CYII=';
		return function() { return image; };
	}(),

	/**
	 * Obtain a icon for appointments with reminders
	 * @return {Image} The reminder icon
	 */
	getReminderIcon : function()
	{
		var image = new Image();
		image.src = 'data:image/gif;base64,' +
			'R0lGODlhEgAMAPcAAAQCBPz+/AAAQQAAfk8AAB4A8AAA/QAAf5i/bB495AA/EgB3AABzWgC0iBVBQQB+' +
			'fg4gLADj5AASEgAAAAAsKgIAiAAAQQAAfgAADAEAAACFAACBAIi+2OKU1BJBewB+AOkt7OW01IFBe3x+' +
			'AABEFAADAAEIAAAAAFYgAQAAAAAAAAAAAJC+AOEDABI9AAAAAHMSAAAAAAAAAAACALAAEOIAABIAAAAA' +
			'ABieAO4CAJAAAHwAAHABAAUAAJEAAHwAAP/YAP/xAP8SAP8AAG0QAAX3AJFFAHwAAIUgAecAAIEAAHwA' +
			'AABONQBvNhV0MgAgNWBhIAMgJQBmIABpAIBsEOll6RsAEgAAAJAMV2UABBUARAAAfgAAMAAAiAAAQQAA' +
			'fn5g/wBj/wBQ/8AA/wABKgAAiAAAQQAAfv9gm/9juP9QQf8Afv+QAP/jAP8SAP8AAACYoADVnABBRQB+' +
			'AABEjgADAwAIQAAAAAAgDAAAABUAAAAAAPK+YGsDngA9gAAAfMASUOIA1RIAFQACAJ8BAOsAAIEAAHwA' +
			'AErYB+PjAIESAHwAAMBFAHbVAFBBAAB+AJBEAGUD0AEIFQAAAGwgAAAAAAAAAAAAAPzyAOFrABIAAAAA' +
			'ADTYAADjAAASAMAAAPiFAPcrABKDAAB8ABgAaO4AnpAAgHwAfHAA/wUA/5EA/3wA//8AYP8Anv8AgP8A' +
			'fG0APgUBAJEAAHwAAErpPvQrAICDAHx8AAD8SADj6xUSEgAAAADE/wAr/wCD/wB8/5AAAGUAABUAAAAA' +
			'AABQBAHV5QAVEgAAAAA0vgBkOwCDTAB8AFf/5PT/5ID/Enz/AOgAd+PlEBISTwAAAJBtGGVk5RWDEgB8' +
			'AOMMNOoUZJBPg3wAfOzUxuIy5RJPEgAAADgAwAAB/wAA/wAAfzj8iADj5QASEgAAAAIAUAAB1QAAFQAA' +
			'AAGINABkZACDgwB8fMwBUAUA1U4AFZ8AADAA8gAAawAAAAAAAACgAACcAABFAAAAANhs6dTkznsSRwAA' +
			'ACH5BAEAAAEALAAAAAASAAwABwg9AAMIHEiwYEEABxEeJKhQIICGDg0qfPhwIMSFFg0GoLhR4saKGBlq' +
			'7HiRJMaSEzN21JjSIsWJL0c65GgwIAA7';
		return function() { return image; };
	}()
};
