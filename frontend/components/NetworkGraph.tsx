'use client'

import { useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { NetworkNode, NetworkEdge } from '@shared/types'

type Props = {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  onEvidenceOpen: (ids: string[]) => void
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  same_target: '#34d399',
  same_mechanism: '#38bdf8',
  shared_indication: '#fbbf24',
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  same_target: 'Same target',
  same_mechanism: 'Same mechanism',
  shared_indication: 'Shared indication',
}

function DrugNode({ data }: NodeProps) {
  const { node, isCenter, onClick } = data as {
    node: NetworkNode
    isCenter: boolean
    onClick: (n: NetworkNode) => void
  }

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        onClick={() => !isCenter && onClick(node)}
        className={`
          px-4 py-3 rounded-xl border text-center min-w-[120px] transition-all
          ${
            isCenter
              ? 'bg-dt-accent/20 border-dt-accent text-dt-accent font-bold cursor-default'
              : 'bg-dt-surface border-dt-border text-dt-text hover:border-dt-accent cursor-pointer hover:bg-dt-surface2'
          }
        `}
      >
        <div className="text-sm font-semibold">{node.brandName ?? node.name}</div>
        <div className="text-xs opacity-60">{node.genericName ?? ''}</div>
        {node.target && (
          <div className="text-[10px] mt-1 opacity-50">{node.target}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  )
}

const nodeTypes = { drug: DrugNode }

function buildLayout(drugNodes: NetworkNode[], drugEdges: NetworkEdge[], onNodeClick: (n: NetworkNode) => void) {
  const center = drugNodes.find(n => n.id === 'pembrolizumab') ?? drugNodes[0]
  const others = drugNodes.filter(n => n.id !== center.id)
  const radius = 220

  const flowNodes: Node[] = [
    {
      id: center.id,
      type: 'drug',
      position: { x: 0, y: 0 },
      data: { node: center, isCenter: true, onClick: onNodeClick },
      draggable: false,
    },
    ...others.map((n, i) => {
      const angle = (2 * Math.PI * i) / others.length - Math.PI / 2
      return {
        id: n.id,
        type: 'drug',
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        },
        data: { node: n, isCenter: false, onClick: onNodeClick },
      }
    }),
  ]

  const flowEdges: Edge[] = drugEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: false,
    label: RELATIONSHIP_LABELS[e.relationship],
    labelStyle: { fontSize: 9, fill: '#64748b' },
    labelBgStyle: { fill: '#070c18', fillOpacity: 0.8 },
    style: { stroke: RELATIONSHIP_COLORS[e.relationship], strokeWidth: 1.5 },
  }))

  return { flowNodes, flowEdges }
}

export default function NetworkGraph({ nodes: drugNodes, edges: drugEdges, onEvidenceOpen }: Props) {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)

  const { flowNodes, flowEdges } = buildLayout(drugNodes, drugEdges, setSelectedNode)

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, , onEdgesChange] = useEdgesState(flowEdges)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-dt-muted">
        {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5" style={{ backgroundColor: RELATIONSHIP_COLORS[key] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Graph */}
        <div className="flex-1 bg-dt-surface border border-dt-border rounded-xl overflow-hidden" style={{ height: 440 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.5}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e2a3d" gap={24} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-64 flex-shrink-0 bg-dt-surface border border-dt-border rounded-xl p-4 self-start">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-dt-text">{selectedNode.brandName ?? selectedNode.name}</p>
                <p className="text-dt-muted text-xs">{selectedNode.genericName}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-dt-muted hover:text-dt-text text-lg leading-none">
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {selectedNode.target && (
                <div>
                  <p className="text-dt-muted mb-1">Target</p>
                  <span className="font-mono text-dt-accent bg-dt-accent/10 rounded px-2 py-0.5">
                    {selectedNode.target}
                  </span>
                </div>
              )}
              {selectedNode.mechanism && (
                <div>
                  <p className="text-dt-muted mb-1">Mechanism</p>
                  <p className="text-dt-text">{selectedNode.mechanism}</p>
                </div>
              )}
              {selectedNode.status && (
                <div>
                  <p className="text-dt-muted mb-1">Status</p>
                  <p className="text-dt-success">{selectedNode.status}</p>
                </div>
              )}
              {selectedNode.sharedIndications && selectedNode.sharedIndications.length > 0 && (
                <div>
                  <p className="text-dt-muted mb-2">Shared indications</p>
                  <ul className="space-y-1">
                    {selectedNode.sharedIndications.map((ind, i) => (
                      <li key={i} className="text-dt-text">· {ind}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedNode.evidenceIds.length > 0 && (
                <button
                  onClick={() => onEvidenceOpen(selectedNode.evidenceIds)}
                  className="text-dt-accent hover:opacity-70 transition-opacity mt-2"
                >
                  View Evidence →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
