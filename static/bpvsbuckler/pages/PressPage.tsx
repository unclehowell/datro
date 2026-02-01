import React, { useEffect, useState } from 'react';
import { Render, Data } from "@measured/puck";
import config from "../puck.config";
import { initialDataPress } from "../initialData";

const PressPage: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("puck-data-press");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse puck data for press", e);
        setData(initialDataPress);
      }
    } else {
      setData(initialDataPress);
    }
  }, []);

  if (!data) return <div>Loading archive...</div>;

  return (
    <div className="bg-slate-50 min-h-screen">
       <Render config={config} data={data} />
    </div>
  );
};

export default PressPage;