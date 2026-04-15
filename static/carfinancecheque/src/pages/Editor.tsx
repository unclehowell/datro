import { Puck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { config } from "../puck.config";
import { useEffect, useState } from "react";

export const Editor = () => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("puck-data");
    return saved ? JSON.parse(saved) : { content: [], root: {} };
  });

  const handleSave = (newData: any) => {
    localStorage.setItem("puck-data", JSON.stringify(newData));
    alert("Content saved locally!");
  };

  return (
    <div className="h-screen">
      <Puck
        config={config}
        data={data}
        onPublish={handleSave}
        headerTitle="PCP Refund Editor"
      />
    </div>
  );
};
