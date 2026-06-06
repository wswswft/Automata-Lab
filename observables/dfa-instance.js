import { makeAutoObservable } from "mobx";
import {
    AUTOMATA_STATE_TYPES,
    toGraphNodeGroup
} from "modules/automata-state-types";

function getLabelFromTransitionChars(chars) {
    return chars.join(",");
}

function getUniqueChars(charSeq) {
    const uniqueChars = [];

    for (const char of charSeq) {
        if (!uniqueChars.includes(char)) {
            uniqueChars.push(char);
        }
    }

    return uniqueChars;
}

export class DfaInstance {
    constructor() {
        makeAutoObservable(this, {
            findStateById: false,
            findGraphNodeById: false,
            findGraphEdgeById: false,
            findTransitionByEdge: false,
            updateGraphEdgeLabel: false,
            increaseReactivityCounter: false,
            getStateNameById: false,
            getStateTypeById: false,
            getEdgeId: false,
            getTransitionCharSeqById: false,
            isStateNameUnique: false,
            isTransitionCharSeqUnique: false
        });
    }

    ///////////////////////////////// Observable /////////////////////////////////
    // Used to help subscribe array changes. It should be changed after other data updates.
    reactivityCounter = 0;
    nextStateId = 0;
    nextEdgeId = 0;

    // State: { id, name, type, transitions: Array<{ toId, chars }> }
    states = [];

    // GraphNode: { id, label, group, x, y }
    graphNodes = [];

    // GraphEdge: { id, from, to, label, smooth? }
    graphEdges = [];

    ///// Run automata data
    runString = "010";
    nextRunStringCharIndex = 0;
    runStateSequence = [];
    isRunningStuck = false;

    ///////////////////////////////// Lookup helpers /////////////////////////////////
    findStateById(id) {
        return this.states.find(state => state.id === id);
    }

    findGraphNodeById(id) {
        return this.graphNodes.find(node => node.id === id);
    }

    findGraphEdgeById(id) {
        return this.graphEdges.find(edge => edge.id === id);
    }

    findTransitionByEdge(edge) {
        return this.findStateById(edge.from)
            ?.transitions.find(transition => transition.toId === edge.to);
    }

    updateGraphEdgeLabel(edge, chars) {
        edge.label = getLabelFromTransitionChars(chars);
    }

    increaseReactivityCounter() {
        this.reactivityCounter++;
    }

    ///////////////////////////////// ComputedFn /////////////////////////////////
    isStateNameUnique(name) {
        return this.states.find(state => state.name === name) === undefined;
    }

    // return [isUnique, firstDuplicatedChar]
    isTransitionCharSeqUnique(id, charSeq) {
        const targetEdge = this.findGraphEdgeById(id);
        const fromState = this.findStateById(targetEdge.from);

        for (const transition of fromState.transitions) {
            if (transition.toId === targetEdge.to) {
                continue;
            }

            for (const char of charSeq) {
                if (transition.chars.includes(char)) {
                    return [false, char];
                }
            }
        }

        return [true, ""];
    }

    getStateNameById(id) {
        return this.findStateById(id)?.name ?? "";
    }

    getStateTypeById(id) {
        return this.findStateById(id)?.type ?? AUTOMATA_STATE_TYPES.NORMAL;
    }

    getEdgeId(fromId, toId) {
        return this.graphEdges.find(edge => edge.from === fromId && edge.to === toId)?.id ?? "";
    }

    getTransitionCharSeqById(id) {
        const targetEdge = this.findGraphEdgeById(id);

        if (!targetEdge) {
            return "";
        }

        return this.findTransitionByEdge(targetEdge)?.chars.join("") ?? "";
    }

    ///////////////////////////////// Computed /////////////////////////////////
    get minimumUnoccupiedStateId() {
        for (let i = 0; i <= this.nextStateId; i++) {
            if (this.findStateById(i) === undefined) {
                return i;
            }
        }
    }

    get hasStartState() {
        return this.states.find(state => state.type === AUTOMATA_STATE_TYPES.START) !== undefined;
    }

    get currentRunState() {
        return this.runStateSequence[this.runStateSequence.length - 1] ?? { name: "" };
    }

    get isAutomataEmpty() {
        return this.states.length === 0;
    }

    ///////////////////////////////// Run automata actions /////////////////////////////////
    setGraphNodeGroup(state, isCurrent) {
        const targetGraphNode = this.findGraphNodeById(state.id);
        targetGraphNode.group = toGraphNodeGroup(state.type, isCurrent);
    }

    setRunString(runString) {
        this.runString = runString;
    }

    initRun() {
        this.nextRunStringCharIndex = 0;
        this.runStateSequence = [
            this.states.find(state => state.type === AUTOMATA_STATE_TYPES.START)
        ];
        this.setGraphNodeGroup(this.currentRunState, true);
        this.isRunningStuck = false;
    }

    runExit() {
        this.setGraphNodeGroup(this.currentRunState, false);
    }

    runSingleStep() {
        if (this.nextRunStringCharIndex > this.runString.length - 1 || this.isRunningStuck) {
            return;
        }

        const currentChar = this.runString[this.nextRunStringCharIndex];
        const nextTransition = this.currentRunState.transitions.find(
            transition => transition.chars.includes(currentChar)
        );

        if (!nextTransition) {
            this.isRunningStuck = true;
            return;
        }

        this.setGraphNodeGroup(this.currentRunState, false);
        this.runStateSequence.push(this.findStateById(nextTransition.toId));
        this.setGraphNodeGroup(this.currentRunState, true);
        this.nextRunStringCharIndex++;
        this.isRunningStuck = false;
    }

    runToEnd() {
        for (let i = this.nextRunStringCharIndex; i < this.runString.length; i++) {
            if (this.isRunningStuck) {
                break;
            }

            this.runSingleStep();
        }
    }

    runSingleBack() {
        if (this.nextRunStringCharIndex === 0) {
            return;
        }

        this.setGraphNodeGroup(this.currentRunState, false);
        this.runStateSequence.pop();
        this.setGraphNodeGroup(this.currentRunState, true);
        this.isRunningStuck = false;
        this.nextRunStringCharIndex--;
    }

    runReset() {
        this.setGraphNodeGroup(this.currentRunState, false);
        this.nextRunStringCharIndex = 0;
        this.runStateSequence = [
            this.states.find(state => state.type === AUTOMATA_STATE_TYPES.START)
        ];
        this.setGraphNodeGroup(this.currentRunState, true);
        this.isRunningStuck = false;
    }

    ///////////////////////////////// Load and reset actions /////////////////////////////////
    loadData(nextStateId, nextEdgeId, states, graphNodes, graphEdges) {
        this.nextStateId = nextStateId;
        this.nextEdgeId = nextEdgeId;
        this.states = states;
        this.graphNodes = graphNodes;
        this.graphEdges = graphEdges;
        this.reactivityCounter = 0;
    }

    clearAll() {
        this.nextStateId = 0;
        this.nextEdgeId = 0;
        this.states = [];
        this.graphNodes = [];
        this.graphEdges = [];
        this.reactivityCounter = 0;
    }

    ///////////////////////////////// State and transition actions /////////////////////////////////
    addState(name, stateType, x, y) {
        const stateId = this.nextStateId;

        this.states.push({
            id: stateId,
            name,
            type: stateType,
            transitions: []
        });

        this.graphNodes.push({
            id: stateId,
            label: name,
            group: toGraphNodeGroup(stateType),
            x,
            y
        });

        this.nextStateId++;
        this.increaseReactivityCounter();
    }

    addTransition(fromId, toId, charSeq) {
        const chars = getUniqueChars(charSeq);
        const fromTransitions = this.findStateById(fromId).transitions;
        const fromTransition = fromTransitions.find(transition => transition.toId === toId);

        if (fromTransition) {
            for (const char of chars) {
                if (!fromTransition.chars.includes(char)) {
                    fromTransition.chars.push(char);
                }
            }

            this.updateGraphEdgeLabel(
                this.graphEdges.find(edge => edge.from === fromId && edge.to === toId),
                fromTransition.chars
            );
        }
        else {
            fromTransitions.push({ toId, chars });
            this.graphEdges.push(this.createGraphEdge(fromId, toId, chars));
            this.nextEdgeId++;
        }

        this.increaseReactivityCounter();
    }

    createGraphEdge(fromId, toId, chars) {
        const newEdge = {
            id: this.nextEdgeId.toString(),
            from: fromId,
            to: toId,
            label: getLabelFromTransitionChars(chars)
        };

        if (this.graphEdges.find(edge => edge.from === toId && edge.to === fromId)) {
            newEdge.smooth = {
                type: "curvedCW"
            };
        }

        return newEdge;
    }

    editState(id, newName, newType, newX, newY) {
        const targetState = this.findStateById(id);
        const targetGraphNode = this.findGraphNodeById(id);

        if (newName != null) {
            targetState.name = newName;
            targetGraphNode.label = newName;
        }

        if (newType != null) {
            targetState.type = newType;
            targetGraphNode.group = toGraphNodeGroup(newType);
        }

        if (newX != null) {
            targetGraphNode.x = newX;
        }

        if (newY != null) {
            targetGraphNode.y = newY;
        }

        this.increaseReactivityCounter();
    }

    editTransition(id, newCharSeq) {
        const selectedGraphEdge = this.findGraphEdgeById(id);
        const newChars = getUniqueChars(newCharSeq);

        this.updateGraphEdgeLabel(selectedGraphEdge, newChars);
        this.findTransitionByEdge(selectedGraphEdge).chars = newChars;
        this.increaseReactivityCounter();
    }

    removeState(id) {
        for (let i = this.states.length - 1; i >= 0; i--) {
            if (this.states[i].id === id) {
                this.states.splice(i, 1);
                continue;
            }

            this.removeTransitionsToState(this.states[i], id);
        }

        this.graphNodes.splice(this.graphNodes.findIndex(node => node.id === id), 1);

        for (let i = this.graphEdges.length - 1; i >= 0; i--) {
            if (this.graphEdges[i].from === id || this.graphEdges[i].to === id) {
                this.graphEdges.splice(i, 1);
            }
        }

        this.increaseReactivityCounter();
    }

    removeTransitionsToState(state, targetStateId) {
        for (let i = state.transitions.length - 1; i >= 0; i--) {
            if (state.transitions[i].toId === targetStateId) {
                state.transitions.splice(i, 1);
            }
        }
    }

    removeTransition(id) {
        const edgeIndex = this.graphEdges.findIndex(edge => edge.id === id);
        const edgeToBeRemoved = this.graphEdges.splice(edgeIndex, 1)[0];
        const reverseEdge = this.graphEdges.find(
            edge => edge.from === edgeToBeRemoved.to && edge.to === edgeToBeRemoved.from
        );

        if (reverseEdge) {
            delete reverseEdge.smooth;
        }

        const transitionFromState = this.findStateById(edgeToBeRemoved.from);
        const transitionIndex = transitionFromState.transitions.findIndex(
            transition => transition.toId === edgeToBeRemoved.to
        );

        transitionFromState.transitions.splice(transitionIndex, 1);
        this.increaseReactivityCounter();
    }
}
