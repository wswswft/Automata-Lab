import { AUTOMATA_STATE_TYPES, toGraphNodeGroup } from "modules/automata-state-types";

export const CONVERTED_AUTOMATA_STORAGE_KEY = "convertedAutomataData";
export const RESTORABLE_NFA_STORAGE_KEY = "restorableNfaData";

function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

function getAutomataData(automataInstance) {
    return {
        nextStateId: automataInstance.nextStateId,
        nextEdgeId: automataInstance.nextEdgeId,
        states: cloneData(automataInstance.states),
        graphNodes: cloneData(automataInstance.graphNodes),
        graphEdges: cloneData(automataInstance.graphEdges)
    };
}

function getAlphabet(states) {
    const alphabet = [];

    for (const state of states) {
        for (const transition of state.transitions) {
            for (const char of transition.chars) {
                if (!alphabet.includes(char)) {
                    alphabet.push(char);
                }
            }
        }
    }

    return alphabet.sort();
}

function hasWholeOuterBraces(name) {
    if (!name.startsWith("{") || !name.endsWith("}")) {
        return false;
    }

    let depth = 0;

    for (let i = 0; i < name.length; i++) {
        if (name[i] === "{") {
            depth++;
        }
        else if (name[i] === "}") {
            depth--;
        }

        if (depth === 0 && i < name.length - 1) {
            return false;
        }
    }

    return depth === 0;
}

function removeOuterBraces(name) {
    let result = name.trim();

    while (hasWholeOuterBraces(result)) {
        result = result.slice(1, -1).trim();
    }

    return result;
}

function getFlatStateNameParts(name) {
    const strippedName = removeOuterBraces(name);

    if (strippedName === "") {
        return [];
    }

    return strippedName
        .split(",")
        .map(part => removeOuterBraces(part.trim()))
        .filter(part => part !== "");
}

function getNormalizedConvertedStateName(name) {
    if (!hasWholeOuterBraces(name.trim())) {
        return name;
    }

    const parts = getFlatStateNameParts(name);

    return parts.length === 0 ? "∅" : `{${parts.join(",")}}`;
}

function getStateNameSet(states) {
    const stateNames = [];

    for (const state of states.slice().sort((a, b) => a.id - b.id)) {
        for (const namePart of getFlatStateNameParts(state.name)) {
            if (!stateNames.includes(namePart)) {
                stateNames.push(namePart);
            }
        }
    }

    return stateNames;
}

function getSubsetKey(states) {
    return getStateNameSet(states).join("\u0001");
}

function getSubsetName(states) {
    const stateNames = getStateNameSet(states);

    return stateNames.length === 0 ? "∅" : `{${stateNames.join(",")}}`;
}

function isFinalSubset(states) {
    return states.some(state => state.type === AUTOMATA_STATE_TYPES.FINAL);
}

function collectNextSubset(subset, symbol, nfaInstance) {
    const nextStates = [];

    for (const state of subset) {
        for (const transition of state.transitions) {
            if (!transition.chars.includes(symbol)) {
                continue;
            }

            const nextState = nfaInstance.findStateById(transition.toId);

            if (nextState && !nextStates.find(state => state.id === nextState.id)) {
                nextStates.push(nextState);
            }
        }
    }

    return nextStates.sort((a, b) => a.id - b.id);
}

function createGraphEdge(edgeId, fromId, toId, chars, graphEdges) {
    const graphEdge = {
        id: edgeId.toString(),
        from: fromId,
        to: toId,
        label: chars.join(",")
    };

    if (graphEdges.find(edge => edge.from === toId && edge.to === fromId)) {
        graphEdge.smooth = {
            type: "curvedCW"
        };
    }

    return graphEdge;
}

function addConvertedTransition(fromState, toState, symbol, graphEdges, nextEdgeId) {
    const existingTransition = fromState.transitions.find(transition => transition.toId === toState.id);

    if (existingTransition) {
        existingTransition.chars.push(symbol);
        const existingEdge = graphEdges.find(edge => edge.from === fromState.id && edge.to === toState.id);
        existingEdge.label = existingTransition.chars.join(",");

        return nextEdgeId;
    }

    fromState.transitions.push({
        toId: toState.id,
        chars: [symbol]
    });
    graphEdges.push(createGraphEdge(nextEdgeId, fromState.id, toState.id, [symbol], graphEdges));

    return nextEdgeId + 1;
}

export function storeConvertedAutomataData(data) {
    sessionStorage.setItem(CONVERTED_AUTOMATA_STORAGE_KEY, JSON.stringify(data));
}

export function loadConvertedAutomataData() {
    const dataString = sessionStorage.getItem(CONVERTED_AUTOMATA_STORAGE_KEY);

    if (!dataString) {
        return null;
    }

    sessionStorage.removeItem(CONVERTED_AUTOMATA_STORAGE_KEY);
    return JSON.parse(dataString);
}

export function storeRestorableNfaData(nfaInstance) {
    sessionStorage.setItem(RESTORABLE_NFA_STORAGE_KEY, JSON.stringify(getAutomataData(nfaInstance)));
}

export function hasRestorableNfaData() {
    return sessionStorage.getItem(RESTORABLE_NFA_STORAGE_KEY) !== null;
}

export function loadRestorableNfaData() {
    const dataString = sessionStorage.getItem(RESTORABLE_NFA_STORAGE_KEY);

    if (!dataString) {
        return null;
    }

    sessionStorage.removeItem(RESTORABLE_NFA_STORAGE_KEY);
    return JSON.parse(dataString);
}

export function convertDfaToNfaData(dfaInstance) {
    const states = cloneData(dfaInstance.states);
    const graphNodes = cloneData(dfaInstance.graphNodes);

    for (const state of states) {
        state.name = getNormalizedConvertedStateName(state.name);

        const graphNode = graphNodes.find(node => node.id === state.id);

        if (graphNode) {
            graphNode.label = state.name;
        }
    }

    return {
        nextStateId: dfaInstance.nextStateId,
        nextEdgeId: dfaInstance.nextEdgeId,
        states,
        graphNodes,
        graphEdges: cloneData(dfaInstance.graphEdges)
    };
}

export function convertNfaToDfaData(nfaInstance) {
    const alphabet = getAlphabet(nfaInstance.states);
    const startState = nfaInstance.states.find(state => state.type === AUTOMATA_STATE_TYPES.START);
    const startSubset = startState ? [startState] : [];
    const subsets = [];
    const subsetMap = new Map();
    const queue = [];
    const states = [];
    const graphNodes = [];
    const graphEdges = [];
    let nextEdgeId = 0;

    const addSubset = subset => {
        const key = getSubsetKey(subset);

        if (subsetMap.has(key)) {
            return subsetMap.get(key);
        }

        const id = states.length;
        const isStart = id === 0;
        const stateType = isStart
            ? AUTOMATA_STATE_TYPES.START
            : (isFinalSubset(subset) ? AUTOMATA_STATE_TYPES.FINAL : AUTOMATA_STATE_TYPES.NORMAL);
        const state = {
            id,
            name: getSubsetName(subset),
            type: stateType,
            transitions: []
        };

        subsetMap.set(key, state);
        subsets.push(subset);
        queue.push(subset);
        states.push(state);
        graphNodes.push({
            id,
            label: state.name,
            group: toGraphNodeGroup(stateType),
            x: 180 * (id % 4),
            y: 140 * Math.floor(id / 4)
        });

        return state;
    };

    addSubset(startSubset);

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {
        const subset = queue[queueIndex];
        const fromState = subsetMap.get(getSubsetKey(subset));

        for (const symbol of alphabet) {
            const nextSubset = collectNextSubset(subset, symbol, nfaInstance);
            const toState = addSubset(nextSubset);

            nextEdgeId = addConvertedTransition(
                fromState,
                toState,
                symbol,
                graphEdges,
                nextEdgeId
            );
        }
    }

    return {
        nextStateId: states.length,
        nextEdgeId,
        states,
        graphNodes,
        graphEdges
    };
}
