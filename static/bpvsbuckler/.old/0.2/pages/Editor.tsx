import React, { useEffect, useState } from "react";
import { Puck, Data } from "@measured/puck";
import config from "../puck.config";
import { initialData } from "../initialData";

const Editor = () => {
  // Load data from localStorage or fallback to initialData
  const [data, setData] = useState<Data>(() => {
    const saved = localStorage.getItem("puck-data");
    return saved ? JSON.parse(saved) : initialData;
  });

  const handlePublish = async (newData: Data) => {
    localStorage.setItem("puck-data", JSON.stringify(newData));
    setData(newData);
    alert("Content saved!");
  };

  return (
    <div className="puck-editor-container bg-white">
      <Puck
        config={config}
        data={data}
        onPublish={handlePublish}
        headerTitle="Edit Website Content"
        // Disable iframe to inherit Tailwind styles from the main document
        iframe={{ enabled: false }}
      />
    </div>
  );
};

export default Editor;