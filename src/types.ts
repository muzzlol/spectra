export interface Point {
  x: number
  y: number
}

export enum NodeType {
  SIMPLE = "SIMPLE",
  CONCENTRIC = "CONCENTRIC",
  RADIAL = "RADIAL",
  CROSSHAIR = "CROSSHAIR",
  GEAR = "GEAR",
  ORBITAL = "ORBITAL"
}

export interface SchematicNode {
  id: string
  x: number
  y: number
  radius: number
  type: NodeType
  rotation: number
  details: number[] // Array of random numbers for procedural detail generation
}

export interface SchematicLink {
  id: string
  source: string
  target: string
  type: "DIRECT" | "TANGENT" | "DOTTED"
}
