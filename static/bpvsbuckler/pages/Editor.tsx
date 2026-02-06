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
    return saved ? JSON.parse(saved) : initial;
  });

  // Reset data when page changes
  useEffect(() => {
     const saved = localStorage.getItem(storageKey);
     setData(saved ? JSON.parse(saved) : initial);
  }, [page, storageKey, initial]);

  const handlePublish = async (newData: Data) => {
    localStorage.setItem(storageKey, JSON.stringify(newData));
    setData(newData);
    alert(`Content for ${page.toUpperCase()} page saved!`);
  };

  return (
    <div className="puck-editor-container office-editor" aria-label="Puck Editor">
      <div className="puck-toolbar" role="toolbar" aria-label="Editor toolbar">
        <button className="tool" aria-label="Bold">B</button>
        <button className="tool" aria-label="Italic"><em>I</em></button>
        <button className="tool" aria-label="Underline"><u>U</u></button>
        <span className="separator" aria-hidden="true">|</span>
        <button className="tool" aria-label="Align Left">L</button>
        <button className="tool" aria-label="Align Center">C</button>
        <button className="tool" aria-label="Align Right">R</button>
        <span className="separator" aria-hidden="true">|</span>
        <button className="tool" aria-label="Bullet List">•</button>
        <button className="tool" aria-label="Numbered List">1.</button>
      </div>
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
