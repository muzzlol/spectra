import type React from "react"
import { pointOnCircle } from "@/geometry"
import { NodeType, type SchematicNode } from "@/types"

interface SchematicNodeProps {
  node: SchematicNode
}

export const SchematicNodeRenderer: React.FC<SchematicNodeProps> = ({
  node
}) => {
  const { x, y, radius, type, rotation, details } = node
  const strokeWidth = 1.5
  const color = "currentColor"

  const renderContent = () => {
    switch (type) {
      case NodeType.CONCENTRIC:
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={0}
              cy={0}
              r={radius * 0.6}
              stroke={color}
              strokeWidth={strokeWidth * 0.5}
              fill="none"
            />
            <circle cx={0} cy={0} r={radius * 0.3} fill={color} />
            {details[0] > 0.5 && (
              <path
                d={`M ${-radius} 0 L ${radius} 0 M 0 ${-radius} L 0 ${radius}`}
                stroke={color}
                strokeWidth={0.5}
                opacity={0.5}
              />
            )}
          </g>
        )
      case NodeType.RADIAL: {
        const ticks = 12
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={0}
              cy={0}
              r={radius * 0.8}
              stroke={color}
              strokeWidth={0.5}
              strokeDasharray="4 2"
              fill="none"
            />
            {Array.from({ length: ticks }).map((_, i) => {
              const angle = (i / ticks) * 360
              const p1 = pointOnCircle({ x: 0, y: 0 }, radius * 0.8, angle)
              const p2 = pointOnCircle({ x: 0, y: 0 }, radius, angle)
              return (
                <line
                  key={i}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={color}
                  strokeWidth={0.5}
                />
              )
            })}
            <circle
              cx={0}
              cy={0}
              r={radius * 0.1}
              stroke={color}
              fill="var(--background)"
            />
          </g>
        )
      }
      case NodeType.CROSSHAIR:
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={details[0] > 0.5 ? "10 5" : "none"}
            />
            <line
              x1={-radius * 1.2}
              y1={0}
              x2={radius * 1.2}
              y2={0}
              stroke={color}
              strokeWidth={0.5}
            />
            <line
              x1={0}
              y1={-radius * 1.2}
              x2={0}
              y2={radius * 1.2}
              stroke={color}
              strokeWidth={0.5}
            />
            <circle
              cx={0}
              cy={0}
              r={radius * 0.4}
              stroke={color}
              strokeWidth={0.5}
              fill="none"
            />
            {/* Small triangles at ends */}
            <path
              d={`M ${radius} -3 L ${radius + 6} 0 L ${radius} 3 Z`}
              fill={color}
              transform={`rotate(0)`}
            />
            <path
              d={`M ${radius} -3 L ${radius + 6} 0 L ${radius} 3 Z`}
              fill={color}
              transform={`rotate(90)`}
            />
            <path
              d={`M ${radius} -3 L ${radius + 6} 0 L ${radius} 3 Z`}
              fill={color}
              transform={`rotate(180)`}
            />
            <path
              d={`M ${radius} -3 L ${radius + 6} 0 L ${radius} 3 Z`}
              fill={color}
              transform={`rotate(270)`}
            />
          </g>
        )
      case NodeType.GEAR:
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={0}
              cy={0}
              r={radius * 0.85}
              stroke={color}
              strokeWidth={0.5}
              fill="none"
            />
            {/* "Spokes" */}
            <line
              x1={-radius}
              y1={0}
              x2={radius}
              y2={0}
              stroke={color}
              strokeWidth={0.5}
              transform="rotate(45)"
            />
            <line
              x1={-radius}
              y1={0}
              x2={radius}
              y2={0}
              stroke={color}
              strokeWidth={0.5}
              transform="rotate(-45)"
            />
            <circle
              cx={0}
              cy={0}
              r={radius * 0.3}
              stroke={color}
              strokeWidth={2}
              fill="var(--background)"
            />
          </g>
        )
      case NodeType.ORBITAL:
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={radius}
              stroke={color}
              strokeWidth={0.5}
              fill="none"
              opacity={0.7}
            />
            <circle
              cx={0}
              cy={0}
              r={radius * 1.8}
              stroke={color}
              strokeWidth={0.5}
              fill="none"
              strokeDasharray="2 4"
              opacity={0.5}
            />
            {/* Orbital body */}
            <circle cx={radius * 1.8} cy={0} r={4} fill={color} />
            <circle
              cx={0}
              cy={0}
              r={radius * 0.4}
              stroke={color}
              strokeWidth={1.5}
              fill="none"
            />
            <circle cx={0} cy={0} r={2} fill={color} />
          </g>
        )
      case NodeType.SIMPLE:
      default:
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="var(--background)"
            />
            <circle cx={0} cy={0} r={2} fill={color} />
          </g>
        )
    }
  }

  return (
    <g transform={`translate(${x},${y}) rotate(${rotation})`}>
      {renderContent()}
    </g>
  )
}
