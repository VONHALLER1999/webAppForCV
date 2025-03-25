import { useState, useMemo } from "react";
import HistogramSingle from "./HistogramSingle.tsx";
import HistogramGroup from "./HistogramGroup.tsx";
import React from "react";
import "./CombinedHistogram.css";

// Assume these two datasets are coming from your backend response
type CombinedHistogramProps = {
  width: number;
  height: number;
  unhedged: number[];
  option: number[];
};
export const CombinedHistogram = ({ width, height, unhedged, option }: CombinedHistogramProps) => {

  const [mode, setMode] = useState<"unhedged" | "option" | "both">("both");

  // Calculate shared domain for consistent scaling
  const domain = useMemo(() => {
    const allValues = [...unhedged, ...option];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    return [min, max] as [number, number];
  }, [unhedged, option]);

  const renderHistogram = () => {
    const sharedProps = {
      width,
      height,
      domain
    };

    if (mode === "both") {
      const groups = [
        { name: "Unhedged", values: unhedged, id: "unhedged" },
        { name: "Option", values: option, id: "option" },
      ];
      return <HistogramGroup {...sharedProps} data={groups} />;
    } else if (mode === "unhedged") {
      return <HistogramSingle {...sharedProps} data={unhedged} groupId="unhedged" />;
    } else if (mode === "option") {
      return <HistogramSingle {...sharedProps} data={option} groupId="option" />;
    }
  };

  return (
    <div className="histogram-container">
      <div className="button-group">
        <button 
          className={`histogram-button ${mode === "unhedged" ? "active" : ""}`} 
          onClick={() => setMode("unhedged")}
        >
          Unhedged Revenue
        </button>
        <button 
          className={`histogram-button ${mode === "option" ? "active" : ""}`}
          onClick={() => setMode("option")}
        >
          Option Revenue
        </button>
        <button 
          className={`histogram-button ${mode === "both" ? "active" : ""}`}
          onClick={() => setMode("both")}
        >
          Both
        </button>
      </div>
      <div style={{ position: 'relative', width, height }}>
        {renderHistogram()}
      </div>
    </div>
  );
};

export default CombinedHistogram;

