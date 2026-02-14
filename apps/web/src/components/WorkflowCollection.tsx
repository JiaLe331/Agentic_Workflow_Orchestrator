import { IconPlayerPlay, IconArrowRight, IconTable } from '@tabler/icons-react';
import { Workflow } from '@/hooks/use-workflows';
import { formatTimeAgo } from '@/lib/utils';
import { useState } from 'react';
import { WorkflowDetailsSlideOver } from './WorkflowDetailsSlideOver';

interface WorkflowCollectionProps {
    workflows: Workflow[];
    onEdit?: (workflow: Workflow) => void;
    onDelete?: (id: string) => void;
    onRun?: (workflow: Workflow) => void;
}

export function WorkflowCollection({ workflows, onEdit, onDelete, onRun }: WorkflowCollectionProps) {
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
                        onClick={() => setSelectedWorkflow(workflow)}
                        className="relative flex flex-col transition-all border border-gray-200 shadow-sm bg-white/50 hover:bg-white rounded-xl hover:shadow-lg dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:border-gray-700 hover:-translate-y-1 cursor-pointer overflow-hidden group"
                    >
                        <div className="relative group/image">
                            {workflow.imageUrl ? (
                                <div className="h-48 w-full border-b border-gray-100 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                                    <div
                                        className="absolute inset-0 transition-transform duration-500 scale-[2]"
                                        style={{
                                            backgroundImage: `url(${workflow.imageUrl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-48 w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-center">
                                    <IconTable className="w-10 h-10 text-gray-200 dark:text-gray-700" stroke={1.5} />
                                </div>
                            )}

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

                            {/* Tables Involved - Middle Section */}
                            {workflow.tablesInvolved && workflow.tablesInvolved.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {workflow.tablesInvolved.map((table) => (
                                        <div key={table} className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-md dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50">
                                            <IconTable size={10} className="mr-1 opacity-70" />
                                            {table}
                                        </div>
                                    ))}
                                </div>
                            )}

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
