import React, { useState, useEffect } from "react";
import styled from 'styled-components'
import Microlink from '@microlink/react'
import {
    mediaHeading
} from "../../editable-stuff/configurations.json";

const LinkPreview = styled(Microlink)`
  max-width:90%;
  border-radius: 0.4;
  width: 21rem;

`
 
class Media extends React.Component {
  render() {
    const layout = [
    ];
    return (
        <div id="media" className="jumbotron jumbotron-fluid m-0">
            <div className="container container-fluid p-0">
                <h1 className="display-4 pb-5 mb-4 mr-5 pr-0 text-center">{mediaHeading}</h1>
                    <div className="container container-fluid p-0">
                        <center>
                            <div class ="Media" pl-5>
                                <div class="Table">
                                    <div class="Row no-gutters">
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://news.uga.edu/traveling-mars-complicated-teamwork/' size='large' />
                                            </p>
                                        </div>
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://www.facebook.com/universityofga/posts/10156156339741682' size='large' />
                                            </p>
                                        </div>
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://www.facebook.com/pinecrestacademy/posts/3015833058447949' size='large' />
                                            </p>
                                        </div>
                                    </div>
                                    <div class="Row no-gutters">
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://www.forsythnews.com/local/lifestyles/club-at-pinecrest-combines-crafting-with-service/' size='large' />
                                            </p>
                                        </div>
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://twitter.com/jfrum/status/1237008902136434688?s=20' size='large' />
                                            </p>
                                        </div>
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://www.northfulton.com/sports/pinecrest-academy-wins-back-to-back-mock-trial-regional-championship/article_b38112cc-a26f-57b8-a39c-0fb4eafcbb64.html' size='large' />
                                            </p>
                                        </div>
                                    </div>
                                    <div class="Row no-gutters">
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://www.northfulton.com/sports/pinecrest-academy-named-mock-trial-region-champs/article_25cf38e4-25fc-5e29-9ba8-7a0e86c3ef33.html' size='large' />
                                            </p>
                                        </div>
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://www.gainesvilletimes.com/life/life-top-stories/pinecrest-academy-students-create-bouquet-of-origami-cranes-for-paris-beirut/' size='large' />
                                            </p>
                                        </div>
                                        <div class="Cell">
                                            <p>
                                                <LinkPreview url='https://www.redandblack.com/special_projects/cracking-the-code-ugahacks-5-unites-more-than-500-hackers-under-one-roof-for-36/article_e4b3fb8a-4c6c-11ea-a411-4f932859ff77.html' size='large' />
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </center>
                    </div>
            </div>
        </div>
    )
  }
}

export default Media;

