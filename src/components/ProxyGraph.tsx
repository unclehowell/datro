import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  label: string;
  type: 'source' | 'orchestrator' | 'llm' | 'cli' | 'ide' | 'memory' | 'proxy' | 'network';
  category: string;
  color: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type: 'active' | 'passive' | 'registration';
  label?: string;
}

const NODES: Node[] = [
  { id: 'parent-proxy', label: 'Parent Proxy\nfinancecheque.uk', type: 'network', category: 'network', color: '#ff6b6b' },
  { id: 'device', label: 'Device\nTerminal', type: 'source', category: 'input', color: '#ffd93d' },
  { id: 'telegram', label: 'Telegram\nBot', type: 'source', category: 'input', color: '#ffd93d' },
  { id: 'hermes', label: 'Hermes\nAgent', type: 'orchestrator', category: 'core', color: '#6bcbff' },
  { id: 'minicpm', label: 'MiniCPM-1B\nQ8 @ :8090', type: 'llm', category: 'llm', color: '#a66cff' },
  { id: 'opencode', label: 'opencode\nCLI', type: 'cli', category: 'tool', color: '#51cf66' },
  { id: 'kilo', label: 'kilo\nCLI', type: 'cli', category: 'tool', color: '#51cf66' },
  { id: 'kiro', label: 'kiro\nCLI', type: 'cli', category: 'tool', color: '#51cf66' },
  { id: 'vscode', label: 'VSCode\nIDE', type: 'ide', category: 'tool', color: '#339af0' },
  { id: 'cursor', label: 'Cursor\nIDE', type: 'ide', category: 'tool', color: '#339af0' },
  { id: 'obsidian', label: 'Obsidian\nVault', type: 'memory', category: 'memory', color: '#fcc419' },
  { id: 'mem0', label: 'Mem0\nMemory', type: 'memory', category: 'memory', color: '#fcc419' },
  { id: 'honcho', label: 'Honcho\nMemory', type: 'memory', category: 'memory', color: '#fcc419' },
  { id: 'llmwiki', label: 'LLM Wiki\nKnowledge', type: 'memory', category: 'memory', color: '#fcc419' },
  { id: 'laptop', label: 'Laptop\nChild Proxy', type: 'proxy', category: 'device', color: '#20c997' },
  { id: 'phone', label: 'Phone\nChild Proxy', type: 'proxy', category: 'device', color: '#20c997' },
];

const LINKS: Link[] = [
  { source: 'parent-proxy', target: 'hermes', type: 'active', label: 'api/proxy' },
  { source: 'device', target: 'hermes', type: 'active', label: 'stdin' },
  { source: 'telegram', target: 'hermes', type: 'passive', label: 'webhook' },
  { source: 'hermes', target: 'minicpm', type: 'active', label: 'v1/chat' },
  { source: 'hermes', target: 'opencode', type: 'passive', label: 'tool call' },
  { source: 'hermes', target: 'kilo', type: 'passive', label: 'tool call' },
  { source: 'hermes', target: 'kiro', type: 'passive', label: 'tool call' },
  { source: 'hermes', target: 'obsidian', type: 'passive', label: 'brain read' },
  { source: 'hermes', target: 'mem0', type: 'passive', label: 'memory read' },
  { source: 'hermes', target: 'honcho', type: 'passive', label: 'memory read' },
  { source: 'hermes', target: 'llmwiki', type: 'passive', label: 'wiki read' },
  { source: 'laptop', target: 'hermes', type: 'registration', label: 'agent.py:6000' },
  { source: 'phone', target: 'hermes', type: 'registration', label: 'phone:6000' },
  { source: 'parent-proxy', target: 'laptop', type: 'passive', label: 'heartbeat' },
  { source: 'parent-proxy', target: 'phone', type: 'passive', label: 'heartbeat' },
  { source: 'minicpm', target: 'vscode', type: 'passive', label: 'completions' },
  { source: 'minicpm', target: 'cursor', type: 'passive', label: 'completions' },
  { source: 'laptop', target: 'minicpm', type: 'active', label: 'llama-server:8090' },
];

export default function ProxyGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePath, setActivePath] = useState(true);

  const getLinkColor = (type: string) => {
    switch (type) {
      case 'active': return '#6bcbff';
      case 'passive': return 'rgba(255,255,255,0.15)';
      case 'registration': return 'rgba(32,201,127,0.4)';
      default: return 'rgba(255,255,255,0.1)';
    }
  };

  const getLinkWidth = (type: string) => {
    switch (type) {
      case 'active': return 3;
      case 'passive': return 1;
      case 'registration': return 1.5;
      default: return 0.5;
    }
  };

  const getLinkDash = (type: string) => {
    switch (type) {
      case 'active': return '';
      case 'passive': return '6,4';
      case 'registration': return '3,3';
      default: return '2,2';
    }
  };

  const initGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(NODES)
      .force('link', d3.forceLink<Node, Link>(LINKS)
        .id(d => d.id)
        .distance(l => l.type === 'active' ? 120 : (l.type === 'registration' ? 160 : 180))
        .strength(l => l.type === 'active' ? 0.7 : (l.type === 'registration' ? 0.3 : 0.15)))
      .force('charge', d3.forceManyBody<Node>()
        .strength(d => {
          if (d.type === 'orchestrator') return -400;
          if (d.type === 'llm') return -300;
          if (d.type === 'proxy') return -200;
          return -150;
        }))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX<Node>(width / 2).strength(0.05))
      .force('y', d3.forceY<Node>(height / 2).strength(0.05))
      .force('collision', d3.forceCollide<Node>().radius(d => {
        if (d.type === 'orchestrator') return 55;
        if (d.type === 'llm') return 45;
        if (d.type === 'proxy') return 40;
        return 35;
      }))
      .alphaDecay(0.02);

    const link = g.append('g')
      .selectAll('line')
      .data(LINKS)
      .join('line')
      .attr('stroke', d => getLinkColor(d.type))
      .attr('stroke-width', d => getLinkWidth(d.type))
      .attr('stroke-dasharray', d => getLinkDash(d.type))
      .attr('stroke-opacity', d => activePath && d.type === 'active' ? 1 : (d.type === 'active' ? 0.5 : 1));

    const linkLabel = g.append('g')
      .selectAll('text')
      .data(LINKS)
      .join('text')
      .attr('fill', d => d.type === 'active' ? '#6bcbff' : 'rgba(255,255,255,0.25)')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text(d => d.label || '');

    const node = g.append('g')
      .selectAll('g')
      .data(NODES)
      .join('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('circle')
      .attr('r', d => {
        if (d.type === 'orchestrator') return 22;
        if (d.type === 'llm') return 18;
        if (d.type === 'proxy') return 16;
        return 12;
      })
      .attr('fill', d => d.color)
      .attr('stroke', d => {
        if (d.type === 'active' || d.type === 'orchestrator') return '#fff';
        return 'rgba(255,255,255,0.3)';
      })
      .attr('stroke-width', d => d.type === 'orchestrator' ? 3 : 1.5)
      .attr('opacity', d => {
        if (!activePath) return 0.6;
        if (d.type === 'orchestrator' || d.type === 'llm' || d.type === 'proxy') return 1;
        return 0.85;
      });

    node.append('foreignObject')
      .attr('width', 80)
      .attr('height', 36)
      .attr('x', -40)
      .attr('y', -18)
      .append('xhtml:div')
      .style('text-align', 'center')
      .style('font-size', '9px')
      .style('font-family', 'Inter, sans-serif')
      .style('font-weight', '600')
      .style('color', '#fff')
      .style('line-height', '1.3')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.8)')
      .style('pointer-events', 'none')
      .html(d => d.label.replace(/\n/g, '<br/>'));

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      linkLabel
        .attr('x', d => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr('y', d => ((d.source as Node).y! + (d.target as Node).y!) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    svg.on('dblclick.zoom', null);

    return () => {
      simulation.stop();
    };
  }, [activePath]);

  useEffect(() => {
    const cleanup = initGraph();
    const resize = () => {
      initGraph();
    };
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cleanup?.();
    };
  }, [initGraph]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a]" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full" />

      {NODES.filter(n => n.type === 'orchestrator' || n.type === 'llm' || n.type === 'proxy').map(n => (
        <div key={n.id} className="hidden">
          <span style={{ color: n.color }}>{n.label}</span>
        </div>
      ))}

      {LINKS.filter(l => l.type === 'active').map(l => (
        <div key={`${l.source}-${l.target}`} className="hidden">
          <span>{l.label}</span>
        </div>
      ))}
    </div>
  );
}
