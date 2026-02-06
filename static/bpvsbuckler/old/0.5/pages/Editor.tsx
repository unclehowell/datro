import React, { useEffect, useState } from "react";
import { Puck, Data } from "@measured/puck";
import config from "../puck.config";
import { initialData, initialDataPress } from "../initialData";
import { useLocation } from "react-router-dom";

const Editor = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const page = searchParams.get("page") === "press" ? "press" : "home";
  
  const storageKey = page === "press" ? "puck-data-press" : "puck-data";
  const initial = page === "press" ? initialDataPress : initialData;

  // Load data from localStorage based on the page param
  const [data, setData] = useState<Data>(() => {
    const saved = localStorage.getItem(storageKey);
    try {
      return saved ? JSON.parse(saved) : initial;
    } catch (e) {
      console.error("Failed to parse saved data", e);
      return initial;
    }
  });

  // Reset data when page changes
  useEffect(() => {
     const saved = localStorage.getItem(storageKey);
     try {
       setData(saved ? JSON.parse(saved) : initial);
     } catch (e) {
       console.error("Failed to parse saved data", e);
       setData(initial);
     }
  }, [page, storageKey, initial]);

  const handlePublish = async (newData: Data) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
      setData(newData);
      alert(`Content for ${page.toUpperCase()} page saved successfully!`);
    } catch (e) {
      console.error("Failed to save data", e);
      alert("Error saving data. Check console for details.");
    }
  };

  return (
    <div className="puck-editor-container bg-white">
      <Puck
        config={config}
        data={data}
        onPublish={handlePublish}
        headerTitle={`Edit ${page === 'press' ? 'Press Archive' : 'Home Page'}`}
        iframe={{ enabled: false }}
      />
    </div>
  );
};

export default Editor;