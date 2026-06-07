import { APP_STATES } from "observables/app-state";
import { AUTOMATA_STATE_TYPES } from "modules/automata-state-types";

import { getNodePosition } from "modules/graph-operations";
import { adjustPropertyEditorPosition } from "modules/utilities";

function getFirstAutomataNodeId(e, automataInstance) {
    return e.nodes.find(nodeId => automataInstance.findGraphNodeById(nodeId));
}

function getFirstAutomataEdgeId(e, automataInstance) {
    return e.edges.find(edgeId => automataInstance.findGraphEdgeById(edgeId));
}

export function handleGraphClick(
    e, pageAppState, pageDfaInstance, pagePropertyEditorData) {
    const clickedNodeId = getFirstAutomataNodeId(e, pageDfaInstance);
    const clickedEdgeId = getFirstAutomataEdgeId(e, pageDfaInstance);

    switch (pageAppState.currentState) {
        case APP_STATES.DEFAULT:
            // if click on node or edge, enter EDIT_STATE or EDIT_TRANSITION state
            if (clickedNodeId !== undefined) {
                pagePropertyEditorData.setSelectedGraphNodeId(clickedNodeId);

                pagePropertyEditorData.setEditorInputText(
                    pageDfaInstance.getStateNameById(
                        pagePropertyEditorData.selectedGraphNodeId),
                    0
                );

                pagePropertyEditorData.setSelectedStateType(
                    pageDfaInstance.getStateTypeById(
                        pagePropertyEditorData.selectedGraphNodeId)
                );

                pagePropertyEditorData.setPropertyEditorPosition(
                    e.event.center.y, e.event.center.x, false);
                
                pageAppState.changeAppState(APP_STATES.EDIT_STATE);
            }
            else if (clickedEdgeId !== undefined) {
                pagePropertyEditorData.setSelectedGraphEdgeId(clickedEdgeId);

                const transitionCharSeq = pageDfaInstance.getTransitionCharSeqById(
                    pagePropertyEditorData.selectedGraphEdgeId);

                pagePropertyEditorData.setEditorInputText(
                    transitionCharSeq,
                    0
                );

                const isCharSeqUnique = pageDfaInstance.isTransitionCharSeqUnique(
                    pagePropertyEditorData.selectedGraphEdgeId, transitionCharSeq
                );

                if (!isCharSeqUnique[0]) {
                    pagePropertyEditorData.showInvalidInputWarning(
                        `已经有字符${isCharSeqUnique[1]}的转移`);
                }

                pagePropertyEditorData.setPropertyEditorPosition(
                    e.event.center.y, e.event.center.x, false);
                
                pageAppState.changeAppState(APP_STATES.EDIT_TRANSITION);
            }
            break;

        case APP_STATES.ADD_STATE_SELECT_POSITION:
            // get click point coordination, get a state name and go to EDIT_STATE
            const newStateName = `q${pageDfaInstance.minimumUnoccupiedStateId}`;
            const newStateType = pageDfaInstance.states.length == 0 ?
                AUTOMATA_STATE_TYPES.START :
                AUTOMATA_STATE_TYPES.NORMAL;

            pageDfaInstance.addState(
                newStateName,
                newStateType,
                e.pointer.canvas.x,
                e.pointer.canvas.y);
            
            pagePropertyEditorData.setSelectedGraphNodeId(pageDfaInstance.nextStateId - 1);

            pagePropertyEditorData.setEditorInputText(
                pageDfaInstance.getStateNameById(
                    pagePropertyEditorData.selectedGraphNodeId),
                0
            );

            pagePropertyEditorData.setSelectedStateType(
                pageDfaInstance.getStateTypeById(
                    pagePropertyEditorData.selectedGraphNodeId)
            );
            
            pagePropertyEditorData.setPropertyEditorPosition(
                e.event.center.y, e.event.center.x,false);

            pageAppState.changeAppState(APP_STATES.EDIT_STATE);

            break;
        
        case APP_STATES.EDIT_STATE:
        case APP_STATES.EDIT_TRANSITION:
            pagePropertyEditorData.clearPropertyEditor();
            pageAppState.changeAppState(APP_STATES.DEFAULT);
            break;

        case APP_STATES.ADD_TRANSITION_SELECT_ORIG:
            if (clickedNodeId !== undefined) {
                pagePropertyEditorData.setSelectedGraphNodeId(clickedNodeId);
                pageAppState.changeAppState(APP_STATES.ADD_TRANSITION_SELECT_DEST);
            }
            break;
            
        case APP_STATES.ADD_TRANSITION_SELECT_DEST:
            if (clickedNodeId !== undefined) {
                // check validity
                pageDfaInstance.addTransition(
                    pagePropertyEditorData.selectedGraphNodeId, clickedNodeId, "0");
                
                pagePropertyEditorData.setSelectedGraphEdgeId(
                    pageDfaInstance.getEdgeId(
                        pagePropertyEditorData.selectedGraphNodeId, e.nodes[0])
                );

                const transitionCharSeq = pageDfaInstance.getTransitionCharSeqById(
                    pagePropertyEditorData.selectedGraphEdgeId);

                // do not set "0" directly because we may be merging transitions.
                pagePropertyEditorData.setEditorInputText(
                    transitionCharSeq,
                    0
                );

                const isCharSeqUnique = pageDfaInstance.isTransitionCharSeqUnique(
                    pagePropertyEditorData.selectedGraphEdgeId, transitionCharSeq
                );

                if (!isCharSeqUnique[0]) {
                    pagePropertyEditorData.showInvalidInputWarning(
                        `已经有字符${isCharSeqUnique[1]}的转移`);
                }

                pagePropertyEditorData.setPropertyEditorPosition(
                    e.event.center.y, e.event.center.x, false);
                
                pageAppState.changeAppState(APP_STATES.EDIT_TRANSITION);
            }
            
        case APP_STATES.RUN_AUTOMATA:
        default:
            break;
    }
}

export function handleGraphDragEnd(
    e, pageAppState, pageDfaInstance, pagePropertyEditorData) {
    const draggedNodeId = getFirstAutomataNodeId(e, pageDfaInstance);

    // update node position storage
    if (draggedNodeId !== undefined) {
        const newCanvasPosition = getNodePosition(draggedNodeId);
        pageDfaInstance.editState(
            draggedNodeId, undefined, undefined, newCanvasPosition.x, newCanvasPosition.y);
    }

    // change node position in pageDfaInstance and change property editor position
    switch (pageAppState.currentState) {
        case APP_STATES.EDIT_STATE:
        case APP_STATES.EDIT_TRANSITION:
            if (draggedNodeId !== undefined || getFirstAutomataEdgeId(e, pageDfaInstance) !== undefined) {
                pagePropertyEditorData.setPropertyEditorPosition(e.event.center.y, e.event.center.x, false);
                adjustPropertyEditorPosition(pageAppState, pagePropertyEditorData);
            }
            break;
    }
}
