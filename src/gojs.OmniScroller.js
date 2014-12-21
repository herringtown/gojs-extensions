

if (!gojsOmniScroller) {

	/**
	 * Creates a new GoJs Tool that enables the trackpad to be used for omnidirectional
	 * panning.  Currently, the standardMouseWheel tool evaluates wheelDelta behavior
	 * that indicates north/south intentions.  This tool looks at the wheelDeltaX values
	 * and directs the panning in the intended (combined) X/Y direction.
	 *
	 * It also gives meta key the same status as ctrl when altering the mousewheel behavior
	 * to zoom instead of scroll (depending on the setting of diagram.toolManager.mouseWheelBehavior)
	 *
	 * overrides/extends diagram.toolManager.standardMouseWheel
	 *
	 * Used as a replacement for the standardMouseWheel Tool, this only works in webkit/safari. FF/IE
	 * use a "wheel" event with different properties which is outlined in W3C as the current standard. (@todo find link )
	 * Therefore, see notes in the trackpadMouseWheel docs below for how to do this in a cross-browser fashion....
	 *
	 * @link http://www.gojs.net/latest/api/symbols/Tool.html#standardMouseWheel
	 * @type {function}
	 * @author greg.herrington@gmail.com
	 */
	var gojsOmniScroller = (function (go, $log, debug) {

		if (!go && !go.ToolManager) throw "GoJS not detected";

		$log = $log || console;

		/**
		 * accommodate a passed event param, or by default use go_js' lastInput.
		 * We are allowing an event to be passed in if the user wants to use an event
		 * that has been normalized across browsers to accommodate "wheel" behavior.
		 *
		 * Because GoJS doesn't listen for & delegate "wheel" (in ie, ust be listened for
		 * explicitly, as there is on "onwheel"), so for now, the suggested use of this "extension"
		 * is to override the standardMouseWheel tool with a noop function and listen
		 * for and normalize "DOMMouseScroll", "mousewheel" and "wheel" separately.
		 *
		 * mozilla has a nice starting point for creating a normalized crossbrowser
		 * wheel listener:
		 * @see https://developer.mozilla.org/en-US/docs/DOM/DOM_event_reference/wheel?redirect=no
		 * @see https://gist.github.com/szarsti/7122282
		 * @param {event} e (optional, but encouraged)
		 * @param {go.Diagram} diagram {when this is used as a handler instead of a drop  in replacement)
		 */
		return function (e, diagram) {

			// if this is part of the ToolManager "this.diagram", else if it's being used as a handler, use the passed in param
			var diagram = diagram || this.diagram;


			if (diagram === null) {
				debug && $log.error(" > trackpadMouseWheel >  diagram not detected!");
				return;
			}

			// instead of this you will want to look at e.event.wheelDelta, e.event.wheelDeltaX, and e.event.wheelDeltaY, and decide what direction to scroll.
			var
				e = e || diagram.lastInput,
				viewPoint = diagram.lastInput.viewPoint, // kind of a hack...
				delta = e.delta,
				deltaX = e.deltaX,
				deltaY = e.deltaY,
				shiftKey = e.shiftKey || e.shift, // normalize between gojs and addWheelListener event
				ctrlKey = e.ctrlKey || e.control,
				metaKey = e.metaKey || e.meta,
				altKey = e.altKey || e.alt,
				wheelDelta = e.wheelDelta,
				wheelDeltaX = e.wheelDeltaX, // old wheel delta event
				wheelDeltaY = e.wheelDeltaY, // old wheel delta
				axis = e.axis,// old FF, not really used
				detail = e.detail// old FF , not really used
				;


			if (debug) {
				$log.error("\n\n__________________________________");
				$log.error("    > diagram.allowVerticalScroll > ", diagram.allowVerticalScroll);
				$log.error("    > diagram.allowVerticalScroll > ", diagram.allowHorizontalScroll);
				$log.error("    > delta > ", delta);
				$log.error("    > * deltaX > ", deltaX);
				$log.error("    > * deltaY > ", deltaY);
				$log.error("    > * wheelDeltaX > ", wheelDeltaX);
				$log.error("    > * wheelDeltaY > ", wheelDeltaY);
				$log.error("    > wheelDelta > ", wheelDelta);
				$log.error("    > axis > ", axis); // older FF
				$log.error("    > detail > ", detail); // older FF
				$log.error("    > e.shift > ", shiftKey);
				$log.error("    > e.control  > ", ctrlKey);
				$log.error("    > e.meta  > ", metaKey);
				$log.error("    > e.alt   > ", altKey);
				$log.error("    > e   > ", e);
				$log.error("    > e.viewPoint > ", viewPoint);
				$log.error("    > diagram.lastInput > ", diagram.lastInput);
			}


			//if (delta === 0) return;

			if (!diagram.documentBounds.isReal()) return;


			var cmd = diagram.commandHandler;
			var wheelBehavior = diagram.toolManager.mouseWheelBehavior;

			if (((wheelBehavior === go.ToolManager.WheelZoom && !(ctrlKey || metaKey)) ||
				(wheelBehavior === go.ToolManager.WheelScroll && (ctrlKey || metaKey))) &&
				(deltaY > 0 ? cmd.canIncreaseZoom() : cmd.canDecreaseZoom())) {


				debug && $log.error(" > zoom mode");


				// zoom in or out at current mouse point
				var oldzoom = diagram.zoomPoint;
				diagram.zoomPoint = viewPoint;
				if (deltaY < 0)
					cmd.increaseZoom();
				else
					cmd.decreaseZoom();
				diagram.zoomPoint = oldzoom;
				e.bubbles = false;

			} else if ((wheelBehavior === go.ToolManager.WheelZoom && (ctrlKey || metaKey)) ||
				(wheelBehavior === go.ToolManager.WheelScroll && !(ctrlKey || metaKey))) {

				var
					oldpos = diagram.position.copy(),
					cY     = diagram.scrollVerticalLineChange,
					cX     = diagram.scrollHorizontalLineChange
					;


				/*______________________________________
				 |
				 | new omnidirectional panning
				 |   (logic based on wheelDeltaX/Y)
				 |______________________________________
				 |
				 |
				 */

				if (typeof deltaX != 'undefined' && typeof deltaY != 'undefined') {

					// pretty much everything but IE (handles mousewheel, but uses a separate wheel event to expose deltaX/Y )

					debug && $log.error(" >  omni-panning mode ...");

					// no need to test for shift modifier here as we're explicitly handling directional changes via swipe direction
					if (diagram.allowVerticalScroll) {

						var totalY = Math.abs(deltaY);

						// scroll up or down
						//totalY = (totalY / 40) * cY;

						debug && $log.error("     >>>> scrolling Y-axis "+(deltaY > 0 ? "UP" : "DOWN")+" by:", totalY);

						if (deltaY < 0) diagram.scroll('pixel', 'up', totalY);
						else diagram.scroll('pixel', 'down', totalY);

					}

					if (diagram.allowHorizontalScroll) {

						var totalX = Math.abs(deltaX);

						// scroll left or right
						//totalX = (totalX / 40) * cX;

						debug && $log.error("     >>>> scrolling X-axis "+(deltaX > 0 ? "LEFT" : "RIGHT")+" by:", totalX);

						if (deltaX < 0) diagram.scroll('pixel', 'left', totalX);
						else diagram.scroll('pixel', 'right', totalX);
					}


				} else { // default to standard behavior


					debug && $log.error(" > browser doesn't support wheel event, or we are not using an addWheelListener polyfill");



				} // endif






				if (!diagram.position.equals(oldpos)) {
					e.bubbles = false;
				}

			} // endif


		};


	})(go, console, false);

}

