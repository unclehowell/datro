import React, { useState, useEffect, useCallback } from "react";
import ProjectCard from "./ProjectCard";
import axios from "axios";
import Iframe from 'react-iframe';
import {
  projectHeading,
  gitHubLink,
  gitHubUsername,
  gitHubQuery,
  projectsLength,
} from "../../editable-stuff/configurations.json";

const Project = () => {
  const [projectsArray, setProjectsArray] = useState([]);

  const handleRequest = useCallback((e) => {
    axios
      .get(gitHubLink + gitHubUsername + gitHubQuery)
      .then((response) => {
        // handle success
        // console.log(response.data.slice(0, 4));
        return setProjectsArray(response.data.slice(0, projectsLength));
      })
      .catch((error) => {
        // handle error
        return console.error(error.message);
      })
      .finally(() => {
        // always executed
      });
  }, []);

  useEffect(() => {
    handleRequest();
  }, [handleRequest]);

    return (
    <div id="projects" className="jumbotron jumbotron-fluid bg-transparent m-0">
        {projectsArray.length && (
        <div className="container container-fluid p-5">
            <h1 className="display-4 pb-5 mb-4 text-center">{projectHeading}</h1>
                <div className="row mb-1 pb-1">
                    {projectsArray.map((project) => (
                        <ProjectCard key={project.id} id={project.id} value={project} />
                    ))}
                </div>
        </div>
        )}
        <center>
                <Iframe url="https://sketchfab.com/models/bef9ecbc0f864f3a9f21f5a896cf52a9/embed?preload=1&amp;ui_controls=1&amp;ui_infos=1&amp;ui_inspector=1&amp;ui_stop=1&amp;ui_watermark=1&amp;ui_watermark_link=1"
                    width="700px"
                    height="500px"
                    id="3d-model"
                    className="ModelViewer"
                    display="initial"
                    position="relative"
                    frameBorder="0"
                />
        </center>
    </div>
    );
};

export default Project;