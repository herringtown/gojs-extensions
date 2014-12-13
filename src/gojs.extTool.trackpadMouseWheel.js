

if (!trackpadMouseWheelTool) {

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
	 * @link http://www.gojs.net/latest/api/symbols/Tool.html#standardMouseWheel
	 * @type {function}
	 * @author greg.herrington@gmail.com
	 */
	var trackpadMouseWheelTool = (function (go, $log, debug) {

		if (!go && !go.ToolManager) throw "GoJS not detected";

		$log = $log || console;

		return function trackpadMouseWheel() {

			//$log.error(" > trackpadMouseWheel > ");

			var diagram = this.diagram;
			if (diagram === null) return;

			var e = diagram.lastInput;

			// instead of this you will want to look at e.event.wheelDelta, e.event.wheelDeltaX, and e.event.wheelDeltaY, and decide what direction to scroll.
			var
				delta = e.delta,
				wheelDelta = e.event.wheelDelta,
				wheelDeltaX = e.event.wheelDeltaX,
				wheelDeltaY = e.event.wheelDeltaY
			;


			if (debug) {
				$log.error("__________________________________");
				$log.error("    > diagram.allowVerticalScroll > ", diagram.allowVerticalScroll);
				$log.error("    > diagram.allowVerticalScroll > ", diagram.allowHorizontalScroll);
				$log.error("    > delta > ", delta);
				$log.error("    > wheelDelta > ", wheelDelta);
				$log.error("    > wheelDeltaX > ", wheelDeltaX);
				$log.error("    > wheelDeltaY > ", wheelDeltaY);
				$log.error("    > e.shift > ", e.shift);
				$log.error("    > e.control  > ", e.control);
				$log.error("    > e.meta  > ", e.meta);
				$log.error("    > e.alt   > ", e.alt);
			}

			if (delta === 0) return;

			if (!diagram.documentBounds.isReal()) return;


			var cmd = diagram.commandHandler;
			var wheelBehavior = diagram.toolManager.mouseWheelBehavior;

			if (((wheelBehavior === go.ToolManager.WheelZoom && !e.shift) ||
			     (wheelBehavior === go.ToolManager.WheelScroll && (e.control || e.meta))) &&
			     (delta > 0 ? cmd.canIncreaseZoom() : cmd.canDecreaseZoom())) {

				// zoom in or out at current mouse point
				var oldzoom = diagram.zoomPoint;
				diagram.zoomPoint = e.viewPoint;
				if (delta > 0)
					cmd.increaseZoom();
				else
					cmd.decreaseZoom();
				diagram.zoomPoint = oldzoom;
				e.bubbles = false;

			} else if ((wheelBehavior === go.ToolManager.WheelZoom && e.shift) ||
			           (wheelBehavior === go.ToolManager.WheelScroll && !(e.control || e.meta))) {

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

				if (typeof wheelDeltaX != 'undefined' && typeof wheelDeltaY != 'undefined') {

					// pretty much everything but IE (handles mousewheel, but uses a separate wheel event to expose deltaX/Y )


					// no need to test for shift modifier here as we're explicitly handling directional changes via swipe direction
					if (diagram.allowVerticalScroll) {

						var totalY = Math.abs(wheelDeltaY);

						// scroll up or down
						totalY = (totalY / 40) * cY;

						debug && $log.error("     >>>> scrolling Y-axis "+(wheelDeltaY > 0 ? "UP" : "DOWN")+" by:", totalY);

						if (wheelDeltaY > 0) diagram.scroll('pixel', 'up', totalY);
						else diagram.scroll('pixel', 'down', totalY);

					}

					if (diagram.allowHorizontalScroll) {

						var totalX = Math.abs(wheelDeltaX);

						// scroll left or right
						totalX = (totalX / 40) * cX;

						debug && $log.error("     >>>> scrolling X-axis "+(wheelDeltaX > 0 ? "LEFT" : "RIGHT")+" by:", totalX);

						if (wheelDeltaX > 0) diagram.scroll('pixel', 'left', totalX);
						else diagram.scroll('pixel', 'right', totalX);
					}


				} else { // default to standard behavior

					// for now, IE will fall back to this

					/*_______________________________________
					 |
					 | default GoJS scroll behavior
					 |  (no browser support for wheelDeltaX/Y
					 |_______________________________________
					 |
					 |
					 */

					var total = (delta > 0) ? delta : -delta;
					// 48 pixels is normal (3 lines, 16*3)
					// 120 is the normal delta

					if (!e.shift && diagram.allowVerticalScroll) {

						// scroll up or down
						var c = diagram.scrollVerticalLineChange;
						total = (total / 40) * c;
						if (delta > 0) diagram.scroll('pixel', 'up', total);
						else diagram.scroll('pixel', 'down', total);

					} else if (e.shift && diagram.allowHorizontalScroll) {

						// scroll left or right
						var c = diagram.scrollHorizontalLineChange;
						total = (total / 40) * c;
						if (delta > 0) diagram.scroll('pixel', 'left', total);
						else diagram.scroll('pixel', 'right', total);
					}



				} // endif






				if (!diagram.position.equals(oldpos)) {
					e.bubbles = false;
				}

			} // endif


		};


	})(go, console, true);

}

