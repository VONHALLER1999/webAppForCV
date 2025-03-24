
import { useState } from "react";
import HistogramSingle from "./HistogramSingle";
import HistogramGroup from "./HistogramGroup";
import React from "react";


// Assume these two datasets are coming from your backend response
type CombinedHistogramProps = {
  width: number;
  height: number;
  unhedged: number[];
  option: number[];
};

export const CombinedHistogram = ({
  width,
  height,
  unhedged,
  option,
}: CombinedHistogramProps) => {
  // mode can be "unhedged", "option", or "both"
  const [mode, setMode] = useState<"unhedged" | "option" | "both">("both");

  const renderHistogram = () => {
    if (mode === "both") {
      // Build groups array from the two datasets.
      const groups = [
        { name: "Unhedged", values: unhedged },
        { name: "Option", values: option },
      ];
      return <HistogramGroup width={width} height={height} data={groups} />;
    } else if (mode === "unhedged") {
      return <HistogramSingle width={width} height={height} data={unhedged} />;
    } else if (mode === "option") {
      return <HistogramSingle width={width} height={height} data={option} />;
    }
  };

  const buttonStyle = {
    border: "1px solid #9a6fb0",
    borderRadius: "3px",
    padding: "0px 8px",
    margin: "10px 2px",
    fontSize: 14,
    color: "#9a6fb0",
    opacity: 0.7,
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <button style={buttonStyle} onClick={() => setMode("unhedged")}>
          Unhedged Revenue
        </button>
        <button style={buttonStyle} onClick={() => setMode("option")}>
          Option Revenue
        </button>
        <button style={buttonStyle} onClick={() => setMode("both")}>
          Both
        </button>
      </div>
      {renderHistogram()}
    </div>
  );
};

export default CombinedHistogram;

