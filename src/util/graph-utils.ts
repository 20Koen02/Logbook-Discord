import type { Canvas } from "canvas";
import { View, parse as vegaParse } from "vega";
import { compile, type TopLevelSpec } from "vega-lite";

export type GraphRow = {
  amount: number;
  created_at: string;
};

type GraphPoint = {
  amount: number;
  date: string;
};

export const GRAPH_FILE_NAME = "graph.png";

const colors = {
  background: "#202225",
  panel: "#292b2f",
  plot: "#2f3136",
  border: "#40444b",
  accent: "#f89b29",
  text: "#ffffff",
  mutedText: "#b9bbbe",
  subtleText: "#dcddde",
} as const;

const DUTCH_MONTH_ABBREVIATIONS = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
] as const;

export const toSqliteTimestamp = (date: Date) =>
  date.toISOString().slice(0, 19).replace("T", " ");

const toUtcIsoString = (timestamp: string) => `${timestamp.replace(" ", "T")}Z`;

const getMonthTicks = (year: number, now: Date) => {
  const ticks: string[] = [];

  for (let month = 0; month <= now.getUTCMonth(); month++) {
    ticks.push(new Date(Date.UTC(year, month, 1)).toISOString());
  }

  return ticks;
};

const toCumulativeGraphData = (data: GraphRow[]): GraphPoint[] => {
  let runningAmount = 0;

  return data.map((row) => {
    runningAmount += row.amount;

    return {
      amount: runningAmount,
      date: toUtcIsoString(row.created_at),
    };
  });
};

const createGraphSpec = (
  data: GraphRow[],
  categoryName: string,
  subcategoryName: string,
  startOfYear: Date,
  now: Date,
): TopLevelSpec => {
  const year = startOfYear.getUTCFullYear();

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    width: 1300,
    height: 600,
    padding: {
      top: 32,
      right: 32,
      bottom: 32,
      left: 32,
    },
    background: colors.background,
    title: {
      text: subcategoryName,
      subtitle: `Aantal door de tijd heen • YTD ${year} • ${categoryName}`,
      anchor: "middle",
      color: colors.text,
      subtitleColor: colors.mutedText,
      fontSize: 48,
      subtitleFontSize: 32,
      subtitlePadding: 8,
      offset: 16,
    },
    data: {
      values: toCumulativeGraphData(data),
    },
    mark: {
      type: "line",
      interpolate: "monotone",
      color: colors.accent,
      strokeWidth: 6,
      point: {
        filled: true,
        fill: colors.accent,
        stroke: colors.background,
        strokeWidth: 2,
        size: 300,
      },
    },
    encoding: {
      x: {
        field: "date",
        type: "temporal",
        scale: {
          domain: [startOfYear.toISOString(), now.toISOString()],
        },
        axis: {
          title: null,
          values: getMonthTicks(year, now),
          labelExpr: `['${DUTCH_MONTH_ABBREVIATIONS.join("','")}'][month(datum.value)]`,
          labelAngle: 0,
          labelColor: colors.subtleText,
          tickColor: colors.border,
          tickSize: 8,
          grid: false,
          domainColor: colors.border,
        },
      },
      y: {
        field: "amount",
        type: "quantitative",
        axis: {
          title: "Aantal",
          tickMinStep: 1,
          tickCount: 10,
          format: "d",
          titleColor: colors.text,
          titlePadding: 14,
          labelColor: colors.subtleText,
          labelPadding: 8,
          tickColor: colors.border,
          domainColor: colors.border,
          grid: true,
          gridColor: colors.border,
          gridOpacity: 0.75,
          gridDash: [8, 6],
        },
      },
    },
    config: {
      view: {
        fill: colors.plot,
        stroke: colors.border,
        strokeOpacity: 1,
      },
      axis: {
        labelFontSize: 32,
        titleFontSize: 32,
        titleFontWeight: "normal",
      },
      style: {
        "guide-label": {
          fill: colors.subtleText,
        },
        "guide-title": {
          fill: colors.text,
        },
      },
      background: colors.panel,
    },
  };
};

export const renderGraph = async (
  data: GraphRow[],
  categoryName: string,
  subcategoryName: string,
  startOfYear: Date,
  now: Date,
) => {
  const spec = createGraphSpec(
    data,
    categoryName,
    subcategoryName,
    startOfYear,
    now,
  );
  const compiled = compile(spec).spec;
  const view = new View(vegaParse(compiled), { renderer: "none" });

  try {
    const canvas = (await view.toCanvas(2)) as unknown as Canvas;
    return canvas.toBuffer("image/png");
  } finally {
    view.finalize();
  }
};
