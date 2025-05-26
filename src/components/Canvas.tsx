import React, { useState, useRef, useEffect } from "react";
import NodeComponent from "./NodeComponent";
import Connections from "./Connections";
import { Node, Position, Connection } from "../types";

interface CanvasProps {
  nodes: Node[];
  connections: Connection[];
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
  onNodeConnect: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string,
  ) => void;
  selectedNodeId: string | null;
}

const Canvas: React.FC<CanvasProps> = ({
  nodes,
  connections,
  onNodeSelect,
  onNodeMove,
  onNodeConnect,
  selectedNodeId,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragConnection, setDragConnection] = useState<{
    fromNodeId: string;
    fromPortId: string;
    toPosition: Position;
  } | null>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onNodeSelect(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: offset.x + (e.clientX - dragStart.x) / scale,
        y: offset.y + (e.clientY - dragStart.y) / scale,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }

    if (dragConnection) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        setDragConnection({
          ...dragConnection,
          toPosition: {
            x: (e.clientX - canvasRect.left) / scale - offset.x,
            y: (e.clientY - canvasRect.top) / scale - offset.y,
          },
        });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragConnection(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newScale = Math.max(0.5, Math.min(2, scale + delta));
    setScale(newScale);
  };

  const handlePortDragStart = (nodeId: string, portId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setDragConnection({
        fromNodeId: nodeId,
        fromPortId: portId,
        toPosition: { x: node.position.x, y: node.position.y },
      });
    }
  };

  const handlePortDragEnd = (toNodeId: string, toPortId: string) => {
    if (dragConnection) {
      onNodeConnect(
        dragConnection.fromNodeId,
        dragConnection.fromPortId,
        toNodeId,
        toPortId,
      );
      setDragConnection(null);
    }
  };

  return (
    <div
      className="flex-grow bg-gray-50 overflow-hidden relative"
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        <Connections
          connections={connections}
          nodes={nodes}
          dragConnection={dragConnection}
        />

        {nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            onSelect={() => onNodeSelect(node.id)}
            onMove={(position) => onNodeMove(node.id, position)}
            onPortDragStart={handlePortDragStart}
            onPortDragEnd={handlePortDragEnd}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;
