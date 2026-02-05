"use client";

import { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    NodeProps,
    Edge,
    Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import mockData from '@/mocks/entity-mock.json';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Types ---
interface Column {
    name: string;
    type: string;
    pk?: boolean;
    fk?: string;
}

interface Table {
    name: string;
    columns: Column[];
}

interface DBDepartment {
    tables: Table[];
}

interface DBSchema {
    [department: string]: DBDepartment;
}

// --- Custom Node Component ---
const EntityNode = ({ data }: NodeProps) => {
    return (
        <div className="min-w-[200px] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className={cn(
                "px-4 py-2 text-sm font-bold text-white",
                data.color || "bg-zinc-500"
            )}>
                {data.label}
                <div className="text-[10px] font-normal opacity-80">{data.department}</div>
            </div>
            <div className="p-2">
                {data.columns.map((col: Column, i: number) => (
                    <div key={i} className="relative flex items-center justify-between py-1 text-xs">
                        {/* Handles for connections */}
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`target-${col.name}`}
                            style={{ opacity: 0 }} // Invisible but functional
                        />
                        <div className="flex items-center gap-2">
                            {col.pk && <span className="font-mono text-[10px] text-yellow-600 dark:text-yellow-400">PK</span>}
                            {col.fk && <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">FK</span>}
                            <span className="text-zinc-700 dark:text-zinc-300">{col.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400">{col.type}</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`source-${col.name}`}
                            style={{ opacity: 0 }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function EntityMapPage() {
    const router = useRouter();
    const nodeTypes = useMemo(() => ({ entity: EntityNode }), []);

    // --- Transform Schema to Nodes & Edges ---
    const { nodes, edges } = useMemo(() => {
        const generatedNodes: Node[] = [];
        const generatedEdges: Edge[] = [];
        const schema = (mockData as unknown as { databaseSchema: DBSchema }).databaseSchema;

        const deptColors: Record<string, string> = {
            HR: "bg-pink-600",
            Sales: "bg-indigo-600",
            Finance: "bg-emerald-600"
        };

        let xOffset = 0;
        let yOffset = 0;

        // Generate Nodes
        Object.keys(schema).forEach((dept, deptIndex) => {
            xOffset = deptIndex * 400;
            yOffset = 0;

            schema[dept].tables.forEach((table: Table, tableIndex: number) => {
                const nodeId = `${dept}.${table.name}`;

                generatedNodes.push({
                    id: nodeId,
                    type: 'entity',
                    position: { x: xOffset, y: yOffset },
                    data: {
                        label: table.name,
                        department: dept,
                        columns: table.columns,
                        color: deptColors[dept]
                    }
                });

                // Simple layouting: stack vertically within department
                yOffset += 250;
                if (tableIndex % 2 === 1) {
                    xOffset += 50; // slight stagger
                }
            });
        });

        // Generate Edges from Foreign Keys
        Object.keys(schema).forEach((dept) => {
            schema[dept].tables.forEach((table: Table) => {
                const sourceNodeId = `${dept}.${table.name}`;

                table.columns.forEach((col: Column) => {
                    if (col.fk) {
                        const parts = col.fk.split('.');
                        if (parts.length === 3) {
                            const [targetDept, targetTable, targetCol] = parts;
                            const targetNodeId = `${targetDept}.${targetTable}`;

                            generatedEdges.push({
                                id: `e-${sourceNodeId}-${targetNodeId}`,
                                source: sourceNodeId,
                                target: targetNodeId,
                                animated: true,
                                style: { stroke: '#9ca3af' },
                                label: `${col.name} -> ${targetTable}.${targetCol}`
                            });
                        }
                    }
                });
            });
        });

        return { nodes: generatedNodes, edges: generatedEdges };
    }, []);

    return (
        <div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950">
            <div className="absolute left-4 top-4 z-10">
                <button
                    onClick={() => router.back()}
                    className="flex items-center rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur hover:bg-white hover:text-zinc-900 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </button>
            </div>
            <div className="absolute right-4 top-4 z-10 rounded-lg bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/80">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Entity Map</h1>
                <div className="mt-2 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                        <span className="block h-3 w-3 rounded-full bg-pink-600"></span> HR
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="block h-3 w-3 rounded-full bg-indigo-600"></span> Sales
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="block h-3 w-3 rounded-full bg-emerald-600"></span> Finance
                    </div>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#71717a" gap={16} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
