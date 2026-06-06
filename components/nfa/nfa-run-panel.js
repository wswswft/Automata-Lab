import { observer } from "mobx-react-lite";

import { APP_STATES } from "observables/app-state";
import { AUTOMATA_STATE_TYPES } from "modules/automata-state-types";

import {
    START_NODE_BKG_COLOR,
    NORMAL_NODE_BKG_COLOR,
    FINAL_NODE_BKG_COLOR
} from "styles/graph-theme";

import styles from "styles/dfa-tm/dfa-tm-run-panel.module.scss";
import classnames from "classnames";

// props requires appState, nfaInstance, alertData
export default observer(props => {
    const showStuckAlert = () => {
        if (props.nfaInstance.isRunningStuck && !props.alertData.isAlertShow) {
            props.alertData.showAlertAnimated("NFA处于卡死状态");
        }
    };

    const onRunSingleStepClick = e => {
        e.stopPropagation();
        props.nfaInstance.runSingleStep();
        showStuckAlert();
    };

    const onRunToEndClick = e => {
        e.stopPropagation();
        props.nfaInstance.runToEnd();
        showStuckAlert();
    };

    const onRunSingleBackClick = e => {
        e.stopPropagation();
        props.nfaInstance.runSingleBack();
    };

    const onRunResetClick = e => {
        e.stopPropagation();
        props.nfaInstance.runReset();
    };

    const onCloseClick = e => {
        e.stopPropagation();
        props.nfaInstance.runExit();
        props.appState.changeAppState(APP_STATES.DEFAULT);
    };

    const onRunStringInput = e => {
        props.nfaInstance.runExit();
        props.nfaInstance.setRunString(e.target.value);
        props.nfaInstance.initRun();
    };

    const getStateStyle = state => ({
        borderStyle: state.type === AUTOMATA_STATE_TYPES.START
            ? "dotted"
            : (state.type === AUTOMATA_STATE_TYPES.FINAL ? "double" : "solid"),
        borderWidth: state.type === AUTOMATA_STATE_TYPES.FINAL ? 5 : 2,
        backgroundColor: state.type === AUTOMATA_STATE_TYPES.START
            ? START_NODE_BKG_COLOR
            : (state.type === AUTOMATA_STATE_TYPES.FINAL
                ? FINAL_NODE_BKG_COLOR
                : NORMAL_NODE_BKG_COLOR)
    });

    return (
        <div className={classnames(
            props.className,
            styles.divRunPanelWrapper)}
            style={props.style}>
            <div className={classnames(
                styles.divRunControlsWrapper,
                "d-flex justify-content-evenly")}>
                <i className={classnames(styles.iRunControl, "fa-solid fa-arrow-rotate-right")}
                    onClick={onRunResetClick}></i>
                <i className={classnames(styles.iRunControl, "fa-solid fa-backward-step")}
                    onClick={onRunSingleBackClick}></i>
                <i className={classnames(styles.iRunControl, "fa-solid fa-forward-step")}
                    onClick={onRunSingleStepClick}></i>
                <i className={classnames(styles.iRunControl, "fa-solid fa-forward-fast")}
                    onClick={onRunToEndClick}></i>
                <i className={classnames(styles.iRunControlClose, "fa-solid fa-xmark")}
                    onClick={onCloseClick}></i>
            </div>

            <div className={classnames(styles.divLowerPartWrapper, "d-flex")}>
                <span className={classnames(
                    styles.spanLowerLeftPartWrapper,
                    "d-flex flex-column justify-content-center")}>
                    <div className={classnames(styles.divStringWrapper, "d-flex flex-wrap")}>
                        {props.nfaInstance.runString.split("").map((x, i) => (
                            <span key={i} className={i < props.nfaInstance.nextRunStringCharIndex
                                ? styles.spanStringCharConsumed : styles.spanStringChar}>{x}</span>
                        ))}
                    </div>

                    <div className={styles.divStringInputWrapper}>
                        <input className={styles.inString}
                            value={props.nfaInstance.runString}
                            onInput={onRunStringInput} />
                    </div>
                </span>

                <span className={classnames(
                    styles.spanLowerRightPartWrapper,
                    "d-flex flex-column justify-content-center align-items-center")}>
                    <span className={styles.spanCurrentStateLabel}>
                        {props.nfaInstance.runStateSetSequence.length - 1}步
                    </span>

                    <span className={styles.spanCurrentStateLabel}>
                        {props.nfaInstance.isCurrentRunAccepting ? "可接受" : "当前状态集"}
                    </span>

                    <span className={classnames(
                        styles.spanCurrentStateSetWrapper,
                        "d-flex justify-content-center align-items-center")}>
                        {props.nfaInstance.currentRunStates.map(state => (
                            <span key={state.id}
                                className={classnames(
                                    styles.spanCurrentState,
                                    styles.spanCurrentStateSetItem)}
                                style={getStateStyle(state)}>
                                {state.name}
                            </span>
                        ))}
                    </span>
                </span>
            </div>
        </div>
    )
});
