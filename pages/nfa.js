import react from "react";
import Head from "next/head";
import Router from "next/router";

import { observer } from "mobx-react-lite";
import { autorun } from "mobx";
import { AppState, APP_STATES } from "observables/app-state";
import { NfaInstance } from "observables/nfa-instance";
import { PropertyEditorData } from "observables/property-editor-data";
import { AlertData } from "observables/alert-data";
import { adjustPropertyEditorPosition } from "modules/utilities";
import {
    loadAutomataData,
    generateNfaJsonString
} from "modules/automata-json";

import DfaPropertyEditor from "components/dfa/dfa-property-editor";
import AutomataToolbar from "components/automata-toolbar";
import NfaRunPanel from "components/nfa/nfa-run-panel";
import AutomataDefinitionPanel from "components/automata-definition-panel";

import { handleGraphClick, handleGraphDragEnd } from "modules/dfa/dfa-page-operations";
import { initGraph, updateGraph } from "modules/graph-operations";
import {
    convertNfaToDfaData,
    loadConvertedAutomataData,
    storeConvertedAutomataData,
    storeRestorableNfaData
} from "modules/automata-conversion";
import { PAGE_PATHS } from "modules/router-paths";

import { isAppleBrowser } from "modules/utilities";

import styles from "styles/dfa-tm.module.scss";
import appStyles from "styles/app.module.scss";

export default class NfaPage extends react.Component {
    constructor(props) {
        super(props);
    }

    isAutomataEmpty = () => {
        return this.pageNfaInstance.isAutomataEmpty;
    };

    loadAutomataJsonString = nfaData => {
        loadAutomataData(nfaData, this.pageNfaInstance);
    };

    exportAutomataJsonString = () => {
        if (this.pageNfaInstance.isAutomataEmpty) {
            this.pageAlertData.showAlertAnimated("NFA为空");
            return null;
        }
        else {
            if (this.pageAppState.currentState === APP_STATES.RUN_AUTOMATA) {
                this.pageNfaInstance.runExit();
                this.pageAppState.changeAppState(APP_STATES.DEFAULT);
            }

            return generateNfaJsonString(this.pageNfaInstance);
        }
    };

    clearAll = () => {
        this.pageAppState.changeAppState(APP_STATES.DEFAULT);
        this.pageNfaInstance.clearAll();
    }

    componentDidMount = () => {
        initGraph(document.getElementById("div-canvas-wrapper"),
            e => {
                handleGraphClick(
                    e,
                    this.pageAppState,
                    this.pageNfaInstance,
                    this.pagePropertyEditorData);
            },
            e => {
                handleGraphDragEnd(
                    e,
                    this.pageAppState,
                    this.pageNfaInstance,
                    this.pagePropertyEditorData);
            });

        autorun(() => {
            updateGraph(
                this.pageNfaInstance.graphNodes,
                this.pageNfaInstance.graphEdges,
                this.pageNfaInstance.reactivityCounter,
                true);
        });

        const convertedData = loadConvertedAutomataData();

        if (convertedData) {
            loadAutomataData(convertedData, this.pageNfaInstance);
        }
    }

    componentDidUpdate = () => {
        adjustPropertyEditorPosition(this.pageAppState, this.pagePropertyEditorData);
    }

    removeSelected = () => {
        switch (this.pageAppState.currentState) {
            case APP_STATES.EDIT_STATE:
                this.pageNfaInstance.removeState(
                    this.pagePropertyEditorData.selectedGraphNodeId
                );

                this.pageAppState.changeAppState(APP_STATES.DEFAULT);

                break;

            case APP_STATES.EDIT_TRANSITION:
                this.pageNfaInstance.removeTransition(
                    this.pagePropertyEditorData.selectedGraphEdgeId
                );

                this.pageAppState.changeAppState(APP_STATES.DEFAULT);

                break;
        }
    };

    runAutomata = () => {
        if (!this.pageNfaInstance.hasStartState) {
            this.pageAlertData.showAlertAnimated("NFA没有开始状态");

            return;
        }

        this.pageAppState.changeAppState(APP_STATES.RUN_AUTOMATA);
        this.pageNfaInstance.initRun();
    };

    convertAutomata = () => {
        if (this.pageNfaInstance.isAutomataEmpty) {
            this.pageAlertData.showAlertAnimated("NFA为空");
            return;
        }

        const convertedData = convertNfaToDfaData(this.pageNfaInstance);
        storeRestorableNfaData(this.pageNfaInstance);
        storeConvertedAutomataData(convertedData);
        Router.push(PAGE_PATHS.DFA_PAGE);
    };

    pageNfaInstance = new NfaInstance();
    pageAppState = new AppState();
    pagePropertyEditorData = new PropertyEditorData();
    pageAlertData = new AlertData();

    pageComponent = observer(({ nfaInstance, appState, propertyEditorData, alertData }) => (
        <main className={styles.mainContentWrapper}>
            <Head>
                <title>Automata Playground - NFA</title>
            </Head>

            <div className={appStyles.divAlert} role="alert" style={{
                display: alertData.isAlertShow ? "block" : "none",
                opacity: alertData.alertOpacity
            }}>
                {alertData.alertMessage}
            </div>

            {
                (appState.currentState === APP_STATES.EDIT_STATE
                    || appState.currentState === APP_STATES.EDIT_TRANSITION)
                &&
                <DfaPropertyEditor
                    appState={appState}
                    dfaInstance={nfaInstance}
                    propertyEditorData={propertyEditorData}
                    allowEmptyTransitionChars
                    className={styles.dfaPropertyEditor}
                    style={{
                        top: propertyEditorData.isPropertyEditorPositionAdjusted
                            || isAppleBrowser()
                            ? propertyEditorData.propertyEditorTop
                            : 0,
                        left: propertyEditorData.isPropertyEditorPositionAdjusted
                            || isAppleBrowser()
                            ? propertyEditorData.propertyEditorLeft
                            : 0
                    }} />
            }

            <AutomataDefinitionPanel
                automataInstance={nfaInstance}
                automataType="NFA" />

            <AutomataToolbar
                appState={appState}
                removeSelected={this.removeSelected}
                runAutomata={this.runAutomata}
                convertAutomata={this.convertAutomata}
                convertAutomataText="转DFA"
                className={styles.bottomToolbar}
                style={{
                    display: appState.currentState === APP_STATES.RUN_AUTOMATA ? "none" : "block"
                }} />

            <NfaRunPanel
                appState={appState}
                nfaInstance={nfaInstance}
                alertData={alertData}
                className={styles.bottomToolbar}
                style={{
                    display: appState.currentState === APP_STATES.RUN_AUTOMATA ? "block" : "none"
                }} />

            <div id="div-canvas-wrapper" className={styles.divCanvasWrapper}></div>
        </main>
    ));

    render = () => (
        <this.pageComponent
            nfaInstance={this.pageNfaInstance}
            appState={this.pageAppState}
            propertyEditorData={this.pagePropertyEditorData}
            alertData={this.pageAlertData} />
    )
}
