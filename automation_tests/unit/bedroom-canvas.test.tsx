import { describe, test, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react"
import { createRef } from "react"
import { BedroomCanvas, type PlacedItemView } from "@/components/my-house/bedroom-canvas"

// Hoisted so these are accessible inside the vi.mock factory (vi.mock is hoisted before imports).
const captureStore = vi.hoisted(() => ({
  dragStyles: [] as Array<Record<string, unknown>>,
  dragHandlers: new Map<string, (...args: any[]) => void>(),
}))

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion")
  const React = await import("react")
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: React.forwardRef(function MotionDivStub(
        {
          children,
          onDragEnd,
          drag,
          dragMomentum,
          dragElastic,
          whileDrag,
          style,
          "data-testid": testId,
          ...rest
        }: any,
        ref: any,
      ) {
        // Capture the style prop for draggable items to verify motion value usage (MH-6).
        if (drag) captureStore.dragStyles.push(style ?? {})
        // Capture onDragEnd handlers so tests can invoke them directly.
        if (onDragEnd && testId) captureStore.dragHandlers.set(testId as string, onDragEnd)
        // Strip MotionValue instances (x, y) from style — a plain div rejects them.
        const { x, y, ...safeStyle } = style ?? {}
        return React.createElement("div", { ref, "data-testid": testId, style: safeStyle, ...rest }, children)
      }),
    },
  }
})

function makePlacedItem(overrides: Partial<PlacedItemView> = {}): PlacedItemView {
  return { id: "p1", itemId: "lamp", x: 40, y: 40, scale: 1, rotation: 0, emoji: "💡", ...overrides }
}

afterEach(() => {
  cleanup()
  captureStore.dragStyles.length = 0
  captureStore.dragHandlers.clear()
})

describe("BedroomCanvas", () => {
  test("renders each placed item with its data-testid", () => {
    const canvasRef = createRef<HTMLDivElement>()
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={[makePlacedItem()]}
        selectedItemId={null}
        onReposition={vi.fn()}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getByTestId("placed-house-lamp")).toBeTruthy()
  })

  test("placed item CSS anchor matches stored x/y percentages", () => {
    const canvasRef = createRef<HTMLDivElement>()
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={[makePlacedItem({ x: 30, y: 70 })]}
        selectedItemId={null}
        onReposition={vi.fn()}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    const el = screen.getByTestId("placed-house-lamp")
    expect(el.style.left).toBe("30%")
    expect(el.style.top).toBe("70%")
  })

  // MH-6 regression: verifies the fix is in place.
  // Root cause: Framer Motion accumulates an internal x/y pixel offset after each drag.
  // On re-drag the accumulated offset adds to info.offset, causing the item to jump.
  // Fix: PlacedItemTile passes controlled MotionValues for x and y in its style prop and
  // resets them to 0 via useLayoutEffect whenever placed.x/placed.y changes — so FP
  // starts every drag from a clean zero offset anchored to the CSS left/top position.
  test("MH-6: placed items supply controlled x/y motion values in style to prevent transform accumulation", () => {
    const canvasRef = createRef<HTMLDivElement>()
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={[makePlacedItem()]}
        selectedItemId={null}
        onReposition={vi.fn()}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    // captureStore.dragStyles[0] is the style prop the motion.div received for the placed item.
    expect(captureStore.dragStyles).toHaveLength(1)
    // Before the fix: style has no x/y keys → these assertions FAIL.
    // After the fix: style has x: MotionValue, y: MotionValue → these assertions PASS.
    expect(captureStore.dragStyles[0]).toHaveProperty("x")
    expect(captureStore.dragStyles[0]).toHaveProperty("y")
  })

  test("drag end calls onReposition with position computed from the offset and canvas size", () => {
    const onReposition = vi.fn()
    const canvasRef = createRef<HTMLDivElement>()
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={[makePlacedItem({ x: 40, y: 40 })]}
        selectedItemId={null}
        onReposition={onReposition}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    // Provide a real canvas rect so computeRepositionPosition gets sensible input.
    vi.spyOn(canvasRef.current!, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, right: 500, bottom: 500,
      width: 500, height: 500, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect)

    const handler = captureStore.dragHandlers.get("placed-house-lamp")
    expect(handler).toBeDefined()

    act(() => {
      handler!(
        {} as PointerEvent,
        { offset: { x: 50, y: 25 }, point: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, delta: { x: 0, y: 0 } },
      )
    })

    // x: 40 + (50/500)*100 = 50,  y: 40 + (25/500)*100 = 45
    expect(onReposition).toHaveBeenCalledWith("p1", 50, 45)
  })

  test("clicking a placed item fires onSelect with its id", () => {
    const onSelect = vi.fn()
    const canvasRef = createRef<HTMLDivElement>()
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={[makePlacedItem()]}
        selectedItemId={null}
        onReposition={vi.fn()}
        onSelect={onSelect}
        onRemove={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByTestId("placed-house-lamp"))
    expect(onSelect).toHaveBeenCalledWith("p1")
  })

  test("clicking a selected item fires onSelect with null (deselects)", () => {
    const onSelect = vi.fn()
    const canvasRef = createRef<HTMLDivElement>()
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={[makePlacedItem()]}
        selectedItemId="p1"
        onReposition={vi.fn()}
        onSelect={onSelect}
        onRemove={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByTestId("placed-house-lamp"))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  test("remove button fires onRemove with the placed item id", () => {
    const onRemove = vi.fn()
    const canvasRef = createRef<HTMLDivElement>()
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={[makePlacedItem()]}
        selectedItemId="p1"
        onReposition={vi.fn()}
        onSelect={vi.fn()}
        onRemove={onRemove}
      />,
    )
    fireEvent.click(screen.getByTestId("remove-house-lamp"))
    expect(onRemove).toHaveBeenCalledWith("p1")
  })

  test("multiple placed items each render at their own CSS positions", () => {
    const canvasRef = createRef<HTMLDivElement>()
    const items = [
      makePlacedItem({ id: "p1", itemId: "lamp", x: 20, y: 30 }),
      makePlacedItem({ id: "p2", itemId: "bed", x: 70, y: 60, emoji: "🛏️" }),
    ]
    render(
      <BedroomCanvas
        ref={canvasRef}
        placedItems={items}
        selectedItemId={null}
        onReposition={vi.fn()}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    const lamp = screen.getByTestId("placed-house-lamp")
    const bed = screen.getByTestId("placed-house-bed")
    expect(lamp.style.left).toBe("20%")
    expect(lamp.style.top).toBe("30%")
    expect(bed.style.left).toBe("70%")
    expect(bed.style.top).toBe("60%")
  })
})
