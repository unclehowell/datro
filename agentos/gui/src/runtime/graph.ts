// ============================================================
// Execution Graph v2 — DAG of dependent tasks
// ============================================================

import { v4 as uuid } from "uuid";
import {
  ExecutionGraph, GraphNode, GraphEdge, Action, ToolCallResult,
  VerificationResult, ReflectionResult,
} from "./types";

export class ExecutionGraphManager {
  private graphs: Map<string, ExecutionGraph> = new Map();

  // ─── Create ────────────────────────────────────────────

  createGraph(sessionId: string): ExecutionGraph {
    const graph: ExecutionGraph = {
      id: uuid(),
      sessionId,
      nodes: [],
      edges: [],
      executionOrder: [],
      completedNodes: [],
      failedNodes: [],
      blockedNodes: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.graphs.set(graph.id, graph);
    return graph;
  }

  // ─── Build from Actions ────────────────────────────────

  buildFromActions(graphId: string, actions: Action[]): ExecutionGraph {
    const graph = this.graphs.get(graphId);
    if (!graph) throw new Error(`Graph not found: ${graphId}`);

    // Create nodes for each action
    const nodes: GraphNode[] = actions.map((action) => ({
      id: action.id,
      action,
      status: "pending" as const,
    }));

    // Create edges based on dependencies
    const edges: GraphEdge[] = [];
    for (const action of actions) {
      for (const depId of action.dependsOn) {
        edges.push({ from: depId, to: action.id, type: "depends" });
      }
    }

    graph.nodes = nodes;
    graph.edges = edges;
    graph.executionOrder = this.topologicalSort(nodes, edges);
    graph.updatedAt = Date.now();

    return graph;
  }

  // ─── Query ─────────────────────────────────────────────

  getGraph(graphId: string): ExecutionGraph | undefined {
    return this.graphs.get(graphId);
  }

  getGraphBySessionId(sessionId: string): ExecutionGraph | undefined {
    return Array.from(this.graphs.values()).find((g: ExecutionGraph) => g.sessionId === sessionId);
  }

  // Get nodes ready to execute (all dependencies met)
  getReadyNodes(graphId: string): GraphNode[] {
    const graph = this.graphs.get(graphId);
    if (!graph) return [];

    return graph.nodes.filter((node: GraphNode) => {
      if (node.status !== "pending") return false;

      // Check all incoming edges
      const incomingEdges: GraphEdge[] = graph.edges.filter((e: GraphEdge) => e.to === node.id);
      return incomingEdges.every((edge: GraphEdge) => graph.completedNodes.includes(edge.from));
    });
  }

  // Get nodes that can run in parallel
  getParallelBatch(graphId: string): GraphNode[] {
    const ready = this.getReadyNodes(graphId);
    // Filter out nodes that block each other
    const batch: GraphNode[] = [];
    const blocking = new Set<string>();

    for (const node of ready) {
      if (blocking.has(node.id)) continue;
      batch.push(node);

      // Mark nodes this one blocks
      const outgoing: GraphEdge[] = this.graphs.get(graphId)?.edges.filter((e: GraphEdge) => e.from === node.id) || [];
      for (const edge of outgoing) {
        blocking.add(edge.to);
      }
    }

    return batch;
  }

  // ─── Update ────────────────────────────────────────────

  markNodeRunning(graphId: string, nodeId: string): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;
    const node: GraphNode | undefined = graph.nodes.find((n: GraphNode) => n.id === nodeId);
    if (node) {
      node.status = "running";
      node.startedAt = Date.now();
      graph.updatedAt = Date.now();
    }
  }

  markNodeCompleted(graphId: string, nodeId: string, result: ToolCallResult): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;
    const node: GraphNode | undefined = graph.nodes.find((n: GraphNode) => n.id === nodeId);
    if (node) {
      node.status = "completed";
      node.result = result;
      node.completedAt = Date.now();
      node.duration = Date.now() - (node.startedAt || Date.now());
      graph.completedNodes.push(nodeId);
      graph.updatedAt = Date.now();
    }
  }

  markNodeFailed(graphId: string, nodeId: string, result: ToolCallResult): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;
    const node: GraphNode | undefined = graph.nodes.find((n: GraphNode) => n.id === nodeId);
    if (node) {
      node.status = "failed";
      node.result = result;
      node.completedAt = Date.now();
      graph.failedNodes.push(nodeId);
      graph.updatedAt = Date.now();

      // Mark all downstream nodes as blocked
      this.markDownstreamBlocked(graphId, nodeId);
    }
  }

  setNodeVerification(graphId: string, nodeId: string, verification: VerificationResult): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;
    const node: GraphNode | undefined = graph.nodes.find((n: GraphNode) => n.id === nodeId);
    if (node) {
      node.verification = verification;
      graph.updatedAt = Date.now();
    }
  }

  setNodeReflection(graphId: string, nodeId: string, reflection: ReflectionResult): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;
    const node: GraphNode | undefined = graph.nodes.find((n: GraphNode) => n.id === nodeId);
    if (node) {
      node.reflection = reflection;
      graph.updatedAt = Date.now();
    }
  }

  // ─── Status ────────────────────────────────────────────

  isComplete(graphId: string): boolean {
    const graph = this.graphs.get(graphId);
    if (!graph) return false;
    return graph.nodes.every((n: GraphNode) => n.status === "completed" || n.status === "skipped");
  }

  hasFailures(graphId: string): boolean {
    const graph = this.graphs.get(graphId);
    if (!graph) return false;
    return graph.failedNodes.length > 0;
  }

  getProgress(graphId: string): number {
    const graph = this.graphs.get(graphId);
    if (!graph || graph.nodes.length === 0) return 0;
    return graph.completedNodes.length / graph.nodes.length;
  }

  getStats(graphId: string): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    blocked: number;
  } {
    const graph = this.graphs.get(graphId);
    if (!graph) return { total: 0, pending: 0, running: 0, completed: 0, failed: 0, blocked: 0 };

    return {
      total: graph.nodes.length,
      pending: graph.nodes.filter((n: GraphNode) => n.status === "pending").length,
      running: graph.nodes.filter((n: GraphNode) => n.status === "running").length,
      completed: graph.completedNodes.length,
      failed: graph.failedNodes.length,
      blocked: graph.blockedNodes.length,
    };
  }

  // ─── Topological Sort ──────────────────────────────────

  private topologicalSort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      adjacency.get(edge.from)?.push(edge.to);
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);
      for (const neighbor of adjacency.get(current) || []) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    return sorted;
  }

  private markDownstreamBlocked(graphId: string, nodeId: string): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;

    const outgoing: GraphEdge[] = graph.edges.filter((e: GraphEdge) => e.from === nodeId);
    for (const edge of outgoing) {
      const targetNode: GraphNode | undefined = graph.nodes.find((n: GraphNode) => n.id === edge.to);
      if (targetNode && targetNode.status === "pending") {
        targetNode.status = "skipped";
        graph.blockedNodes.push(edge.to);
        // Recurse
        this.markDownstreamBlocked(graphId, edge.to);
      }
    }
  }
}
