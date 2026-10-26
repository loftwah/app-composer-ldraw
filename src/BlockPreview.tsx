import { INK, ORANGE, type DiagramLibraryItem } from "./diagrams.mjs";

/** Small, dependency-free preview of the real editable block primitives. */
export function BlockPreview({ item }: { item: DiagramLibraryItem }) {
  const elements = item.elements as Array<Record<string, any>>;
  return (
    <svg
      className="block-preview"
      viewBox={`0 0 ${item.width ?? 400} ${item.height ?? 220}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {elements.slice(0, 120).map((element, index) => {
        const key = String(element.id ?? index);
        if (element.type === "rectangle")
          return (
            <g key={key}>
              <rect
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                rx={element.roundness ? 6 : 0}
                fill={
                  element.backgroundColor === "transparent"
                    ? "none"
                    : element.backgroundColor ?? "none"
                }
                stroke={element.strokeColor ?? INK}
                strokeWidth={element.strokeWidth ?? 1}
              />
              {element.label?.text ? (
                <text
                  x={element.x + element.width / 2}
                  y={
                    element.y +
                    element.height / 2 +
                    (element.label.fontSize ?? 14) / 3
                  }
                  textAnchor="middle"
                  fill={element.label.strokeColor ?? INK}
                  fontSize={element.label.fontSize ?? 14}
                  fontWeight="600"
                >
                  {element.label.text}
                </text>
              ) : null}
            </g>
          );
        if (element.type === "ellipse")
          return (
            <ellipse
              key={key}
              cx={element.x + element.width / 2}
              cy={element.y + element.height / 2}
              rx={element.width / 2}
              ry={element.height / 2}
              fill={
                element.backgroundColor === "transparent"
                  ? "none"
                  : element.backgroundColor ?? "none"
              }
              stroke={element.strokeColor ?? INK}
              strokeWidth={element.strokeWidth ?? 1}
            />
          );
        if (element.type === "text")
          return (
            <text
              key={key}
              x={element.x}
              y={element.y + (element.fontSize ?? 16)}
              fill={element.strokeColor ?? INK}
              fontSize={element.fontSize ?? 16}
              fontWeight={element.fontSize > 19 ? 600 : 400}
            >
              {element.text}
            </text>
          );
        if (
          (element.type === "line" || element.type === "arrow") &&
          Array.isArray(element.points)
        ) {
          const [start, end = [element.width, element.height]] = element.points;
          return (
            <line
              key={key}
              x1={element.x + start[0]}
              y1={element.y + start[1]}
              x2={element.x + end[0]}
              y2={element.y + end[1]}
              stroke={element.strokeColor ?? ORANGE}
              strokeWidth={element.strokeWidth ?? 2}
              strokeLinecap="round"
            />
          );
        }
        return null;
      })}
    </svg>
  );
}
