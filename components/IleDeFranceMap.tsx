interface Props {
  highlightedDept: string;
  className?: string;
}

const DEPTS: Record<
  string,
  { path: string; cx: number; cy: number; name: string }
> = {
  "75": {
    path: "M163,115 L200,115 L200,150 L163,150 Z",
    cx: 181, cy: 132,
    name: "75",
  },
  "92": {
    path: "M112,110 L163,115 L163,158 L118,164 L112,148 Z",
    cx: 136, cy: 138,
    name: "92",
  },
  "93": {
    path: "M163,68 L275,65 L280,120 L228,128 L200,115 L163,115 Z",
    cx: 222, cy: 96,
    name: "93",
  },
  "94": {
    path: "M200,150 L270,143 L278,192 L200,200 Z",
    cx: 235, cy: 172,
    name: "94",
  },
  "78": {
    path: "M15,68 L112,68 L112,110 L118,164 L98,250 L15,250 Z",
    cx: 62, cy: 158,
    name: "78",
  },
  "95": {
    path: "M88,20 L280,20 L280,65 L275,65 L163,68 L112,68 L88,20 Z",
    cx: 183, cy: 44,
    name: "95",
  },
  "91": {
    path: "M98,250 L118,164 L163,158 L200,200 L278,192 L284,268 L268,318 L98,318 Z",
    cx: 183, cy: 262,
    name: "91",
  },
  "77": {
    path: "M275,42 L395,42 L395,318 L268,318 L284,268 L278,192 L270,143 L280,120 L280,65 Z",
    cx: 330, cy: 183,
    name: "77",
  },
};

export default function IleDeFranceMap({ highlightedDept, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 410 338"
      className={className}
      aria-label={`Carte Île-de-France, département ${highlightedDept} mis en évidence`}
    >
      {Object.entries(DEPTS).map(([code, { path, cx, cy, name }]) => {
        const isHighlighted = code === highlightedDept;
        return (
          <g key={code}>
            <path
              d={path}
              fill={isHighlighted ? "#0ea5e9" : "#1e293b"}
              stroke="#0f172a"
              strokeWidth="2"
              opacity={isHighlighted ? 1 : 0.6}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isHighlighted ? "13" : "11"}
              fontWeight={isHighlighted ? "700" : "500"}
              fill={isHighlighted ? "#ffffff" : "#94a3b8"}
            >
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
