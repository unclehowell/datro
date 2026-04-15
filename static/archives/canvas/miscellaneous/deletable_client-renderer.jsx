import React from 'react';
import { createRoot } from 'react-dom/client';

// Define the components used in Puck. This should ideally be shared with puck-editor.jsx
// For now, I'll copy the definitions. In a more complex setup, these would be imported from a shared library.
const components = {
  Section: ({ children }) => <div className="container-fluid">{children}</div>,
  Row: ({ children }) => <div className="row">{children}</div>,
  Column: ({ children, lg, md, sm, xs }) => {
    const classes = [];
    if (lg) classes.push(`col-lg-${lg}`);
    if (md) classes.push(`col-md-${md}`);
    if (sm) classes.push(`col-sm-${sm}`);
    if (xs) classes.push(`col-${xs}`);
    return <div className={classes.join(' ')}>{children}</div>;
  },
  Heading: ({ text, level }) => {
    const H = level || 'h3';
    return <H className="mb-0">{text}</H>;
  },
  SmallBox: ({ value, description, iconClass, linkText, linkHref, bgColorClass }) => (
    <div className={`small-box ${bgColorClass}`}>
      <div className="inner">
        <h3>{value}</h3>
        <p>{description}</p>
      </div>
      <svg className="small-box-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"></path></svg>
      <a href={linkHref} className="small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover">
        {linkText} <i className="bi bi-link-45deg"></i>
      </a>
    </div>
  ),
  Card: ({ title, children, bgColorClass, footerContent }) => (
    <div className={`card mb-4 ${bgColorClass || ''}`}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body">{children}</div>
      {footerContent && <div className="card-footer" dangerouslySetInnerHTML={{ __html: footerContent }}></div>}
    </div>
  ),
  Image: ({ src, alt, className }) => <img src={src} alt={alt} className={className} />,
  RevenueChart: () => <div id="revenue-chart"></div>,
  WorldMap: () => <div id="world-map" style={{ height: '220px' }}></div>,
  SparklineRow: ({ visitors, online, sales }) => (
    <div className="row">
      <div className="col-4 text-center"><div id="sparkline-1" className="text-dark"></div><div className="text-white">{visitors}</div></div>
      <div className="col-4 text-center"><div id="sparkline-2" className="text-dark"></div><div className="text-white">{online}</div></div>
      <div className="col-4 text-center"><div id="sparkline-3" className="text-dark"></div><div className="text-white">{sales}</div></div>
    </div>
  ),
  DirectChatCard: () => (
    <div className="card direct-chat direct-chat-primary mb-4">
        <div className="card-header">
            <h3 className="card-title">Direct Chat</h3>
            <div className="card-tools">
                <span title="3 New Messages" className="badge text-bg-primary">3</span>
                <button type="button" className="btn btn-tool" data-lte-toggle="card-collapse"><i data-lte-icon="expand" className="bi bi-plus-lg"></i><i data-lte-icon="collapse" className="bi bi-dash-lg"></i></button>
                <button type="button" className="btn btn-tool" title="Contacts" data-lte-toggle="chat-pane"><i className="bi bi-chat-text-fill"></i></button>
                <button type="button" className="btn btn-tool" data-lte-toggle="card-remove"><i className="bi bi-x-lg"></i></button>
            </div>
        </div>
        <div className="card-body">
            <div className="direct-chat-messages">
                <div className="direct-chat-msg">
                    <div className="direct-chat-infos clearfix"><span className="direct-chat-name float-start">Alexander Pierce</span><span className="direct-chat-timestamp float-end">23 Jan 2:00 pm</span></div>
                    <img className="direct-chat-img" src="assets/img/user1-128x128.jpg" alt="message user image" />
                    <div className="direct-chat-text">Is this template really for free? That's unbelievable!</div>
                </div>
                <div className="direct-chat-msg end">
                    <div className="direct-chat-infos clearfix"><span className="direct-chat-name float-end">Sarah Bullock</span><span className="direct-chat-timestamp float-start">23 Jan 2:05 pm</span></div>
                    <img className="direct-chat-img" src="assets/img/user3-128x128.jpg" alt="message user image" />
                    <div className="direct-chat-text">You better believe it!</div>
                </div>
                <div className="direct-chat-msg">
                    <div className="direct-chat-infos clearfix"><span className="direct-chat-name float-start">Alexander Pierce</span><span className="direct-chat-timestamp float-end">23 Jan 5:37 pm</span></div>
                    <img className="direct-chat-img" src="assets/img/user1-128x128.jpg" alt="message user image" />
                    <div className="direct-chat-text">Working with AdminLTE on a great new app! Wanna join?</div>
                </div>
                <div className="direct-chat-msg end">
                    <div className="direct-chat-infos clearfix"><span className="direct-chat-name float-end">Sarah Bullock</span><span className="direct-chat-timestamp float-start">23 Jan 6:10 pm</span></div>
                    <img className="direct-chat-img" src="assets/img/user3-128x128.jpg" alt="message user image" />
                    <div className="direct-chat-text">I would love to.</div>
                </div>
            </div>
            <div className="direct-chat-contacts">
                <ul className="contacts-list">
                    <li><a href="#"><img className="contacts-list-img" src="assets/img/user1-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Count Dracula<small className="contacts-list-date float-end">2/28/2023</small></span><span className="contacts-list-msg">How have you been? I was...</span></div></a></li>
                    <li><a href="#"><img className="contacts-list-img" src="assets/img/user7-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Sarah Doe<small className="contacts-list-date float-end">2/23/2023</small></span><span className="contacts-list-msg">I will be waiting for...</span></div></a></li>
                    <li><a href="#"><img className="contacts-list-img" src="assets/img/user3-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Nadia Jolie<small className="contacts-list-date float-end">2/20/2023</small></span><span className="contacts-list-msg">I\'ll call you back at...</span></div></a></li>
                    <li><a href="#"><img className="contacts-list-img" src="assets/img/user5-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Nora S. Vans<small className="contacts-list-date float-end">2/10/2023</small></span><span className="contacts-list-msg">Where is your new...</span></div></a></li>
                    <li><a href="#"><img className="contacts-list-img" src="assets/img/user6-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">John K.<small className="contacts-list-date float-end">1/27/2023</small></span><span className="contacts-list-msg">Can I take a look at...</span></div></a></li>
                    <li><a href="#"><img className="contacts-list-img" src="assets/img/user8-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Kenneth M.<small className="contacts-list-date float-end">1/4/2023</small></span><span className="contacts-list-msg">Never mind I found...</span></div></a></li>
                </ul>
            </div>
        </div>
        <div className="card-footer">
            <form action="#" method="post">
                <div className="input-group">
                    <input type="text" name="message" placeholder="Type Message ..." className="form-control" />
                    <span className="input-group-append"><button type="button" className="btn btn-primary">Send</button></span>
                </div>
            </form>
        </div>
    </div>
  ),
};

const RenderPuck = ({ data }) => {
  if (!data || !data.content) {
    return <div>No content to display.</div>;
  }

  const renderComponent = (item, index) => {
    const Component = components[item.type];
    if (!Component) {
      console.warn(`Unknown component type: ${item.type}`);
      return null;
    }
    return (
      <Component key={index} {...item.props}>
        {item.children && item.children.map(renderComponent)}
      </Component>
    );
  };

  return <>{data.content.map(renderComponent)}</>;
};

(async () => {
  try {
    const response = await fetch('index.json');
    const data = await response.json();

    const rootElement = document.getElementById('page-content-root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(<RenderPuck data={data} />);
    } else {
      console.error('Root element #page-content-root not found.');
    }
  } catch (error) {
    console.error('Failed to load or render page content:', error);
  }
})();