import {
  type FC,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react"
import { SchematicNodeRenderer } from "@/components/schematic-node"
import {
  distance,
  getExternalTangentPoints,
  randomInt,
  randomRange
} from "@/geometry"
import { NodeType, type SchematicLink, type SchematicNode } from "@/types"

const NODE_COUNT_MIN = 20
const NODE_COUNT_MAX = 35
const WIDTH = 1600
const HEIGHT = 900

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

export interface SchematicCanvasRef {
  nodes: SchematicNode[]
  links: SchematicLink[]
  genId: string
}

export const SchematicCanvas: FC<{
  onStateChange?: (state: SchematicCanvasRef) => void
}> = ({ onStateChange }) => {
  const [nodes, setNodes] = useState<SchematicNode[]>([])
  const [links, setLinks] = useState<SchematicLink[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const animationFrameRef = useRef<number>(0)

  // Particle Animation Loop
  useEffect(() => {
    if (particles.length === 0) return

    let lastTime = performance.now()

    const animate = (time: number) => {
      const dt = (time - lastTime) / 16 // Normalize to ~60fps
      lastTime = time

      setParticles((prevParticles) => {
        const nextParticles = prevParticles
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            life: p.life - 0.02 * dt
          }))
          .filter((p) => p.life > 0)
        return nextParticles
      })

      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [particles.length])

  const spawnParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = []
    const count = 12

    // Calculate scale factor to ensure effect size is consistent with pointer
    // regardless of SVG zoom/scale
    let scale = 1
    if (svgRef.current) {
      const ctm = svgRef.current.getScreenCTM()
      if (ctm) {
        scale = 1 / ctm.a // approximate scale
      }
    }

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const speed = randomRange(0.8, 1.2) * scale // More uniform speed
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        color: "currentColor"
      })
    }
    setParticles((prev) => [...prev, ...newParticles])
  }, [])

  // Generation Logic
  const generateSchematic = useCallback(() => {
    const newNodes: SchematicNode[] = []
    const newLinks: SchematicLink[] = []

    const count = randomInt(NODE_COUNT_MIN, NODE_COUNT_MAX)

    // 1. Generate Nodes with collision avoidance
    for (let i = 0; i < count; i++) {
      let attempt = 0
      let valid = false
      let x = 0,
        y = 0,
        r = 0

      while (!valid && attempt < 100) {
        r = randomRange(10, 80)
        x = randomRange(r + 50, WIDTH - r - 50)
        y = randomRange(r + 50, HEIGHT - r - 50)

        // Simple distance check to prevent heavy overlap
        valid = true
        for (const n of newNodes) {
          if (distance({ x, y }, { x: n.x, y: n.y }) < r + n.radius + 30) {
            valid = false
            break
          }
        }
        attempt++
      }

      if (valid) {
        const typeRoll = Math.random()
        let type = NodeType.SIMPLE
        if (typeRoll > 0.8) type = NodeType.ORBITAL
        else if (typeRoll > 0.6) type = NodeType.GEAR
        else if (typeRoll > 0.4) type = NodeType.CROSSHAIR
        else if (typeRoll > 0.2) type = NodeType.RADIAL
        else type = NodeType.CONCENTRIC

        newNodes.push({
          id: `node-${i}`,
          x,
          y,
          radius: r,
          type,
          rotation: randomRange(0, 360),
          details: [Math.random(), Math.random(), Math.random()]
        })
      }
    }

    // 2. Generate Links (Minimum Spanning Tree-ish + Random extras)
    newNodes.forEach((nodeA, _) => {
      // Find nearest neighbors
      const neighbors = newNodes
        .map((n, _) => ({ node: n, dist: distance(nodeA, n), id: n.id }))
        .filter((n) => n.id !== nodeA.id)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, randomInt(1, 3)) // Connect to 1-3 nearest nodes

      neighbors.forEach((neighbor) => {
        // Avoid duplicate links
        const linkId1 = `${nodeA.id}-${neighbor.node.id}`
        const linkId2 = `${neighbor.node.id}-${nodeA.id}`

        if (!newLinks.find((l) => l.id === linkId1 || l.id === linkId2)) {
          const typeRoll = Math.random()
          newLinks.push({
            id: linkId1,
            source: nodeA.id,
            target: neighbor.node.id,
            type:
              typeRoll > 0.7 ? "TANGENT" : typeRoll > 0.4 ? "DIRECT" : "DOTTED"
          })
        }
      })
    })

    setNodes(newNodes)
    setLinks(newLinks)
    const id = Date.now().toString().slice(-6)
    onStateChange?.({ nodes: newNodes, links: newLinks, genId: id })
  }, [onStateChange])

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      if (svgRef.current) {
        const point = svgRef.current.createSVGPoint()
        point.x = e.clientX
        point.y = e.clientY
        const svgPoint = point.matrixTransform(
          svgRef.current.getScreenCTM()?.inverse()
        )
        spawnParticles(svgPoint.x, svgPoint.y)
      }
      generateSchematic()
    },
    [generateSchematic, spawnParticles]
  )

  useEffect(() => {
    generateSchematic()
  }, [generateSchematic])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Background interaction
    // biome-ignore lint/a11y/noStaticElementInteractions: Background interaction
    <div
      onClick={handleCanvasClick}
      className="relative flex h-screen w-full cursor-crosshair items-center justify-center overflow-hidden bg-background text-foreground"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full max-h-[900px] w-full max-w-[1600px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
          </marker>
          <marker
            id="dot"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <circle cx="4" cy="4" r="2" fill="currentColor" />
          </marker>
        </defs>

        {/* Links Layer */}
        <g opacity={0.8}>
          {links.map((link) => {
            const sourceNode = nodes.find((n) => n.id === link.source)
            const targetNode = nodes.find((n) => n.id === link.target)
            if (!sourceNode || !targetNode) return null

            if (link.type === "TANGENT") {
              const tangents = getExternalTangentPoints(
                { x: sourceNode.x, y: sourceNode.y, r: sourceNode.radius },
                { x: targetNode.x, y: targetNode.y, r: targetNode.radius }
              )

              if (tangents) {
                return (
                  <g key={link.id}>
                    <line
                      x1={tangents.p1.x}
                      y1={tangents.p1.y}
                      x2={tangents.p2.x}
                      y2={tangents.p2.y}
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                    <line
                      x1={tangents.p3.x}
                      y1={tangents.p3.y}
                      x2={tangents.p4.x}
                      y2={tangents.p4.y}
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </g>
                )
              }
              // Fallback to direct if tangent calculation fails (e.g. circles overlap too much)
            }

            const isDotted = link.type === "DOTTED"

            return (
              <g key={link.id}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray={isDotted ? "4 4" : "none"}
                  markerEnd={!isDotted ? "url(#dot)" : ""}
                />
                {/* Midpoint Decoration */}
                {!isDotted && (
                  <circle
                    cx={(sourceNode.x + targetNode.x) / 2}
                    cy={(sourceNode.y + targetNode.y) / 2}
                    r={3}
                    fill="var(--background)"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                )}
              </g>
            )
          })}
        </g>

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <SchematicNodeRenderer key={node.id} node={node} />
        ))}

        {/* Particles Layer */}
        <g>
          {particles.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={1.5}
              fill={p.color}
              opacity={p.life}
            />
          ))}
        </g>

        {/* Foreground Overlay / HUD elements */}
        <rect
          x="20"
          y="20"
          width="200"
          height="1"
          fill="currentColor"
          opacity="0.5"
        />
        <rect
          x="20"
          y="20"
          width="1"
          height="50"
          fill="currentColor"
          opacity="0.5"
        />
        <text
          x="30"
          y="40"
          fill="currentColor"
          opacity="0.7"
          fontSize="10"
          fontFamily="monospace"
        >
          SYS.DIAG.V8
        </text>

        <rect
          x={WIDTH - 220}
          y={HEIGHT - 40}
          width="200"
          height="1"
          fill="currentColor"
          opacity="0.5"
        />
        <rect
          x={WIDTH - 20}
          y={HEIGHT - 90}
          width="1"
          height="50"
          fill="currentColor"
          opacity="0.5"
        />
        <text
          x={WIDTH - 30}
          y={HEIGHT - 50}
          fill="currentColor"
          opacity="0.7"
          fontSize="10"
          fontFamily="monospace"
          textAnchor="end"
        >
          STATUS: NOMINAL
        </text>
      </svg>
    </div>
  )
}
