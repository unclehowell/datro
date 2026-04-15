import React from "react";
import { createRoot } from "react-dom/client";
import { Puck } from "@measured/puck";

const config = {
  components: {
    Heading: {
      fields: {
        text: { type: "text" }
      },
      render: ({ text }) => (
        <h2 style={{ color: "white" }}>{text}</h2>
      )
    }
  }
};

const data = {
  content: [
    {
      type: "Heading",
      props: { text: "Hello from Puck inside AdminLTE" }
    }
  ]
};

const root = createRoot(document.getElementById("puck-root"));

root.render(<Puck config={config} data={data} />);
