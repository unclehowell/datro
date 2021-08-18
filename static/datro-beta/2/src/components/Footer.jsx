import React, { useState } from "react";

const Footer = () => {
  const [bgStyle] = useState({ backgroundColor: "#f5f5f5" });

  return (
    <footer style={bgStyle} className="mt-auto py-3 text-center">
      {/* <strong> &copy; 2019 </strong>*/}
      <i className="fas fa-code"></i> with <i className="fas fa-heart"></i> by{" "}
      <a
        className="badge badge-dark"
        rel="noopener"
        href="https://github.com/jefferyjohn"
        aria-label="My GitHub"
      >
        Jeffery John
      </a>{" "}
      using <i className="fab fa-react"></i>
      <p>
        <small className="text-muted">
          {" "}
          This project is open source. Feel free to use the source code&nbsp; 
          <a href="https://github.com/jefferyjohn/jefferyjohn.github.io" style={{color: "#707070"}}>here.</a>
        </small>
      </p>
    </footer>
  );
};

export default Footer;
 