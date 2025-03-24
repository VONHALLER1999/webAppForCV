import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { Rectangle } from "./Rectangle";
import React from "react";

const MARGIN = { top: 30, right: 30, bottom: 40, left: 50 };
const BUCKET_NUMBER = 70;
const BUCKET_PADDING = 4;

type HistogramSingleProps = {
  width: number;
  height: number;
  data: number[];
};

export const HistogramSingle = ({ width, height, data }: HistogramSingleProps) => {
  const axesRef = useRef(null);
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // You can adjust the domain or make it dynamic if needed.
  const domain: [number, number] = [0, 100];
  const xScale = useMemo(() => {
    return d3.scaleLinear().domain(domain).range([10, boundsWidth]);
  }, [data, width]);

  const buckets = useMemo(() => {
    const bucketGenerator = d3
      .bin()
      .value((d) => d)
      .domain(domain)
      .thresholds(xScale.ticks(BUCKET_NUMBER));
    return bucketGenerator(data);
  }, [xScale, data]);

  const yScale = useMemo(() => {
    const max = Math.max(...buckets.map((bucket) => bucket.length));
    return d3.scaleLinear().range([boundsHeight, 0]).domain([0, max]).nice();
  }, [buckets, height]);

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
  }, [xScale, yScale, boundsHeight]);

  const allRects = buckets.map((bucket, i) => {
    const { x0, x1 } = bucket;
    if (x0 === undefined || x1 === undefined) return null;
    return (
      <Rectangle
        key={i}
        x={xScale(x0) + BUCKET_PADDING / 2}
        width={xScale(x1) - xScale(x0) - BUCKET_PADDING}
        y={yScale(bucket.length)}
        height={boundsHeight - yScale(bucket.length)}
      />
    );
  });

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {allRects}
      </g>
      <g ref={axesRef} transform={`translate(${MARGIN.left},${MARGIN.top})`} />
    </svg>
  );
};
export default HistogramSingle;
