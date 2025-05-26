import React from "react";
import { Connection, Node, Position } from "../types";

interface ConnectionsProps {
  connections: Connection[];
  nodes: Node[];
  dragConnection: {
    fromNodeId: string;
    fromPortId: string;
    toPosition: Position;
  } | null;
}

const Connections: React.FC<ConnectionsProps> = ({
  connections,
  nodes,
  dragConnection,
}) => {
  const getPortPosition = (
    nodeId: string,
    portId: string,
    isOutput: boolean,
  ): Position | null => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const port = isOutput
      ? node.outputs.find((p) => p.id === portId)
      : node.inputs.find((p) => p.id === portId);

    if (!port) return null;

    const nodeWidth = 240;
    const portIndex = isOutput
      ? node.outputs.findIndex((p) => p.id === portId)
      : node.inputs.findIndex((p) => p.id === portId);

    const portCount = isOutput ? node.outputs.length : node.inputs.length;
    const nodeHeight = 60 + portCount * 20;
    const portPadding = 20;
    const portOffset = (nodeHeight - portPadding * 2) / (portCount + 1);

    return {
      x: node.position.x + (isOutput ? nodeWidth : 0),
      y: node.position.y + portPadding + (portIndex + 1) * portOffset,
    };
  };

  const generatePath = (start: Position, end: Position): string => {
    const dx = end.x - start.x;
    const midX = start.x + dx / 2;

    return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
  };

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#4f46e5" />
        </marker>
      </defs>

      {connections.map((connection, index) => {
        const startPos = getPortPosition(
          connection.fromNodeId,
          connection.fromPortId,
          true,
        );
        const endPos = getPortPosition(
          connection.toNodeId,
          connection.toPortId,
          false,
        );

        if (!startPos || !endPos) return null;

        return (
          <path
            key={index}
            d={generatePath(startPos, endPos)}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            className="transition-all duration-300"
          />
        );
      })}

      {dragConnection &&
        (() => {
          const startPos = getPortPosition(
            dragConnection.fromNodeId,
            dragConnection.fromPortId,
            true,
          );
          if (!startPos) return null;

          return (
            <path
              d={generatePath(startPos, dragConnection.toPosition)}
              fill="none"
              stroke="#4f46e5"
              strokeDasharray="5,5"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })()}
    </svg>
  );
};

export default Connections;
