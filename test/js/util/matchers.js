const customMatchers = {
	toHaveBeenCalledWithFirstArgument: function() {
		return { 
			compare: function(actual, expected) {
				const result = {pass: false};
				for (var i = 0; i < actual.calls.count(); i++) {
					if (actual.calls.argsFor(i)[0] === expected) {
						result.pass = true;
						break;
					}
				}
				return result;
			}
		};
	},
	toBeEmpty :  function() {
		return {
                       compare: function(actual) {
                               return {
                                       pass: Ext.isEmpty(actual)
                               };
                       }
               };
        },
	toContainClass : function()
	{
		return {
			compare: function(actual, expected) {
				return { pass: Ext.get(actual).hasClass(expected)};
			}
		};
	},
	toBeVisible : function()
	{
		return {
			compare: function(actual) {
				if (Ext.isFunction(actual.isVisible)) {
					return { pass: actual.isVisible() };
				} else {
					return { pass: Ext.get(actual).isVisible() };
				}
			}
		};
	},
	/*
	 * toHaveRegisteredEventHandler checks if the expected Ext.util.Observable contains a listener
	 * for the given eventName. If a scope is also provided, it will check if one of the listeners
	 * on the eventName was registered with the given Scope.
	 */
        toHaveRegisteredEventHandler : function() {
		return {
			compare: function(actual, eventname, scope) {
				if (!(actual instanceof Ext.util.Observable)) {
					throw new Error('Expected an Observable, but got ' + jasmine.pp(actual) + '.');
				}

				const result = {pass: false};
				if (!actual.hasListener(eventname)) {
					result.pass = false;
				}

				if (!scope) {
					result.pass = true;
					result.message =  "Expected Observable to have event listener for " + jasmine.pp(eventname) + " but it did not.";
				} else {
					result.message =  "Expected Observable to have event listener for " + jasmine.pp(eventname) + " with scope " + jasmine.pp(scope) + " but it did not.";
				}

				const listeners = actual.events[eventname].listeners;
				for (let key in listeners) {
					if (listeners[key].scope === scope) {
						result.pass = true;
					}
				}

				return result;
			}
		};
	}
};	

// Override send, so requests aren't made to the server.
XMLHttpRequest.prototype.send = function() {};
