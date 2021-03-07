import React, { useEffect, useRef, useState } from "react";
import { Nav } from "reactstrap";
import AltheaNav from "./Layout/Nav";
import Topbar from "./Layout/Topbar";
import { NoConnection } from "utils";
import Router from "Router";
import Init from "./Init";
import ErrorBoundary from "./ErrorBoundary";

const App = () => {
  const [page, setPage] = useState("dashboard");
  const [open, setOpen] = useState(false);

  const styleRef = useRef();

  useEffect(() => {
    const h = document.querySelector(".navbar").offsetHeight;
    styleRef.current = { minHeight: `calc(100vh - ${h}px)` };
  }, []);

  return (
    <>
      <Init />
      <Topbar {...{ open, setOpen }} />
      <div className="d-flex" style={styleRef.current}>
        <Nav id="sidebar" navbar>
          <AltheaNav {...{ page, setOpen }} />
        </Nav>
        <NoConnection />
        <div id="content">
          <ErrorBoundary>
            <Router {...{ page, setPage, setOpen }} />
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
};

export default App;
