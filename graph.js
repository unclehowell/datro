// ── DUAL-HEMISPHERE BRAIN GRAPH ──
(function() {
var MD_FILES = ['AGENT','README','CHANGELOG','MEMORY','SKILLS','HEARTBEAT','SOUL','MASTERPLAN','RULES','TEMPLATE','CONTEXT','GLOSSARY','RESOURCES','TASKS','IDENTITY','SPEC'];
var PERSONAL_BRAIN_FILES = ['PERSONALITY','MEMORY','SKILLS','HARNESS','VALUES'];

var BRANCHES = ['althea','archives','bpvsbuckler','bpvsbuckler-redflag','bucklervsbp','bw_base','carfinancecheque','ccan','ceo','cnei','command','command-agent-endpoint','dash','datro','dcc','financecheque','financecheque-monday-agent','gh-pages','gui','hbnb','library','llmwiki','pirateclaw','rerelease','subrepos','ui','wave','wayback','whitepaper'];

var BRANCH_COLORS = {
  althea:'#ff6b6b', archives:'#c9a96e', bpvsbuckler:'#4ecdc4', 'bpvsbuckler-redflag':'#ff4444',
  bucklervsbp:'#45b7d1', bw_base:'#96ceb4', carfinancecheque:'#45b7d1',
  ccan:'#96ceb4', ceo:'#ffeead', cnei:'#ff4444', command:'#00e5ff', dash:'#d4a574',
  datro:'#00e5ff', dcc:'#ffd93d', financecheque:'#6bcb77',
  'financecheque-monday-agent':'#6bcb77', 'gh-pages':'#748ffc', gui:'#ff6b6b',
  hbnb:'#ff922b', library:'#69db7c', llmwiki:'#f783ac',
  pirateclaw:'#be4bdb', rerelease:'#20c997', subrepos:'#748ffc',
  ui:'#20c997', wave:'#f06595', wayback:'#a9e34b', whitepaper:'#e8590c'
};

var CATEGORIES = {
  platform: ['cnei','command','gh-pages','rerelease'],
  frontend: ['gui','ui','dash','hbnb'],
  docs: ['wayback','library','llmwiki','whitepaper','althea','archives'],
  finance: ['financecheque','carfinancecheque','financecheque-monday-agent'],
  legal: ['bpvsbuckler','bpvsbuckler-redflag','bucklervsbp'],
  core: ['datro','dcc','ccan','ceo','subrepos','bw_base'],
  experimental: ['wave','pirateclaw','command-agent-endpoint']
};

var CAT_COLORS = {
  platform:'#00e5ff', frontend:'#ff6b6b', docs:'#a9e34b',
  finance:'#6bcb77', legal:'#4ecdc4', core:'#ffd93d', experimental:'#be4bdb'
};

var CAT_ORDER = ['platform','frontend','docs','finance','legal','core','experimental'];

// LEFT = Personal brain (green #00ff66), RIGHT = Project brain (blue #0088ff)
var LEFT_COLOR = '#00ff66';
var RIGHT_COLOR = '#0088ff';
var BRAIN_COLOR = '#ff4444';

var nodes = [];
var links = [];
var branchNodes = {};
var fileNodeMap = {};
var brainNodeMap = {};
var releaseActivity = {};

// Fetch release activity from worker
function fetchReleaseActivity() {
  fetch('/api/flywheel/state')
    .then(function(r) { return r.json(); })
    .then(function(state) {
      if (state && state.last_releases) {
        releaseActivity = state.last_releases;
        updateReleaseIndicators();
      }
    })
    .catch(function() {});
}

function updateReleaseIndicators() {
  var now = Date.now();
  Object.keys(releaseActivity).forEach(function(branch) {
    var ts = releaseActivity[branch];
    var age = now - ts;
    var isRecent = age < 7200000; // within 2 hours
    var node = branchNodes['b:' + branch];
    if (node) {
      node.recentRelease = isRecent;
      node.releaseAge = age;
    }
  });
  if (graphSim) {
    graphSim.alpha(0.1).restart();
  }
}

// Create brain nodes (hemisphere root nodes)
function addBrainNodes() {
  // Personal Brain (left hemisphere)
  var personalRoot = {
    id: 'brain:personal',
    label: 'PERSONAL BRAIN',
    type: 'brain',
    hemisphere: 'left',
    color: LEFT_COLOR,
  };
  nodes.push(personalRoot);
  brainNodeMap['personal'] = personalRoot;

  PERSONAL_BRAIN_FILES.forEach(function(f) {
    var fid = 'brain:personal/' + f;
    var fn = {
      id: fid,
      label: f,
      type: 'file',
      side: 'brain',
      hemisphere: 'left',
      parent: 'personal',
    };
    nodes.push(fn);
    fileNodeMap[fid] = fn;
    links.push({ source: 'brain:personal', target: fid, side: 'left' });
  });

  // Project Brain (right hemisphere) - per branch
  BRANCHES.forEach(function(b) {
    var bid = 'brain:project/' + b;
    var bn = {
      id: bid,
      label: b,
      type: 'project_brain',
      hemisphere: 'right',
      branch: b,
      color: BRANCH_COLORS[b] || '#888',
    };
    nodes.push(bn);
    brainNodeMap['project/' + b] = bn;
    links.push({ source: 'b:' + b, target: bid, side: 'right' });

    // Each project brain has MASTERPLAN, CONTEXT, TASKS, RULES, HEARTBEAT
    var projectFiles = ['MASTERPLAN','CONTEXT','TASKS','RULES','HEARTBEAT'];
    projectFiles.forEach(function(f) {
      var fid = 'brain:project/' + b + '/' + f;
      var fn = {
        id: fid,
        label: f,
        type: 'file',
        side: 'brain',
        hemisphere: 'right',
        branch: b,
        parent: b,
      };
      nodes.push(fn);
      fileNodeMap[fid] = fn;
      links.push({ source: bid, target: fid, side: 'right' });
    });
  });
}

// Existing branch nodes + file nodes
function addRepoNodes() {
  BRANCHES.forEach(function(b) {
    var cat = null;
    for (var c in CATEGORIES) {
      if (CATEGORIES[c].indexOf(b) !== -1) { cat = c; break; }
    }
    var catIdx = cat ? CAT_ORDER.indexOf(cat) : 0;

    var bn = {
      id: 'b:' + b,
      label: b,
      type: 'branch',
      branch: b,
      color: BRANCH_COLORS[b] || '#888',
      category: cat || 'other',
      catIdx: catIdx,
      recentRelease: false,
      releaseAge: Infinity,
    };
    nodes.push(bn);
    branchNodes[b] = bn;

    MD_FILES.forEach(function(f) {
      var fid = 'l:' + b + '/' + f;
      var fn = {
        id: fid,
        label: f,
        type: 'file',
        side: 'left',
        branch: b,
        parent: b,
      };
      nodes.push(fn);
      fileNodeMap[fid] = fn;
      links.push({ source: 'b:' + b, target: fid, side: 'left' });
    });

    MD_FILES.forEach(function(f) {
      var fid = 'r:' + b + '/' + f;
      var fn = {
        id: fid,
        label: f,
        type: 'file',
        side: 'right',
        branch: b,
        parent: b,
      };
      nodes.push(fn);
      fileNodeMap[fid] = fn;
      links.push({ source: 'b:' + b, target: fid, side: 'right' });
    });
  });
}

// Category links
function addCategoryLinks() {
  CAT_ORDER.forEach(function(cat) {
    var members = CATEGORIES[cat] || [];
    for (var i = 0; i < members.length; i++) {
      for (var j = i + 1; j < members.length; j++) {
        links.push({ source: 'b:' + members[i], target: 'b:' + members[j], type: 'category' });
      }
    }
  });
}

var graphSvg = null;
var graphSim = null;
var graphWidth = 0;
var graphHeight = 0;
var tooltipEl = null;
var pulseTimer = null;

function initGraph(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  var legend = document.createElement('div');
  legend.id = 'graph-legend';
  legend.style.cssText = 'position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);padding:10px;border:1px solid #333;border-radius:4px;font-size:10px;z-index:20;font-family:monospace';
  var legendHtml = '<div style="color:#888;margin-bottom:6px;font-weight:bold">BRAIN CATEGORIES</div>';
  legendHtml += '<div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:8px;height:8px;border-radius:50%;background:' + LEFT_COLOR + '"></span><span style="color:' + LEFT_COLOR + '">personal brain</span></div>';
  legendHtml += '<div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:8px;height:8px;border-radius:50%;background:' + RIGHT_COLOR + '"></span><span style="color:' + RIGHT_COLOR + '">per-branch brain</span></div>';
  legendHtml += '<div style="border-top:1px solid #333;margin:6px 0;padding-top:6px;color:#888;margin-bottom:6px;font-weight:bold">REPO CATEGORIES</div>';
  CAT_ORDER.forEach(function(c) {
    legendHtml += '<div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:8px;height:8px;border-radius:50%;background:' + (CAT_COLORS[c] || '#888') + '"></span><span style="color:#aaa">' + c + '</span></div>';
  });
  legendHtml += '<div style="border-top:1px solid #333;margin:6px 0;padding-top:6px;display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:rgba(255,68,68,0.8)"></span><span style="color:#888">recent release (2h)</span></div>';
  legend.innerHTML = legendHtml;

  tooltipEl = document.createElement('div');
  tooltipEl.id = 'graph-tooltip';
  tooltipEl.style.cssText = 'position:fixed;background:rgba(0,0,0,0.92);border:1px solid ' + LEFT_COLOR + ';border-radius:4px;padding:8px 12px;font-size:11px;pointer-events:none;display:none;z-index:100;font-family:monospace;max-width:300px';

  var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.id = 'graph-svg';
  svgEl.style.cssText = 'width:100%;height:100%;display:block';

  container.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden';
  container.appendChild(legend);
  container.appendChild(tooltipEl);
  container.appendChild(svgEl);

  graphSvg = d3.select('#graph-svg');
  graphWidth = container.clientWidth;
  graphHeight = container.clientHeight;

  buildGraph();
  fetchReleaseActivity();

  window.addEventListener('resize', function() {
    graphWidth = container.clientWidth;
    graphHeight = container.clientHeight;
    if (graphSvg) {
      graphSvg.attr('width', graphWidth).attr('height', graphHeight);
      if (graphSim) {
        graphSim.force('center', d3.forceCenter(graphWidth / 2, graphHeight / 2));
        graphSim.alpha(0.3).restart();
      }
    }
  });
}

function buildGraph() {
  nodes = [];
  links = [];
  branchNodes = {};
  fileNodeMap = {};
  brainNodeMap = {};

  addRepoNodes();
  addBrainNodes();
  addCategoryLinks();

  var svg = graphSvg;
  svg.attr('width', graphWidth).attr('height', graphHeight);

  var g = svg.append('g');
  var cx = graphWidth / 2;
  var cy = graphHeight / 2;
  var branchR = Math.min(graphWidth, graphHeight) * 0.28;

  var zoom = d3.zoom()
    .scaleExtent([0.2, 4])
    .on('zoom', function(event) { g.attr('transform', event.transform); });
  svg.call(zoom);

  graphSim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(function(d) { return d.id; })
      .distance(function(l) {
        if (l.type === 'category') return 80;
        if (l.source && l.source.hemisphere) return 100;
        return 60;
      })
      .strength(function(l) {
        if (l.type === 'category') return 0.5;
        if (l.source && l.source.hemisphere) return 0.2;
        return 0.3;
      }))
    .force('charge', d3.forceManyBody().strength(function(d) {
      if (d.type === 'branch') return -500;
      if (d.type === 'brain') return -800;
      if (d.type === 'project_brain') return -300;
      return -120;
    }))
    .force('center', d3.forceCenter(cx, cy))
    .force('x', d3.forceX(function(d) {
      if (d.type === 'brain') return cx - branchR * 1.2;
      if (d.type === 'project_brain') return cx + branchR * 1.2;
      if (d.type === 'branch') return cx;
      if (d.type === 'file') {
        if (d.hemisphere === 'left') return cx - branchR * 0.8;
        return cx + branchR * 0.8;
      }
      return cx;
    }).strength(0.08))
    .force('y', d3.forceY(function(d) {
      if (d.type === 'brain') return cy;
      if (d.type === 'project_brain') {
        var total = BRANCHES.length;
        var idx = BRANCHES.indexOf(d.branch);
        return cy - branchR * 0.7 + (idx / total) * branchR * 1.4;
      }
      if (d.type === 'branch') {
        var total = BRANCHES.length;
        var idx = BRANCHES.indexOf(d.branch);
        return cy - branchR * 0.7 + (idx / total) * branchR * 1.4;
      }
      return cy + (Math.random() - 0.5) * branchR * 0.5;
    }).strength(0.05))
    .force('collision', d3.forceCollide(function(d) {
      if (d.type === 'brain') return 50;
      if (d.type === 'project_brain') return 25;
      if (d.type === 'branch') return 20;
      return 6;
    }))
    .alphaDecay(0.02);

  // Links
  var link = g.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', function(l) {
      if (l.type === 'category') return 'rgba(255,255,255,0.08)';
      if (l.side === 'left') return LEFT_COLOR;
      return RIGHT_COLOR;
    })
    .attr('stroke-width', function(l) {
      if (l.type === 'category') return 0.5;
      if (l.source && l.source.type === 'brain') return 2;
      if (l.source && l.source.type === 'project_brain') return 1.5;
      return 1;
    })
    .attr('stroke-opacity', function(l) {
      if (l.type === 'category') return 0.15;
      if (l.source && (l.source.type === 'brain' || l.source.type === 'project_brain')) return 0.4;
      return l.side === 'left' ? 0.2 : 0.2;
    })
    .attr('stroke-dasharray', function(l) { return l.type === 'category' ? '3,3' : null; });

  // Nodes
  var node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'graph-node')
    .call(d3.drag()
      .on('start', function(event, d) {
        if (!event.active) graphSim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function(event, d) {
        if (!event.active) graphSim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }));

  // Brain root (Personal)
  node.filter(function(d) { return d.type === 'brain'; })
    .append('circle')
    .attr('r', 18)
    .attr('fill', function(d) { return d.color; })
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('opacity', 0.9)
    .on('mouseover', function(event, d) {
      showTooltip(event, '<b style="color:' + LEFT_COLOR + '">PERSONAL BRAIN</b><br>Personality, Memory, Skills,<br>Harness, Values<br><span style="color:#888;font-size:10px">Left hemisphere — influences personality</span>');
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', function() {
      window.open('/api/brain/personal', '_blank');
    });

  node.filter(function(d) { return d.type === 'brain'; })
    .append('text')
    .text('🧠')
    .attr('x', -7)
    .attr('y', 5)
    .attr('font-size', 16);

  node.filter(function(d) { return d.type === 'brain'; })
    .append('text')
    .text(function(d) { return d.label; })
    .attr('x', 24)
    .attr('y', 4)
    .attr('fill', LEFT_COLOR)
    .attr('font-size', 9)
    .attr('font-family', 'monospace')
    .attr('opacity', 0.7);

  // Project brain nodes
  node.filter(function(d) { return d.type === 'project_brain'; })
    .append('circle')
    .attr('r', 8)
    .attr('fill', function(d) { return d.color; })
    .attr('stroke', RIGHT_COLOR)
    .attr('stroke-width', 1.5)
    .attr('opacity', 0.8)
    .on('mouseover', function(event, d) {
      var html = '<b style="color:' + d.color + '">' + d.branch + '</b> <span style="color:' + RIGHT_COLOR + '">brain</span><br><span style="color:#888">MASTERPLAN, CONTEXT, TASKS, RULES, HEARTBEAT</span>';
      if (releaseActivity && releaseActivity[d.branch]) {
        var age = Math.round((Date.now() - releaseActivity[d.branch]) / 60000);
        html += '<br><span style="color:#ff4444">released ' + age + 'm ago</span>';
      }
      showTooltip(event, html);
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', function(event, d) {
      window.open('https://' + d.branch + '.datro.directory', '_blank');
    });

  node.filter(function(d) { return d.type === 'project_brain'; })
    .append('text')
    .text(function(d) { return d.branch; })
    .attr('x', 14)
    .attr('y', 4)
    .attr('fill', function(d) { return d.color; })
    .attr('font-size', 8)
    .attr('font-family', 'monospace')
    .attr('opacity', 0.8);

  // Branch circles
  var branchCircles = node.filter(function(d) { return d.type === 'branch'; });
  branchCircles.append('circle')
    .attr('r', function(d) { return d.recentRelease ? 14 : 10; })
    .attr('fill', function(d) {
      if (d.recentRelease) return '#ff4444';
      return d.color;
    })
    .attr('stroke', function(d) {
      if (d.recentRelease) return '#ff8888';
      return '#fff';
    })
    .attr('stroke-width', function(d) { return d.recentRelease ? 2.5 : 1.5; })
    .on('mouseover', function(event, d) {
      var html = '<b style="color:' + d.color + '">' + d.branch + '</b><br>category: ' + d.category + '<br>' + MD_FILES.length + ' files';
      if (d.recentRelease) {
        var mins = Math.round(d.releaseAge / 60000);
        html += '<br><span style="color:#ff4444">◉ released ' + mins + 'm ago</span>';
      }
      showTooltip(event, html);
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', function(event, d) {
      window.open('https://' + d.branch + '.datro.directory', '_blank');
    });

  branchCircles.append('text')
    .text(function(d) { return d.branch; })
    .attr('x', 16)
    .attr('y', 4)
    .attr('fill', function(d) { return d.color; })
    .attr('font-size', 10)
    .attr('font-family', 'monospace');

  // File circles (both side files and brain files)
  node.filter(function(d) { return d.type === 'file'; })
    .append('circle')
    .attr('r', function(d) { return d.side === 'brain' ? 4 : 3.5; })
    .attr('fill', function(d) {
      if (d.side === 'brain') return d.hemisphere === 'left' ? LEFT_COLOR : RIGHT_COLOR;
      return d.side === 'left' ? LEFT_COLOR : RIGHT_COLOR;
    })
    .attr('stroke', function(d) {
      if (d.side === 'brain') return 'rgba(255,255,255,0.5)';
      return 'rgba(255,255,255,0.3)';
    })
    .attr('stroke-width', function(d) { return d.side === 'brain' ? 1 : 0.5; })
    .on('mouseover', function(event, d) {
      var color = d.side === 'brain' ? (d.hemisphere === 'left' ? LEFT_COLOR : RIGHT_COLOR) : (d.side === 'left' ? LEFT_COLOR : RIGHT_COLOR);
      var side = d.side === 'brain' ? d.hemisphere + ' brain' : d.side;
      showTooltip(event, '<span style="color:' + color + '">' + d.label + '</span> <span style="color:#666">' + side + '</span><br><span style="color:#888;font-size:10px">' + (d.branch || d.parent) + '</span>');
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', function(event, d) {
      if (d.side === 'brain') {
        window.open('/api/brain/' + (d.parent || d.branch), '_blank');
      }
    });

  // Hemisphere labels
  // Left: Personal Brain
  g.append('text')
    .attr('x', cx - branchR * 1.2 - 30)
    .attr('y', 30)
    .attr('fill', LEFT_COLOR)
    .attr('font-size', 13)
    .attr('font-family', 'monospace')
    .attr('font-weight', 'bold')
    .attr('opacity', 0.7)
    .text('◀ PERSONAL BRAIN');

  // Right: Project Brains
  g.append('text')
    .attr('x', cx + 30)
    .attr('y', 30)
    .attr('fill', RIGHT_COLOR)
    .attr('font-size', 13)
    .attr('font-family', 'monospace')
    .attr('font-weight', 'bold')
    .attr('opacity', 0.7)
    .text('PROJECT BRAINS ▶');

  // Center divider
  g.append('line')
    .attr('x1', cx)
    .attr('y1', 0)
    .attr('x2', cx)
    .attr('y2', graphHeight)
    .attr('stroke', 'rgba(255,255,255,0.08)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '8,4');

  // Brain activity indicators - subtle glow on active brains
  g.append('circle')
    .attr('cx', cx - branchR * 1.2)
    .attr('cy', cy)
    .attr('r', 40)
    .attr('fill', 'none')
    .attr('stroke', LEFT_COLOR)
    .attr('stroke-width', 4)
    .attr('opacity', 0.15)
    .attr('filter', 'url(#glow)');

  // Pulse animation for recent releases
  function pulseRecent() {
    branchCircles.select('circle')
      .transition()
      .duration(800)
      .attr('r', function(d) {
        if (d.recentRelease) return 12;
        return d.type === 'branch' ? 10 : 3.5;
      })
      .transition()
      .duration(800)
      .attr('r', function(d) {
        if (d.recentRelease) return 14;
        return d.type === 'branch' ? 10 : 3.5;
      });
  }

  if (pulseTimer) clearInterval(pulseTimer);
  pulseTimer = setInterval(function() {
    var hasRecent = nodes.some(function(n) { return n.recentRelease; });
    if (hasRecent) pulseRecent();
  }, 2000);

  graphSim.on('tick', function() {
    link
      .attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; });
    node.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  });
}

function showTooltip(event, html) {
  if (!tooltipEl) return;
  tooltipEl.innerHTML = html;
  tooltipEl.style.display = 'block';
  tooltipEl.style.left = (event.clientX + 15) + 'px';
  tooltipEl.style.top = (event.clientY - 10) + 'px';
}

function moveTooltip(event) {
  if (!tooltipEl) return;
  tooltipEl.style.left = (event.clientX + 15) + 'px';
  tooltipEl.style.top = (event.clientY - 10) + 'px';
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.style.display = 'none';
}

function destroyGraph() {
  if (graphSim) {
    graphSim.stop();
    graphSim = null;
  }
  if (pulseTimer) {
    clearInterval(pulseTimer);
    pulseTimer = null;
  }
  var container = document.getElementById('graph-container');
  if (container) container.innerHTML = '';
  tooltipEl = null;
}

function resizeGraph() {
  if (graphSvg && graphSim) {
    var container = document.getElementById('graph-container');
    if (container) {
      graphWidth = container.clientWidth;
      graphHeight = container.clientHeight;
      graphSvg.attr('width', graphWidth).attr('height', graphHeight);
      graphSim.force('center', d3.forceCenter(graphWidth / 2, graphHeight / 2));
      graphSim.alpha(0.3).restart();
    }
  }
}

window.graphInit = initGraph;
window.graphResize = resizeGraph;
window.graphDestroy = destroyGraph;
})();
