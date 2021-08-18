import React, { Component} from "react";
import {
    contactHeading,
    contactDescription
} from "../../editable-stuff/configurations.json";

class Contact extends React.Component {
  componentDidMount() {
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.setAttribute('src',  'https://assets.calendly.com/assets/external/widget.js');
    head.appendChild(script);
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div id="contact" className="jumbotron jumbotron-fluid bg-transparent m-0">
        <h1 className="display-4 mb-4 text-center">{contactHeading}</h1>
            <center>
                <div className=" d-right col-5 p-0 d-lg-block p-0 ml-5 mr-5 mb-0 mt-5">
                    <p className="lead">{contactDescription}
                        <a href="mailto:Jeffery.John@uga.edu" style={{color: "#606060"}}>here!</a>
                    </p>
                </div>
            </center>
        <div>
          <div id="schedule_form" mb-0>
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/jefferyjohn/45-minute-meeting"
              style={{ minWidth: '320px', height: '800px' }} 
            />       
          </div>
        </div>
      </div>
    );    
  }
}

export default Contact;


