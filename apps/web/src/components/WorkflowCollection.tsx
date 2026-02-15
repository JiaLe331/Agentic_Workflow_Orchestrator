import { IconPlayerPlay, IconArrowRight, IconTable, IconPhone, IconCamera, IconFileText, IconBrain, IconMail, IconUpload } from '@tabler/icons-react';
import { Workflow } from '@/hooks/use-workflows';
import { formatTimeAgo } from '@/lib/utils';
import { useState } from 'react';
import { WorkflowDetailsSlideOver } from './WorkflowDetailsSlideOver';
import Image from 'next/image';

interface WorkflowCollectionProps {
    workflows: Workflow[];
    onEdit?: (workflow: Workflow) => void;
    onDelete?: (id: string) => void;
    onRun?: (workflow: Workflow) => void;
    isSelectionMode?: boolean;
    selectedIds?: string[];
    onToggleSelection?: (id: string) => void;
}

export function WorkflowCollection({
    workflows,
    onEdit,
    onDelete,
    onRun,
    isSelectionMode = false,
    selectedIds = [],
    onToggleSelection
}: WorkflowCollectionProps) {
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

    if (!workflows || workflows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white border border-gray-200 border-dashed rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <p>No workflows found.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                    <div
                        key={workflow.id}
                        onClick={() => {
                            if (isSelectionMode) {
                                onToggleSelection?.(workflow.id);
                            } else {
                                setSelectedWorkflow(workflow);
                            }
                        }}
                        className={`relative flex flex-col transition-all border shadow-sm bg-white/50 hover:bg-white rounded-xl hover:shadow-lg dark:bg-gray-800/50 dark:hover:bg-gray-800 hover:-translate-y-1 cursor-pointer overflow-hidden group ${selectedIds.includes(workflow.id)
                            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-500'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        {isSelectionMode && (
                            <div className="absolute top-3 left-3 z-20">
                                <div className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${selectedIds.includes(workflow.id)
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'bg-white/80 border-gray-300 dark:bg-gray-900/80 dark:border-gray-600'
                                    }`}>
                                    {selectedIds.includes(workflow.id) && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="relative group/image">
                            {workflow.imageUrl ? (
                                <div className="h-48 w-full border-b border-gray-100 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                                    <Image
                                        src={workflow.imageUrl}
                                        alt={workflow.title || 'Workflow image'}
                                        fill
                                        className="object-cover scale-[2] transition-transform duration-500"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="h-48 w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-center">
                                    <IconTable className="w-10 h-10 text-gray-200 dark:text-gray-700" stroke={1.5} />
                                </div>
                            )}

                            {!isSelectionMode && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRun && onRun(workflow);
                                    }}
                                    className="absolute bottom-3 right-3 flex items-center justify-center w-10 h-10 text-white transition-all bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg hover:shadow-xl hover:scale-105 z-10"
                                    title="Run Workflow"
                                >
                                    <IconPlayerPlay className="w-5 h-5 ml-0.5" stroke={2} />
                                </button>
                            )}
                        </div>

                        {/* Content Area - Padded */}
                        <div className="flex flex-col flex-1 p-4">
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex-1 pr-4">
                                    <h3 className="text-lg tracking-tight text-gray-900 dark:text-white">
                                        {workflow.title || 'Untitled Workflow'}
                                    </h3>
                                </div>
                                <div className="shrink-0">
                                    <span className="text-xs font-medium text-gray-400 px-2 py-1 rounded-full dark:bg-gray-700/50 dark:text-gray-400">
                                        {formatTimeAgo(workflow.updatedAt)}
                                    </span>
                                </div>
                            </div>

                            <p className="mb-3 w-full text-xs rounded-lg font-light leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2 dark:bg-gray-800">
                                {workflow.description || 'No description provided.'}
                            </p>

                            {/* Tools and Entities - Middle Section */}
                            {workflow.tablesInvolved && workflow.tablesInvolved.length > 0 && (() => {
                                const toolKeywords = ['whatsapp', 'image_generation_tool', 'image_generator', 'pdf_parser', 'llm', 'email', 'upload'];
                                const isTool = (t: string) => toolKeywords.some(keyword => t.toLowerCase().includes(keyword));

                                return (
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {/* Entities (Badges) */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {workflow.tablesInvolved.filter(t => !isTool(t)).map((table) => (
                                                <div key={table} className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-md dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50">
                                                    <IconTable size={10} className="mr-1 opacity-70" />
                                                    {table}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tools (Plain Icons) */}
                                        <div className="flex flex-wrap items-center gap-3 ml-1 text-gray-400 dark:text-gray-600">
                                            {workflow.tablesInvolved.filter(t => isTool(t)).map((table) => {
                                                const t = table.toLowerCase();
                                                const iconProps = { size: 20, className: "opacity-60", stroke: 1.5 };

                                                return (
                                                    <div key={table} title={table} className="flex items-center justify-center">
                                                        {t.includes('whatsapp') && <IconPhone {...iconProps} />}
                                                        {(t.includes('image_generation_tool') || t.includes('image_generator')) && <IconCamera {...iconProps} />}
                                                        {t.includes('pdf_parser') && <IconFileText {...iconProps} />}
                                                        {t.includes('llm') && <IconBrain {...iconProps} />}
                                                        {t.includes('email') && <IconMail {...iconProps} />}
                                                        {t.includes('upload') && <IconUpload {...iconProps} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Add spacer if no tables to maintain consistent vertical rhythm if desired, or let it collapse */}
                            {(!workflow.tablesInvolved || workflow.tablesInvolved.length === 0) && <div className="mb-2" />}

                            {/* Spacer if no tables for better visual balance */}
                            {(!workflow.tablesInvolved || workflow.tablesInvolved.length === 0) && <div className="mb-1" />}
                        </div>
                    </div>
                ))}
            </div>

            <WorkflowDetailsSlideOver
                workflow={selectedWorkflow}
                isOpen={!!selectedWorkflow}
                onClose={() => setSelectedWorkflow(null)}
                onEdit={onEdit}
                onDelete={onDelete}
                onRun={onRun}
            />
        </>
    );
}
