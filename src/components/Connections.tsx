import React from "react";
import { Node, Edge } from "../types/workflow";

interface ConnectionsProps {
  nodes: Node[];
  edges: Edge[];
}

const Connections: React.FC<ConnectionsProps> = ({ nodes, edges }) => {
  const getPortPosition = (nodeId: string, portId: string, isOutput: boolean): { x: number; y: number } | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const port = isOutput
      ? node.outputs.find(p => p.id === portId)
      : node.inputs.find(p => p.id === portId);
    if (!port) return null;

    // Calculate port position based on node position and port index
    const portIndex = isOutput
      ? node.outputs.findIndex(p => p.id === portId)
      : node.inputs.findIndex(p => p.id === portId);

    const nodeWidth = 200; // Assuming fixed node width
    const portSpacing = 20; // Spacing between ports
    const portStartY = 40; // Starting Y position for ports

    return {
      x: node.position.x + (isOutput ? nodeWidth : 0),
      y: node.position.y + portStartY + portIndex * portSpacing
    };
  };

  const renderConnection = (edge: Edge) => {
    const startPos = getPortPosition(edge.source, edge.sourcePort, true);
    const endPos = getPortPosition(edge.target, edge.targetPort, false);

    if (!startPos || !endPos) return null;

    // Calculate control points for the bezier curve
    const controlPoint1X = startPos.x + 50;
    const controlPoint2X = endPos.x - 50;

    const path = `M ${startPos.x} ${startPos.y} C ${controlPoint1X} ${startPos.y}, ${controlPoint2X} ${endPos.y}, ${endPos.x} ${endPos.y}`;

    return (
      <path
        key={edge.id}
        d={path}
        stroke="#666"
        strokeWidth="2"
        fill="none"
        className="connection-path"
      />
    );
  };

  return (
    <svg className="absolute inset-0 pointer-events-none">
      <g>
        {edges.map(renderConnection)}
      </g>
    </svg>
  );
};

export default Connections;
