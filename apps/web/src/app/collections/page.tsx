'use client';

import { WorkflowCollection } from '@/components/WorkflowCollection';
import { useWorkflows } from '@/hooks/use-workflows';
import { IconLibrary, IconPlus, IconSearch, IconFilter, IconTrash, IconX, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

export default function CollectionsPage() {
    const { workflows, isLoading, error, remove, removeBulk } = useWorkflows();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this workflow?')) {
            await remove(id);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedIds.length} workflows?`)) {
            await removeBulk(selectedIds);
            setSelectedIds([]);
            setIsSelectionMode(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedIds(sortedWorkflows.map(w => w.id));
    };

    const deselectAll = () => {
        setSelectedIds([]);
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
                    <div className="flex items-center space-x-4">
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

                        {isSelectionMode && (
                            <div className="flex items-center p-1 space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={selectAll}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    Select All
                                </button>
                                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                                <button
                                    onClick={deselectAll}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    Deselect All
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        {isSelectionMode ? (
                            <>
                                <span className="text-sm font-medium text-gray-500 mr-2">
                                    {selectedIds.length} selected
                                </span>
                                <button
                                    onClick={handleBatchDelete}
                                    disabled={selectedIds.length === 0}
                                    className="flex items-center px-4 py-2 space-x-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <IconTrash size={18} />
                                    <span>Delete</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false);
                                        setSelectedIds([]);
                                    }}
                                    className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 shadow-sm"
                                >
                                    <IconX size={18} />
                                    <span>Cancel</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsSelectionMode(true)}
                                    className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40 shadow-sm"
                                >
                                    <IconCheck size={18} />
                                    <span>Select</span>
                                </button>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                                <button className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                                    <IconFilter size={16} />
                                    <span>Filter</span>
                                </button>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                                >
                                    <option value="recent">Sort by: Recent</option>
                                    <option value="name">Sort by: Name</option>
                                    <option value="status">Sort by: Status</option>
                                </select>
                            </>
                        )}
                    </div>
                </div>

                {/* Collections Grid */}
                <WorkflowCollection
                    workflows={sortedWorkflows}
                    onDelete={handleDelete}
                    isSelectionMode={isSelectionMode}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                />
            </div>
        </div>
    );
}
