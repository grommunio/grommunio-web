(function() {
/**
 * @class Ext.Fx
 * <p>A class to provide basic animation and visual effects support.  <b>Note:</b> This class is automatically applied
 * to the {@link Ext.Element} interface when included, so all effects calls should be performed via {@link Ext.Element}.
 * Conversely, since the effects are not actually defined in {@link Ext.Element}, Ext.Fx <b>must</b> be
 * {@link Ext#enableFx included} in order for the Element effects to work.</p><br/>
 * 
 * <p><b><u>Method Chaining</u></b></p>
 * <p>It is important to note that although the Fx methods and many non-Fx Element methods support "method chaining" in that
 * they return the Element object itself as the method return value, it is not always possible to mix the two in a single
 * method chain.  The Fx methods use an internal effects queue so that each effect can be properly timed and sequenced.
 * Non-Fx methods, on the other hand, have no such internal queueing and will always execute immediately.  For this reason,
 * while it may be possible to mix certain Fx and non-Fx method calls in a single chain, it may not always provide the
 * expected results and should be done with care.  Also see <tt>{@link #callback}</tt>.</p><br/>
 *
 * <p><b><u>Anchor Options for Motion Effects</u></b></p>
 * <p>Motion effects support 8-way anchoring, meaning that you can choose one of 8 different anchor points on the Element
 * that will serve as either the start or end point of the animation.  Following are all of the supported anchor positions:</p>
<pre>
Value  Description
-----  -----------------------------
tl     The top left corner
t      The center of the top edge
tr     The top right corner
l      The center of the left edge
r      The center of the right edge
bl     The bottom left corner
b      The center of the bottom edge
br     The bottom right corner
</pre>
 * <b>Note</b>: some Fx methods accept specific custom config parameters.  The options shown in the Config Options
 * section below are common options that can be passed to any Fx method unless otherwise noted.</b>
 * 
 * @cfg {Function} callback A function called when the effect is finished.  Note that effects are queued internally by the
 * Fx class, so a callback is not required to specify another effect -- effects can simply be chained together
 * and called in sequence (see note for <b><u>Method Chaining</u></b> above), for example:<pre><code>
 * el.slideIn().highlight();
 * </code></pre>
 * The callback is intended for any additional code that should run once a particular effect has completed. The Element
 * being operated upon is passed as the first parameter.
 * 
 * @cfg {Object} scope The scope (<code>this</code> reference) in which the <tt>{@link #callback}</tt> function is executed. Defaults to the browser window.
 * 
 * @cfg {String} easing A valid Ext.lib.Easing value for the effect:</p><div class="mdetail-params"><ul>
 * <li><b><tt>backBoth</tt></b></li>
 * <li><b><tt>backIn</tt></b></li>
 * <li><b><tt>backOut</tt></b></li>
 * <li><b><tt>bounceBoth</tt></b></li>
 * <li><b><tt>bounceIn</tt></b></li>
 * <li><b><tt>bounceOut</tt></b></li>
 * <li><b><tt>easeBoth</tt></b></li>
 * <li><b><tt>easeBothStrong</tt></b></li>
 * <li><b><tt>easeIn</tt></b></li>
 * <li><b><tt>easeInStrong</tt></b></li>
 * <li><b><tt>easeNone</tt></b></li>
 * <li><b><tt>easeOut</tt></b></li>
 * <li><b><tt>easeOutStrong</tt></b></li>
 * <li><b><tt>elasticBoth</tt></b></li>
 * <li><b><tt>elasticIn</tt></b></li>
 * <li><b><tt>elasticOut</tt></b></li>
 * </ul></div>
 *
 * @cfg {String} afterCls A css class to apply after the effect
 * @cfg {Number} duration The length of time (in seconds) that the effect should last
 * 
 * @cfg {Number} endOpacity Only applicable for {@link #fadeIn} or {@link #fadeOut}, a number between
 * <tt>0</tt> and <tt>1</tt> inclusive to configure the ending opacity value.
 *  
 * @cfg {Boolean} remove Whether the Element should be removed from the DOM and destroyed after the effect finishes
 * @cfg {Boolean} useDisplay Whether to use the <i>display</i> CSS property instead of <i>visibility</i> when hiding Elements (only applies to 
 * effects that end with the element being visually hidden, ignored otherwise)
 * @cfg {String/Object/Function} afterStyle A style specification string, e.g. <tt>"width:100px"</tt>, or an object
 * in the form <tt>{width:"100px"}</tt>, or a function which returns such a specification that will be applied to the
 * Element after the effect finishes.
 * @cfg {Boolean} block Whether the effect should block other effects from queueing while it runs
 * @cfg {Boolean} concurrent Whether to allow subsequently-queued effects to run at the same time as the current effect, or to ensure that they run in sequence
 * @cfg {Boolean} stopFx Whether preceding effects should be stopped and removed before running current effect (only applies to non blocking effects)
 */
	Ext.apply(Ext.Fx, {
		/**
		 * Move element outside its wrap
		 * Overridden in order to check for the existence of parentNode before accessing it
		 * IE9 was failing at this point when the container had been destroyed
		 * 
		 * @private
		 * @override
		 */
		fxUnwrap : function(wrap, pos, o) {
			var dom = this.dom;
			Ext.fly(dom).clearPositioning();
			Ext.fly(dom).setPositioning(pos);
			if(!o.wrap){
				var pn = Ext.fly(wrap).dom.parentNode;
				if (pn) {
					pn.insertBefore(dom, wrap); 
					Ext.fly(wrap).remove();
				}
			}
		}
	});
	
	Ext.Element.addMethods(Ext.Fx);
})();
