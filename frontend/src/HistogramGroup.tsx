import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import React from "react";
import Rectangle from "./Rectangle.tsx";  // Add this import

const MARGIN = { top: 30, right: 30, bottom: 40, left: 50 };
const BUCKET_NUMBER = 70;
const BUCKET_PADDING = 4;
const COLORS = [
  "#FF0F7B",  // Electric pink
  "#00FFB3",  // Neon aqua
  "#FFE100",  // Electric yellow
  "#7B4DFF",  // Bright violet
  "#FF3D00"   // Neon orange
];

// Add after COLORS constant
const GRADIENTS = {
  unhedged: ["#FF0F7B", "#FF85B6"], // Electric pink gradient
  option: ["#00FFB3", "#7CFFD6"],    // Neon aqua gradient
  both: ["#7B4DFF", "#B79FFF"]       // Bright violet gradient
};

type Group = { name: string; values: number[]; id: string }; // Add id to Group type
type HistogramGroupProps = {
  width: number;
  height: number;
  data: Group[];
  domain: [number, number];
};


export const HistogramGroup = ({ width, height, data, domain }: HistogramGroupProps) => {
  const axesRef = useRef(null);
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const allGroupNames = data.map((group) => group.name);
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(allGroupNames)
    .range(COLORS);

    const xScale = useMemo(() => {
      return d3.scaleLinear()
        .domain(domain)
        .range([10, boundsWidth])
        .nice();
    }, [domain, boundsWidth]);

  const bucketGenerator = useMemo(() => {
    return d3
      .bin()
      .value((d) => d)
      .domain(xScale.domain() as [number, number])
      .thresholds(xScale.ticks(BUCKET_NUMBER));
  }, [xScale]);

  const groupBuckets = useMemo(() => {
    return data.map((group) => {
      return { name: group.name, id: group.id, buckets: bucketGenerator(group.values) };
    });
  }, [data, bucketGenerator]);

  const yScale = useMemo(() => {
    const max = Math.max(
      ...groupBuckets.map((group) =>
        Math.max(...group.buckets.map((bucket) => bucket.length))
      )
    );
    return d3.scaleLinear().range([boundsHeight, 0]).domain([0, max]).nice();
  }, [groupBuckets, boundsHeight]); // Added boundsHeight to dependencies

  // Render axes using D3
  useEffect(() => {
    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll("*").remove();

    const xAxisGenerator = d3.axisBottom(xScale);
    svgElement
      .append("g")
      .attr("transform", `translate(0,${boundsHeight})`)
      .call(xAxisGenerator);

    const yAxisGenerator = d3.axisLeft(yScale);
    svgElement.append("g").call(yAxisGenerator);

    // Add X axis label
    svgElement
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", boundsWidth / 2)
      .attr("y", boundsHeight + MARGIN.bottom - 5)
      .text("Revenue (DKK)")
      .style("fill", "var(--text-light)");

    // Add Y axis label
    svgElement
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-MARGIN.left + 15},${boundsHeight / 2}) rotate(-90)`)
      .text("Frequency")
      .style("fill", "var(--text-light)");

    // Add legend
    const legend = svgElement
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${boundsWidth - 100}, 0)`);

    data.forEach((group, i) => {
      const legendRow = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow
        .append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(group.name));

      legendRow
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(group.name)
        .style("fill", "var(--text-light)")
        .style("font-size", "12px");
    });
  }, [xScale, yScale, boundsHeight, boundsWidth, data, colorScale]);

  // First, add the gradient definitions
  const gradientDefs = (
    <defs>
      {Object.entries(GRADIENTS).map(([id, [startColor, endColor]]) => (
        <linearGradient key={id} id={`gradient-${id}`} gradientTransform="rotate(90)">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      ))}
    </defs>
  );

  // Update the allRects mapping
  const allRects = groupBuckets.map((group, i) =>
    group.buckets.map((bucket, j) => {
      const { x0, x1 } = bucket;
      if (x0 === undefined || x1 === undefined) return null;
      
      // Use gradient fill based on group name
      const gradientId = `url(#gradient-${group.name.toLowerCase()})`;
      
      return (
        <Rectangle
          key={`${group.id}_${j}`}
          fill={gradientId}
          x={xScale(x0) + BUCKET_PADDING / 2}
          width={xScale(x1) - xScale(x0) - BUCKET_PADDING}
          y={yScale(bucket.length)}
          height={boundsHeight - yScale(bucket.length)}
        />
      );
    })
  );

  // Update the return statement to include the gradientDefs
  return (
    <svg width={width} height={height}>
      {gradientDefs}
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {allRects}
      </g>
      <g ref={axesRef} transform={`translate(${MARGIN.left},${MARGIN.top})`} />
    </svg>
  );
};


export default HistogramGroup;
