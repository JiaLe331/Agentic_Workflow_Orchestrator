'use client';

import { WorkflowCollection } from '@/components/WorkflowCollection';
import { useWorkflows } from '@/hooks/use-workflows';
import { IconLibrary, IconPlus, IconSearch, IconFilter, IconTrash, IconX, IconSquareCheck } from '@tabler/icons-react';
import { useState } from 'react';

export default function CollectionsPage() {
    const { workflows, isLoading, error, remove } = useWorkflows();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this workflow?')) {
            await remove(id);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} workflow${selectedIds.size > 1 ? 's' : ''}?`)) return;
        setIsDeleting(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => remove(id)));
            setSelectedIds(new Set());
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredWorkflows = workflows?.filter(workflow =>
        (workflow.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (sortBy === 'name') {
            return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
        } else if (sortBy === 'status') {
            // Using uiType as a proxy for status/type sorting
            return (a.uiType || '').localeCompare(b.uiType || '');
        }
        return 0;
    });

    if (isLoading) return <div className="p-8 text-center">Loading workflows...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading workflows</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50 pt-6">
            {/* Main Content */}
            <div className="flex-1 px-8 pb-8 overflow-y-auto">
                {/* Search and Filter Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-96">
                        <IconSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
                        <input
                            type="text"
                            placeholder="Search collections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                            <IconFilter size={16} />
                            <span>Filter</span>
                        </button>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                            <option value="recent">Sort by: Recent</option>
                            <option value="name">Sort by: Name</option>
                            <option value="status">Sort by: Status</option>
                        </select>
                    </div>
                </div>

                {/* Selection Toolbar */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-3">
                            <IconSquareCheck size={18} className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                {selectedIds.size} selected
                            </span>
                            <button
                                onClick={() => {
                                    const allIds = new Set(sortedWorkflows.map(w => w.id));
                                    setSelectedIds(allIds);
                                }}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline underline-offset-2 transition-colors"
                            >
                                Select all
                            </button>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
                            >
                                Deselect all
                            </button>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IconTrash size={16} />
                            {isDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                        </button>
                    </div>
                )}

                {/* Collections Grid */}
                <WorkflowCollection
                    workflows={sortedWorkflows}
                    onDelete={handleDelete}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelection}
                />
            </div>
        </div>
    );
}
