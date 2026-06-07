import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { AUTOMATA_STATE_TYPES } from "modules/automata-state-types";

import styles from "styles/automata-definition-panel.module.scss";

const EPSILON_TRANSITION_LABEL = "ε";
const EPSILON_TRANSITION_CHAR = "";

function formatSet(values, emptyText = "∅") {
    if (values.length === 0) {
        return emptyText;
    }

    return `{ ${values.join(", ")} }`;
}

function getSortedStates(automataInstance) {
    return automataInstance.states.slice().sort((a, b) => a.id - b.id);
}

function getAlphabet(states) {
    const symbols = [];

    for (const state of states) {
        for (const transition of state.transitions) {
            for (const char of transition.chars) {
                if (char === EPSILON_TRANSITION_CHAR) {
                    continue;
                }

                if (!symbols.includes(char)) {
                    symbols.push(char);
                }
            }
        }
    }

    return symbols.sort();
}

function getTransitionRows(states, automataInstance, automataType) {
    const transitionMap = new Map();

    for (const state of states) {
        for (const transition of state.transitions) {
            const symbols = transition.chars.length === 0
                ? [EPSILON_TRANSITION_LABEL]
                : transition.chars.map(symbol => symbol === EPSILON_TRANSITION_CHAR
                    ? EPSILON_TRANSITION_LABEL
                    : symbol);

            for (const symbol of symbols) {
                const key = `${state.id}:${symbol}`;
                const nextStateName = automataInstance.getStateNameById(transition.toId);

                if (!transitionMap.has(key)) {
                    transitionMap.set(key, {
                        fromName: state.name,
                        symbol,
                        toNames: []
                    });
                }

                const row = transitionMap.get(key);

                if (nextStateName && !row.toNames.includes(nextStateName)) {
                    row.toNames.push(nextStateName);
                }
            }
        }
    }

    return Array.from(transitionMap.values()).map(row => ({
        ...row,
        toText: automataType === "NFA"
            ? formatSet(row.toNames.sort())
            : row.toNames[0] ?? "∅"
    }));
}

const AutomataDefinitionPanel = ({ automataInstance, automataType, className, style }) => {
    const panelRef = useRef(null);
    const dragDataRef = useRef(null);
    const pointerMoveHandlerRef = useRef(null);
    const pointerUpHandlerRef = useRef(null);
    const [position, setPosition] = useState(null);
    const states = getSortedStates(automataInstance);
    const stateNames = states.map(state => state.name);
    const alphabet = getAlphabet(states);
    const startState = states.find(state => state.type === AUTOMATA_STATE_TYPES.START);
    const finalStates = states
        .filter(state => state.type === AUTOMATA_STATE_TYPES.FINAL)
        .map(state => state.name);
    const transitionRows = getTransitionRows(states, automataInstance, automataType);
    const transitionDomain = automataType === "NFA" ? "Q × (Σ ∪ {ε})" : "Q × Σ";
    const transitionTarget = automataType === "NFA" ? "2^Q" : "Q";

    const removeDragListeners = () => {
        if (pointerMoveHandlerRef.current) {
            document.removeEventListener("pointermove", pointerMoveHandlerRef.current);
            pointerMoveHandlerRef.current = null;
        }

        if (pointerUpHandlerRef.current) {
            document.removeEventListener("pointerup", pointerUpHandlerRef.current);
            pointerUpHandlerRef.current = null;
        }
    };

    useEffect(() => removeDragListeners, []);

    const onTitlePointerDown = e => {
        if (!panelRef.current) {
            return;
        }

        const rect = panelRef.current.getBoundingClientRect();

        dragDataRef.current = {
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            panelWidth: rect.width,
            panelHeight: rect.height
        };

        setPosition({
            left: rect.left,
            top: rect.top
        });

        pointerMoveHandlerRef.current = event => {
            const dragData = dragDataRef.current;

            if (!dragData) {
                return;
            }

            const maxLeft = window.innerWidth - dragData.panelWidth - 8;
            const maxTop = window.innerHeight - dragData.panelHeight - 8;
            const nextLeft = Math.min(
                Math.max(8, event.clientX - dragData.offsetX),
                Math.max(8, maxLeft)
            );
            const nextTop = Math.min(
                Math.max(8, event.clientY - dragData.offsetY),
                Math.max(8, maxTop)
            );

            setPosition({
                left: nextLeft,
                top: nextTop
            });
        };

        pointerUpHandlerRef.current = () => {
            dragDataRef.current = null;
            removeDragListeners();
        };

        document.addEventListener("pointermove", pointerMoveHandlerRef.current);
        document.addEventListener("pointerup", pointerUpHandlerRef.current);
    };

    const panelPositionStyle = position
        ? {
            left: position.left,
            right: "auto",
            top: position.top
        }
        : {};

    return (
        <aside
            ref={panelRef}
            className={`${styles.divDefinitionPanel} ${className ?? ""}`}
            style={{ ...style, ...panelPositionStyle }}>
            <div className={styles.divTitleRow} onPointerDown={onTitlePointerDown}>
                <span className={styles.spanType}>{automataType}</span>
                <span className={styles.spanTuple}>A = (Q, Σ, δ, q₀, F)</span>
            </div>

            <dl className={styles.dlDefinitionList}>
                <div>
                    <dt>Q</dt>
                    <dd>{formatSet(stateNames)}</dd>
                </div>
                <div>
                    <dt>Σ</dt>
                    <dd>{formatSet(alphabet)}</dd>
                </div>
                <div>
                    <dt>δ</dt>
                    <dd>{transitionDomain} → {transitionTarget}</dd>
                </div>
                <div>
                    <dt>q₀</dt>
                    <dd>{startState?.name ?? "未设置"}</dd>
                </div>
                <div>
                    <dt>F</dt>
                    <dd>{formatSet(finalStates)}</dd>
                </div>
            </dl>

            <div className={styles.divTransitionTableWrapper}>
                <table className={styles.tableTransitionTable}>
                    <thead>
                        <tr>
                            <th>状态</th>
                            <th>输入</th>
                            <th>结果</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            transitionRows.length === 0
                                ? (
                                    <tr>
                                        <td colSpan="3" className={styles.tdEmpty}>
                                            暂无转移
                                        </td>
                                    </tr>
                                )
                                : transitionRows.map(row => (
                                    <tr key={`${row.fromName}:${row.symbol}`}>
                                        <td>{row.fromName}</td>
                                        <td>{row.symbol}</td>
                                        <td>{row.toText}</td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>
        </aside>
    );
};

export default observer(AutomataDefinitionPanel);
