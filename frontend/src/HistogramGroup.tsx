import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import React from "react";
import Rectangle from "./Rectangle.tsx";  // Add this import

const MARGIN = { top: 30, right: 30, bottom: 40, left: 50 };
const BUCKET_NUMBER = 70;
const BUCKET_PADDING = 4;
const COLORS = ["#e0ac2b", "#e85252", "#6689c6", "#9a6fb0", "#a53253"];

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
  }, [groupBuckets, height]);

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

  const allRects = groupBuckets.map((group, i) =>
    group.buckets.map((bucket, j) => {
      const { x0, x1 } = bucket;
      if (x0 === undefined || x1 === undefined) return null;
      return (
        <Rectangle
          key={`${group.id}_${j}`} // Use consistent key structure
          fill={colorScale(group.name)}
          x={xScale(x0) + BUCKET_PADDING / 2}
          width={xScale(x1) - xScale(x0) - BUCKET_PADDING}
          y={yScale(bucket.length)}
          height={boundsHeight - yScale(bucket.length)}
        />
      );
    })
  );

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {allRects}
      </g>
      <g ref={axesRef} transform={`translate(${MARGIN.left},${MARGIN.top})`} />
    </svg>
  );
};


export default HistogramGroup;
