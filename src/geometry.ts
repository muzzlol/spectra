import type { Point } from "@/types"

export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
}

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const pointOnCircle = (
  center: Point,
  radius: number,
  angleDeg: number
): Point => {
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad)
  }
}

// Calculate external tangent points for "belt" connections
export const getExternalTangentPoints = (
  c1: { x: number; y: number; r: number },
  c2: { x: number; y: number; r: number }
): { p1: Point; p2: Point; p3: Point; p4: Point } | null => {
  const d = distance(c1, c2)
  if (d <= Math.abs(c1.r - c2.r)) return null // Circles are contained within each other

  const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x)
  const offset = Math.acos((c1.r - c2.r) / d)

  const p1 = pointOnCircle(c1, c1.r, (angle + offset) * (180 / Math.PI))
  const p2 = pointOnCircle(c2, c2.r, (angle + offset) * (180 / Math.PI))
  const p3 = pointOnCircle(c1, c1.r, (angle - offset) * (180 / Math.PI))
  const p4 = pointOnCircle(c2, c2.r, (angle - offset) * (180 / Math.PI))

  return { p1, p2, p3, p4 }
}
