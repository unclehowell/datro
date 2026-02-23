import React, { useEffect, useState } from 'react';
import { Render, Data } from "@measured/puck";
import config from "../puck.config";
import { initialData } from "../initialData";
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("puck-data");
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData(initialData);
    }
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="bg-parchment min-h-screen">
       {/* Use Puck Render to display the content */}
       <Render config={config} data={data} />
    </div>
  );
};

export default Home;