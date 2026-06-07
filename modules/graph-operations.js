import { Network } from "vis-network";
import { GROUP_COLOR_OPTIONS } from "styles/graph-theme";
import { GRAPH_NODE_GROUPS } from "modules/automata-state-types";

let network = undefined;
const START_ARROW_NODE_PREFIX = "__start-arrow-node-";
const START_ARROW_LABEL_NODE_PREFIX = "__start-arrow-label-node-";
const START_ARROW_EDGE_PREFIX = "__start-arrow-edge-";

function isStartGraphNode(node) {
    return node.group === GRAPH_NODE_GROUPS.START
        || node.group === GRAPH_NODE_GROUPS.START_CURRENT;
}

function createStartArrowNode(startNode) {
    return {
        id: `${START_ARROW_NODE_PREFIX}${startNode.id}`,
        label: "",
        x: startNode.x - 82,
        y: startNode.y,
        fixed: true,
        physics: false,
        shape: "dot",
        size: 1,
        color: {
            background: "rgba(0, 0, 0, 0)",
            border: "rgba(0, 0, 0, 0)",
            highlight: {
                background: "rgba(0, 0, 0, 0)",
                border: "rgba(0, 0, 0, 0)"
            },
            hover: {
                background: "rgba(0, 0, 0, 0)",
                border: "rgba(0, 0, 0, 0)"
            }
        },
        margin: 0
    };
}

function createStartArrowLabelNode(startNode) {
    return {
        id: `${START_ARROW_LABEL_NODE_PREFIX}${startNode.id}`,
        label: "start",
        x: startNode.x - 132,
        y: startNode.y,
        fixed: true,
        physics: false,
        shape: "box",
        margin: 0,
        borderWidth: 0,
        color: {
            background: "rgba(0, 0, 0, 0)",
            border: "rgba(0, 0, 0, 0)",
            highlight: {
                background: "rgba(0, 0, 0, 0)",
                border: "rgba(0, 0, 0, 0)"
            },
            hover: {
                background: "rgba(0, 0, 0, 0)",
                border: "rgba(0, 0, 0, 0)"
            }
        },
        font: {
            color: "#000000",
            face: "Libre Baskerville",
            size: 18
        }
    };
}

function createStartArrowEdge(startNode) {
    return {
        id: `${START_ARROW_EDGE_PREFIX}${startNode.id}`,
        from: `${START_ARROW_NODE_PREFIX}${startNode.id}`,
        to: startNode.id,
        arrows: "to",
        color: {
            color: "#3e3e3e",
            hover: "#3e3e3e",
            highlight: "#3e3e3e",
            inherit: false
        },
        label: "",
        physics: false,
        smooth: false,
        width: 2
    };
}

function getNodeWithStartArrowStyle(node) {
    if (node.group === GRAPH_NODE_GROUPS.START) {
        return {
            ...node,
            group: GRAPH_NODE_GROUPS.NORMAL
        };
    }

    return node;
}

function getGraphDataWithStartArrows(nodes, edges) {
    const startNodes = nodes.filter(isStartGraphNode);

    if (startNodes.length === 0) {
        return { nodes, edges };
    }

    return {
        nodes: [
            ...nodes.map(getNodeWithStartArrowStyle),
            ...startNodes.map(createStartArrowLabelNode),
            ...startNodes.map(createStartArrowNode)
        ],
        edges: [
            ...edges,
            ...startNodes.map(createStartArrowEdge)
        ]
    };
}

export function initGraph(containerElement, onClick,dragEnd) {
    const options = {
        nodes: {
            font: {
                color:"#000000",
                face:"Libre Baskerville"
            },
            shape: "circle",
            margin: 15,
            shapeProperties: {
                borderRadius: 20
            },
            shadow: {
                enabled: true,
                size: 3,
                x: 3,
                y: 3
            }
        },
        groups:GROUP_COLOR_OPTIONS,
        edges: {
            arrows: "to",
            color: {
                color: "#3e3e3e",
                hover: "#3e3e3e",
                highlight: "#3e3e3e",
                inherit: false
            },
            font: {
                align: "top",
                face: "Libre Baskerville"
            },
            width: 2
        },
        interaction: {
            hover: true
        },
        physics: {
            enabled:false
        }
    };

    network = new Network(containerElement, {}, options);

    network.on("click", onClick);
    network.on("dragEnd", dragEnd);
}

export function updateGraph(nodes, edges, reactivityCounter, showStartArrows = false) {
    // store previous view properties to avoid vis.js auto view move
    const previousScale = network.getScale();
    const previousViewPosition = network.getViewPosition();

    network.setData(showStartArrows
        ? getGraphDataWithStartArrows(nodes, edges)
        : { nodes, edges });

    // restore previous view properties
    network.moveTo({
        position: previousViewPosition,
        scale: previousScale,
        offset: { x: 0, y: 0 }
    });
}

export function getNodePosition(id) {
    return network.getPosition(id);
}
