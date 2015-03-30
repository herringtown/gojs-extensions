
///////////////////////////////////////////////////////////////////////////////
// @gh here's how you "decorate" a diagram with this mixin functionality :
//    usage : actAsDiagramThatCanOptionallyDragEntireNodeBranches.call(diagram);


if (!createActAsDiagramThatCanOptionallyDragEntireNodeBranches) {


	function createActAsDiagramThatCanOptionallyDragEntireNodeBranches(go, $log, debug) {


		return function (options) {

			options         = options || {};
			options.context = options.context || {};
			debug           = typeof debug === "undefined" ? false : debug;

			// "this" will usually be the diagram, as the usage is actAsDiagramThatCanOptionallyDragEntireNodeBranches.call(diagram);
			var diagram           = options.context.diagram || this;
			var toolManager       = diagram.toolManager;
			var draggingTool      = toolManager.draggingTool;
			var dragSelectingTool = toolManager.dragSelectingTool;

			var defaultConditionsThatTriggerEnablingOfDragTreeAreMet = function () {

				return ((diagram.lastInput.control || diagram.lastInput.alt) && diagram.lastInput.shift);

			};


			var conditionsThatTriggerEnablingOfDragTreeAreMet = options.condition || defaultConditionsThatTriggerEnablingOfDragTreeAreMet;


			var __toolManager_doMouseDown = toolManager.doMouseDown;
			// on mousedown, check to see if the conditions for switching to dragsTree are met...
			toolManager.doMouseDown = function () {


				if (conditionsThatTriggerEnablingOfDragTreeAreMet()) {

					debug && $log.error(" doMousedown > drag tree ACTIVE ");

					toolManager.draggingTool.dragsTree = true;

				} else {

					debug && $log.error(" doMousedown > drag tree INACTIVE ");

					toolManager.draggingTool.dragsTree = false;

				}

				//toolManager.draggingTool.dragsTree = true;

				// do regular toolManager stuff
				//go.ToolManager.prototype.doMouseDown.call(toolManager);
				__toolManager_doMouseDown.call(toolManager);

			};



			var __draggingTool_mayCopy = draggingTool.mayCopy;
			// make sure the default copying behavior is subordinate to this condition
			draggingTool.mayCopy = function () {

				// default rune
				// var mayCopy = go.DraggingTool.prototype.mayCopy.call(draggingTool);
				var mayCopy = __draggingTool_mayCopy.call(draggingTool);


				debug && $log.error(" >>> toolManager.draggingTool.mayCopy () > default > ", mayCopy);

				if (conditionsThatTriggerEnablingOfDragTreeAreMet()) {

					debug && $log.error("      > dragTree is activated, MAY_COPY(on drag) = FALSE...");

					mayCopy = false;

				}

				return mayCopy;

			};



			// @note : b/c other tools may have overriden this behavior, we are NOT calling the prototype method, but a reference
			//         to the current (possibly already overriden) method
			var __draggingTool_canStart = draggingTool.canStart;

			// make sure that dragging WILL activate if the drag tool is active and the dragTree conditions are met
			draggingTool.canStart = function () {

				// default behavior
				//var canStart = go.DraggingTool.prototype.canStart.call(draggingTool);
				var canStart = 	__draggingTool_canStart.call(draggingTool);

				debug && $log.error(" >>> toolManager.draggingTool.canStart () > default > ", canStart);

				if (conditionsThatTriggerEnablingOfDragTreeAreMet()) {

					debug && $log.error("      > dragTree is activated, CAN_START(drag) = TRUE...");

					canStart = true;

				}

				return canStart;

			};



			var __dragSelectingTool_canStart = dragSelectingTool.canStart;

			// make sure that drag selecting WILL NOT activate if the drag tool is active and the dragTree conditions are met
			dragSelectingTool.canStart = function () {

				// default behavior
				//var canStart = go.DragSelectingTool.prototype.canStart.call(dragSelectingTool);
				var canStart = 	__dragSelectingTool_canStart.call(dragSelectingTool);

				debug && $log.error(" >>> toolManager.dragSelectingTool.canStart () > default > ", canStart);

				if (conditionsThatTriggerEnablingOfDragTreeAreMet()) {

					debug && $log.error("      > dragTree is activated, CAN_START(drag select) = FALSE...");

					canStart = false;

				}

				return canStart;

			};


			return this;

		}; // actAs...

	}

}

