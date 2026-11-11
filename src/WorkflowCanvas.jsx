import { useMemo } from 'react'
import { ReactFlow, Background, BackgroundVariant, Controls, Handle, Position, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ClockIcon,
  CursorIcon,
  LightningBadge,
  SheetsIcon,
  HttpIcon,
  FilterIcon,
  BranchIcon,
  MergeIcon,
  LoopIcon,
  LimitIcon,
  CodeIcon,
  SparkleIcon,
  NodeIcon,
} from './N8nNodeIcons.jsx'
import './WorkflowCanvas.css'

// Loose grouping of n8n node types to an icon, like n8n's own node icons —
// generic icon language, not any integration's real logo/trademark.
const TYPE_STYLE = {
  scheduleTrigger: { Icon: ClockIcon, trigger: true },
  manualTrigger: { Icon: CursorIcon, trigger: true },
  googleSheets: { Icon: SheetsIcon, badge: true },
  httpRequest: { Icon: HttpIcon },
  filter: { Icon: FilterIcon },
  if: { Icon: BranchIcon },
  merge: { Icon: MergeIcon },
  splitInBatches: { Icon: LoopIcon },
  limit: { Icon: LimitIcon },
  code: { Icon: CodeIcon },
  'lc:googleGemini': { Icon: SparkleIcon },
}
const DEFAULT_STYLE = { Icon: NodeIcon }

// Short "operation" captions n8n shows under a node's name, derived from each
// workflow's real parameters (read/update sheet, GET/POST, analyze/edit image, combine).
const SUBTITLES = {
  'Get row(s) in sheet': 'read: sheet',
  'get prompt': 'read: sheet',
  'Get Images Data': 'read: sheet',
  'Get Edited Data': 'read: sheet',
  'QC Prompt': 'read: sheet',
  'Editing Prompts': 'read: sheet',
  'Update row in sheet1': 'update: sheet',
  'Update row in sheet': 'update: sheet',
  'QC passes': 'update: sheet',
  'QC failed': 'update: sheet',
  QC: 'analyze: image',
  'Edit an image1': 'edit: image',
  'Image Editing': 'edit: image',
  Merge: 'combine',
  'Merge Images': 'combine',
  'background image': 'GET: supabase.co',
  'BG image': 'GET: supabase.co',
  'store in supabse': 'POST: supabase.co',
  'Store in S3 Bucket': 'POST: supabase.co',
  'product image': 'GET',
  'Product Image': 'GET',
  'failed img': 'GET',
  'product image2': 'GET',
}

const ICON_SIZE = 76
const HANDLE_Y = ICON_SIZE / 2

function N8nNode({ data }) {
  const { Icon, trigger, badge } = TYPE_STYLE[data.type] ?? DEFAULT_STYLE
  const subtitle = SUBTITLES[data.label]
  return (
    <div className="n8n-node">
      <Handle type="target" position={Position.Left} style={{ top: HANDLE_Y }} />
      <div className={`n8n-node-icon${badge ? ' is-badge' : ''}`}>
        {trigger && <span className="n8n-node-trigger"><LightningBadge /></span>}
        <Icon />
      </div>
      <span className="n8n-node-label">{data.label}</span>
      {subtitle && <span className="n8n-node-sub">{subtitle}</span>}
      <Handle type="source" position={Position.Right} style={{ top: HANDLE_Y }} />
    </div>
  )
}

const NODE_TYPES = { n8n: N8nNode }

// Port captions n8n shows next to a node's outputs — derived structurally from the
// JSON (branch position, or whether a node has a second error output), not guessed per-node.
function branchLabel(sourceType, branchIndex, branchCount) {
  if (sourceType === 'if') return branchIndex === 0 ? 'true' : 'false'
  if (sourceType === 'splitInBatches') return branchIndex === 0 ? 'done' : 'loop'
  if (sourceType === 'filter' && branchCount === 1) return 'Kept'
  if (sourceType === 'httpRequest' && branchCount === 2) return branchIndex === 0 ? 'Success' : 'Error'
  return null
}

function toFlow(workflow) {
  const typeByName = new Map(workflow.nodes.map((n) => [n.name, n.type]))
  const nodes = workflow.nodes.map((n) => ({
    id: n.name,
    type: 'n8n',
    position: { x: n.position[0], y: n.position[1] },
    data: { label: n.name, type: n.type },
  }))

  const edges = []
  for (const [source, byType] of Object.entries(workflow.connections)) {
    for (const branches of Object.values(byType)) {
      branches.forEach((branch, branchIndex) => {
        branch.forEach((conn, i) => {
          const label = branchLabel(typeByName.get(source), branchIndex, branches.length)
          const targetLabel = typeByName.get(conn.node) === 'merge' && conn.index != null ? `Input ${conn.index + 1}` : null
          edges.push({
            id: `${source}__${branchIndex}__${conn.node}__${i}`,
            source,
            target: conn.node,
            type: 'bezier',
            label: label ?? targetLabel ?? undefined,
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 5,
            labelBgStyle: { fill: 'rgba(11, 11, 14, 0.9)' },
            labelStyle: { fill: '#c7c7cf', fontSize: 11, fontWeight: 600 },
          })
        })
      })
    }
  }
  return { nodes, edges }
}

// A read-only, pannable/zoomable view of a real n8n workflow export — no dragging,
// no selecting, no editing, just the "canvas feel" of looking at the workflow.
export default function WorkflowCanvas({ workflow }) {
  const { nodes, edges } = useMemo(() => toFlow(workflow), [workflow])
  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ style: { stroke: 'rgba(255, 255, 255, 0.28)', strokeWidth: 1.6 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="rgba(255, 255, 255, 0.22)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </ReactFlowProvider>
  )
}
