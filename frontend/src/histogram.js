import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function GroupedHistogram({ 
  optionData, 
  unhedgedData, 
  title = "Revenue Histograms", 
  xLabel = "Revenue", 
  yLabel = "Frequency" 
}) {
  const svgRef = useRef();

  useEffect(() => {
    // Remove previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Dimensions and margins
    const width = 700;
    const height = 500;
    const margin = { top: 50, right: 30, bottom: 50, left: 60 };
    const spacing = 20; // space between the two histograms
    const histHeight = (height - margin.top - margin.bottom - spacing) / 2;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // 1. Option Data Histogram (Top)
    const xDomainOption = d3.extent(optionData);
    const xScaleOption = d3.scaleLinear()
      .domain(xDomainOption)
      .nice()
      .range([margin.left, width - margin.right]);
      
    const binGeneratorOption = d3.bin()
      .domain(xScaleOption.domain())
      .thresholds(30);
    const binsOption = binGeneratorOption(optionData);
    
    const maxCountOption = d3.max(binsOption, d => d.length);
    const yScaleOption = d3.scaleLinear()
      .domain([0, maxCountOption])
      .nice()
      .range([histHeight, 0]);
      
    const gOption = svg.append("g")
      .attr("transform", `translate(0, ${margin.top})`);

    // Draw option bars
    gOption.selectAll(".bar-option")
      .data(binsOption)
      .enter()
      .append("rect")
      .attr("class", "bar-option")
      .attr("x", d => xScaleOption(d.x0))
      .attr("y", d => yScaleOption(d.length))
      .attr("width", d => Math.max(0, xScaleOption(d.x1) - xScaleOption(d.x0) - 1))
      .attr("height", d => yScaleOption(0) - yScaleOption(d.length))
      .attr("fill", d => {
        const mid = (d.x0 + d.x1) / 2;
        return d3.scaleLinear()
          .domain(xDomainOption)
          .range(["hsl(240,120%,70%)", "hsl(10,120%,70%)"])(mid);
      });
      
    // Add x-axis for option histogram (optional, or you can share one at the bottom)
    gOption.append("g")
      .attr("transform", `translate(0, ${histHeight})`)
      .call(d3.axisBottom(xScaleOption));
    gOption.append("text")
      .attr("x", width / 2)
      .attr("y", histHeight + 40)
      .attr("text-anchor", "middle")
      .text(xLabel);
    gOption.append("text")
      .attr("x", -histHeight / 2)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text(yLabel);
      
    // 2. Unhedged Data Histogram (Bottom)
    const xDomainUnhedged = d3.extent(unhedgedData);
    const xScaleUnhedged = d3.scaleLinear()
      .domain(xDomainUnhedged)
      .nice()
      .range([margin.left, width - margin.right]);
      
    const binGeneratorUnhedged = d3.bin()
      .domain(xScaleUnhedged.domain())
      .thresholds(30);
    const binsUnhedged = binGeneratorUnhedged(unhedgedData);
    
    const maxCountUnhedged = d3.max(binsUnhedged, d => d.length);
    const yScaleUnhedged = d3.scaleLinear()
      .domain([0, maxCountUnhedged])
      .nice()
      .range([histHeight, 0]);
      
    const gUnhedged = svg.append("g")
      .attr("transform", `translate(0, ${margin.top + histHeight + spacing})`);

    // Draw unhedged bars
    gUnhedged.selectAll(".bar-unhedged")
      .data(binsUnhedged)
      .enter()
      .append("rect")
      .attr("class", "bar-unhedged")
      .attr("x", d => xScaleUnhedged(d.x0))
      .attr("y", d => yScaleUnhedged(d.length))
      .attr("width", d => Math.max(0, xScaleUnhedged(d.x1) - xScaleUnhedged(d.x0) - 1))
      .attr("height", d => yScaleUnhedged(0) - yScaleUnhedged(d.length))
      .attr("fill", d => {
        const mid = (d.x0 + d.x1) / 2;
        return d3.scaleLinear()
          .domain(xDomainUnhedged)
          .range(["hsl(120,120%,70%)", "hsl(60,120%,70%)"])(mid);
      });
      
    // Add x-axis for unhedged histogram
    gUnhedged.append("g")
      .attr("transform", `translate(0, ${histHeight})`)
      .call(d3.axisBottom(xScaleUnhedged));
    gUnhedged.append("text")
      .attr("x", width / 2)
      .attr("y", histHeight + 40)
      .attr("text-anchor", "middle")
      .text(xLabel);
    gUnhedged.append("text")
      .attr("x", -histHeight / 2)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text(yLabel);

    // Add an overall title if desired
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text(title);

  }, [optionData, unhedgedData, title, xLabel, yLabel]);

  return <svg ref={svgRef}></svg>;
}

export default GroupedHistogram;
