import React from "react";
import { createRoot } from "react-dom/client";
import { Puck } from "@measured/puck";

const config = {
  components: {
    // Basic structural components
    Section: {
      render: ({ children }) => <div className="container-fluid">{children}</div>,
      fields: {},
    },
    Row: {
      render: ({ children }) => <div className="row">{children}</div>,
      fields: {},
    },
    Column: {
      render: ({ children, lg, md, sm, xs }) => {
        const classes = [];
        if (lg) classes.push(`col-lg-${lg}`);
        if (md) classes.push(`col-md-${md}`);
        if (sm) classes.push(`col-sm-${sm}`);
        if (xs) classes.push(`col-${xs}`);
        return <div className={classes.join(' ')}>{children}</div>;
      },
      fields: {
        lg: { type: 'number', label: 'Large (>=992px)' },
        md: { type: 'number', label: 'Medium (>=768px)' },
        sm: { type: 'number', label: 'Small (>=576px)' },
        xs: { type: 'number', label: 'Extra Small (<576px)' },
      },
    },

    // Content Components
    Heading: { // Already exists, expanded
      fields: {
        text: { type: "text", label: "Heading Text" },
        level: {
          type: "select",
          options: [{ label: "H1", value: "h1" }, { label: "H2", value: "h2" }, { label: "H3", value: "h3" }],
          defaultValue: "h3",
          label: "Heading Level"
        }
      },
      render: ({ text, level }) => {
        const H = level || 'h3';
        return <H className="mb-0">{text}</H>;
      }
    },
    SmallBox: {
      render: ({ value, description, iconClass, linkText, linkHref, bgColorClass }) => (
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
      fields: {
        value: { type: 'text', label: 'Value' },
        description: { type: 'text', label: 'Description' },
        iconClass: { type: 'text', helpText: 'e.g., bi-cart-fill', label: 'Icon Class (Bootstrap Icons)' },
        linkText: { type: 'text', label: 'Link Text' },
        linkHref: { type: 'text', label: 'Link URL' },
        bgColorClass: {
          type: 'select',
          options: [
            { label: 'Primary', value: 'text-bg-primary' },
            { label: 'Success', value: 'text-bg-success' },
            { label: 'Warning', value: 'text-bg-warning' },
            { label: 'Danger', value: 'text-bg-danger' },
          ],
          defaultValue: 'text-bg-primary',
          label: 'Background Color'
        },
      },
    },
    Card: {
      render: ({ title, children, bgColorClass, footerContent }) => (
        <div className={`card mb-4 ${bgColorClass || ''}`}>
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
          <div className="card-body">{children}</div>
          {footerContent && <div className="card-footer" dangerouslySetInnerHTML={{ __html: footerContent }}></div>}
        </div>
      ),
      fields: {
        title: { type: 'text', label: 'Card Title' },
        bgColorClass: {
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Primary Gradient', value: 'text-white bg-primary bg-gradient border-primary' },
          ],
          defaultValue: '',
          label: 'Background Color'
        },
        footerContent: { type: 'text', multiline: true, label: 'Footer HTML (Optional)' },
      },
      blocks: {
          // Allow all components to be nested within the card body
          all: {}
      }
    },
    Image: {
      render: ({ src, alt, className }) => <img src={src} alt={alt} className={className} />,
      fields: {
        src: { type: 'text', label: 'Image Source (URL)' },
        alt: { type: 'text', label: 'Alt Text' },
        className: { type: 'text', defaultValue: 'img-fluid', label: 'CSS Classes' },
      },
    },
    RevenueChart: {
        render: () => <div id="revenue-chart"></div>,
        fields: {},
        category: 'Charts',
        label: 'Sales Revenue Chart'
    },
    WorldMap: {
        render: () => <div id="world-map" style={{ height: '220px' }}></div>,
        fields: {},
        category: 'Maps',
        label: 'World Map'
    },
    SparklineRow: {
        render: ({ visitors, online, sales }) => (
            <div className="row">
                <div className="col-4 text-center"><div id="sparkline-1" className="text-dark"></div><div className="text-white">{visitors}</div></div>
                <div className="col-4 text-center"><div id="sparkline-2" className="text-dark"></div><div className="text-white">{online}</div></div>
                <div className="col-4 text-center"><div id="sparkline-3" className="text-dark"></div><div className="text-white">{sales}</div></div>
            </div>
        ),
        fields: {
            visitors: { type: 'text', defaultValue: 'Visitors', label: 'Visitors Label' },
            online: { type: 'text', defaultValue: 'Online', label: 'Online Label' },
            sales: { type: 'text', defaultValue: 'Sales', label: 'Sales Label' },
        },
        category: 'Charts',
        label: 'Sparkline Row'
    },
    DirectChatCard: {
        render: () => {
            // This is a complex static block for now.
            // In a real application, this would be broken down further into editable components
            // or fetch data from an API. For now, it's rendered as a static placeholder.
            return (
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
                        <li><a href="#"><img className="contacts-list-img" src="assets/img/user3-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Nadia Jolie<small className="contacts-list-date float-end">2/20/2023</small></span><span className="contacts-list-msg">I'll call you back at...</span></div></a></li>
                        <li><a href="#"><img className="contacts-list-img" src="assets/img/user5-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Nora S. Vans<small className="contacts-list-date float-end">2/10/2023</small></span><span className="contacts-list-msg">Where is your new...</span></div></a></li>
                        <li><a href="#"><img className="contacts-list-img" src="assets/img/user6-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">John K.<small className="contacts-list-date float-end">1/27/2023</small></span><span className="contacts-list-msg">Can I take a look at...</span></div></a></li>
                        <li><a href="#"><img className="contacts-list-img" src="assets/img/user8-128x128.jpg" alt="User Avatar" /><div className="contacts-list-info"><span className="contacts-list-name">Kenneth M.<small class="contacts-list-date float-end">1/4/2023</small></span><span class="contacts-list-msg">Never mind I found...</span></div></a></li>
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
            )
        },
        fields: {},
        category: 'Widgets',
        label: 'Direct Chat Card'
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
