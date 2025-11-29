import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Database, RefreshCw, Search, Calendar, Hash, Trash2, AlertTriangle, Copy, ChevronDown, ChevronRight, Tag, Check, FileText } from 'lucide-react';
import { useToast } from '../../components/common/Toast/Toast';
import { fetchDocuments as apiFetchDocuments, fetchStats as apiFetchStats, deleteChunks } from '../../api/documentsApi';

import { VisualizationTab } from './VisualizationTab';
import { FilesTab } from './FilesTab';

interface Document {
    id: string;
    text: string;
    metadata: any;
}

export const DocumentsPage = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'list' | 'graph' | 'files'>('list');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Stats state
    const [stats, setStats] = useState<{
        total_chunks: number;
        total_tokens: number;
        last_updated: string | null;
    } | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // Pagination state
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const LIMIT = 10;

    const observerTarget = useRef<HTMLTableRowElement>(null);

    const fetchStats = async () => {
        setIsLoadingStats(true);
        try {
            const data = await apiFetchStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            showToast('Failed to fetch statistics', 'error');
        } finally {
            setIsLoadingStats(false);
        }
    };

    const fetchDocuments = async (isLoadMore = false, search = searchTerm) => {
        if (isLoadMore && !hasMore) return;

        const currentOffset = isLoadMore ? offset : 0;

        if (isLoadMore) {
            setIsFetchingMore(true);
        } else {
            setIsLoading(true);
        }

        try {
            const data = await apiFetchDocuments(currentOffset, LIMIT, search);

            const newDocs = data.chunks || [];
            const total = data.total || 0;

            if (isLoadMore) {
                setDocuments(prev => [...prev, ...newDocs]);
            } else {
                setDocuments(newDocs);
            }

            setTotalCount(total);
            setOffset(currentOffset + newDocs.length);
            setHasMore(currentOffset + newDocs.length < total);

        } catch (error) {
            console.error('Error fetching documents:', error);
            showToast('Failed to fetch documents', 'error');
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        if (activeTab === 'list') {
            const timer = setTimeout(() => {
                setOffset(0); // Reset offset on new search
                fetchDocuments(false, searchTerm);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, activeTab]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading && activeTab === 'list') {
                    fetchDocuments(true);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, isLoading, offset, activeTab]);

    const handleDeleteChunk = async (id: string) => {
        setIsDeleting(true);
        try {
            await deleteChunks([id]);
            // Remove from local state immediately
            setDocuments(prev => prev.filter(doc => doc.id !== id));
            setTotalCount(prev => prev - 1);
            setDeleteTargetId(null);
            // Refresh stats after delete
            fetchStats();
            showToast('Chunk deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting chunk:', error);
            showToast('Failed to delete chunk', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            await deleteChunks(undefined, true);
            setDocuments([]);
            setTotalCount(0);
            setOffset(0);
            setHasMore(false);
            setShowDeleteAllModal(false);
            // Refresh stats after delete all
            fetchStats();
            showToast('All chunks deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting all chunks:', error);
            showToast('Failed to delete all chunks', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            showToast('Copied to clipboard', 'success');
        } catch (error) {
            console.error('Failed to copy:', error);
            showToast('Failed to copy', 'error');
        }
    };

    const handleCopyChunkId = async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            showToast('Chunk ID copied!', 'success');
        } catch (error) {
            console.error('Failed to copy chunk ID:', error);
            showToast('Failed to copy chunk ID', 'error');
        }
    };

    const toggleRowExpansion = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Removed client-side filtering
    const filteredDocs = documents;

    const formatTimestamp = (timestamp: string | undefined) => {
        if (!timestamp) return 'Unknown';

        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);

            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days}d ago`;

            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const SkeletonRow = () => (
        <tr className="border-b border-zinc-800/50">
            <td className="p-4"><div className="w-4 h-4 bg-zinc-800 rounded animate-pulse" /></td>
            <td className="p-4"><div className="w-24 h-4 bg-zinc-800 rounded animate-pulse" /></td>
            <td className="p-4"><div className="w-20 h-5 bg-zinc-800 rounded animate-pulse" /></td>
            <td className="p-4"><div className="w-full h-4 bg-zinc-800 rounded animate-pulse" /></td>
            <td className="p-4"><div className="w-12 h-4 bg-zinc-800 rounded animate-pulse" /></td>
            <td className="p-4"><div className="w-16 h-8 bg-zinc-800 rounded animate-pulse ml-auto" /></td>
        </tr>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-[1800px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
                    <p className="text-zinc-400 mt-2">Manage and view your vectorized documents</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                        onClick={() => {
                            if (activeTab === 'list') {
                                fetchDocuments(false);
                            }
                            fetchStats();
                        }}
                        isLoading={isLoading}
                    >
                        Refresh
                    </Button>
                    {documents.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => setShowDeleteAllModal(true)}
                            className="text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50"
                        >
                            Delete All
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 flex items-center gap-4 border-blue-500/20 bg-blue-500/5">
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500">Total Chunks</p>
                        <p className="text-2xl font-bold text-white">
                            {isLoadingStats ? <span className="animate-pulse">...</span> : (stats?.total_chunks ?? totalCount)}
                        </p>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4 border-violet-500/20 bg-violet-500/5">
                    <div className="p-3 rounded-full bg-violet-500/10 text-violet-500">
                        <Hash className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500">Total Tokens</p>
                        <p className="text-2xl font-bold text-white">
                            {isLoadingStats ? <span className="animate-pulse">...</span> : (stats?.total_tokens?.toLocaleString() ?? '0')}
                        </p>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500">Last Updated</p>
                        <p className="text-2xl font-bold text-white">
                            {isLoadingStats ? <span className="animate-pulse">...</span> : (stats?.last_updated ? formatTimestamp(stats.last_updated) : 'Never')}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'list'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-300'
                        }`}
                >
                    List View
                </button>
                <button
                    onClick={() => setActiveTab('graph')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'graph'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-300'
                        }`}
                >
                    Graph View
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'files'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-300'
                        }`}
                >
                    Files
                </button>
            </div>

            {activeTab === 'graph' ? (
                <VisualizationTab isActive={activeTab === 'graph'} />
            ) : activeTab === 'files' ? (
                <FilesTab isActive={activeTab === 'files'} onFileDeleted={fetchStats} />
            ) : (
                <>
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by content, source, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    {/* Table View */}
                    <Card className="overflow-hidden border-zinc-800">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-zinc-400 w-12"></th>
                                        <th className="text-left p-4 text-sm font-semibold text-zinc-400">Timestamp</th>
                                        <th className="text-left p-4 text-sm font-semibold text-zinc-400">Chunk ID</th>

                                        <th className="text-left p-4 text-sm font-semibold text-zinc-400">Preview</th>
                                        <th className="text-left p-4 text-sm font-semibold text-zinc-400">Tokens</th>
                                        <th className="text-right p-4 text-sm font-semibold text-zinc-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        // Initial Loading Skeletons
                                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                    ) : filteredDocs.length > 0 ? (
                                        <>
                                            {filteredDocs.map((doc) => {
                                                const isExpanded = expandedRows.has(doc.id);
                                                const tokenCount = doc.text.split(/\s+/).length;

                                                return (
                                                    <React.Fragment key={doc.id}>
                                                        <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                                                            <td className="p-4">
                                                                <button
                                                                    onClick={() => toggleRowExpansion(doc.id)}
                                                                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                                                                    ) : (
                                                                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                                                                    )}
                                                                </button>
                                                            </td>
                                                            <td className="p-4 text-sm text-zinc-400 whitespace-nowrap">
                                                                {formatTimestamp(doc.metadata?.created_at)}
                                                            </td>
                                                            <td className="p-4">
                                                                <code
                                                                    className="text-xs text-violet-400 bg-violet-400/10 px-2 py-1 rounded border border-violet-400/20 cursor-pointer hover:bg-violet-400/20 transition-colors"
                                                                    onClick={() => handleCopyChunkId(doc.id)}
                                                                    title="Click to copy full ID"
                                                                >
                                                                    {doc.id.slice(0, 8)}...
                                                                </code>
                                                            </td>
                                                            <td className="p-4 text-sm text-zinc-400 max-w-[400px]">
                                                                <div className="line-clamp-2 mb-2">{doc.text}</div>
                                                                {/* Page Numbers Badge */}
                                                                {doc.metadata?.page_numbers && (
                                                                    <div className="mb-1">
                                                                        <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                                            <FileText className="w-2.5 h-2.5" />
                                                                            Page {Array.isArray(doc.metadata.page_numbers)
                                                                                ? doc.metadata.page_numbers.join(', ')
                                                                                : doc.metadata.page_numbers}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {/* Other Metadata tags */}
                                                                {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {Object.entries(doc.metadata)
                                                                            .filter(([key]) => !['source', 'created_at', 'page_numbers'].includes(key))
                                                                            .slice(0, 2)
                                                                            .map(([key, value]) => (
                                                                                <span
                                                                                    key={key}
                                                                                    className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20"
                                                                                >
                                                                                    <Tag className="w-2.5 h-2.5" />
                                                                                    {key}: {String(value)}
                                                                                </span>
                                                                            ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-sm text-zinc-500 whitespace-nowrap">
                                                                {tokenCount}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleCopyToClipboard(doc.text, doc.id)}
                                                                        className="p-1.5 hover:bg-blue-500/10 text-zinc-500 hover:text-blue-400 rounded transition-colors"
                                                                        title="Copy to clipboard"
                                                                    >
                                                                        {copiedId === doc.id ? (
                                                                            <Check className="w-4 h-4 text-green-400" />
                                                                        ) : (
                                                                            <Copy className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteTargetId(doc.id)}
                                                                        className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded transition-colors"
                                                                        title="Delete chunk"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr className="border-b border-zinc-800/50 bg-zinc-950/50">
                                                                <td colSpan={6} className="p-6">
                                                                    <div className="space-y-4">
                                                                        <div>
                                                                            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Full Content</h4>
                                                                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                                                                                <p className="text-sm text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                                                                                    {doc.text}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Metadata</h4>
                                                                                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                                                                                    {doc.metadata && Object.keys(doc.metadata).length > 0 ? (
                                                                                        <div className="space-y-1">
                                                                                            {Object.entries(doc.metadata).map(([key, value]) => (
                                                                                                <div key={key} className="flex items-start gap-2 text-xs">
                                                                                                    <span className="text-zinc-500 font-medium min-w-[100px]">{key}:</span>
                                                                                                    <span className="text-zinc-400">{String(value)}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="text-xs text-zinc-500">No metadata</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Statistics</h4>
                                                                                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 space-y-1">
                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-zinc-500">Full ID:</span>
                                                                                        <code className="text-zinc-400 font-mono">{doc.id}</code>
                                                                                    </div>
                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-zinc-500">Characters:</span>
                                                                                        <span className="text-zinc-400">{doc.text.length}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-zinc-500">Tokens:</span>
                                                                                        <span className="text-zinc-400">{tokenCount}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                            {/* Loading more skeleton */}
                                            {isFetchingMore && (
                                                <SkeletonRow />
                                            )}
                                            {/* Invisible target for intersection observer */}
                                            <tr ref={observerTarget} style={{ height: '20px' }} />
                                        </>
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-20">
                                                <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center mx-auto mb-4">
                                                    <Database className="w-8 h-8 text-zinc-600" />
                                                </div>
                                                <h3 className="text-lg font-medium text-zinc-300">No documents found</h3>
                                                <p className="text-zinc-500 mt-2">
                                                    {searchTerm ? "Try adjusting your search terms" : "Upload documents in the Ingest page to see them here"}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Delete Confirmation Modal (Single Chunk) */}
                    {deleteTargetId && createPortal(
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fade-in">
                            <Card className="max-w-md w-full mx-4 border-red-500/30">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">Delete Chunk?</h3>
                                    </div>
                                    <p className="text-zinc-400 mb-6">
                                        Are you sure you want to delete this chunk? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setDeleteTargetId(null)}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="outline"
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => handleDeleteChunk(deleteTargetId)}
                                            isLoading={isDeleting}
                                            className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>,
                        document.body
                    )}

                    {/* Delete All Confirmation Modal */}
                    {showDeleteAllModal && createPortal(
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fade-in">
                            <Card className="max-w-md w-full mx-4 border-red-500/30">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">Delete All Chunks?</h3>
                                    </div>
                                    <p className="text-zinc-400 mb-2">
                                        Are you sure you want to delete <strong className="text-white">{totalCount}</strong> chunk(s)?
                                    </p>
                                    <p className="text-red-400 text-sm mb-6">
                                        This will permanently delete your entire knowledge base. This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowDeleteAllModal(false)}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="outline"
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                            onClick={handleDeleteAll}
                                            isLoading={isDeleting}
                                            className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                        >
                                            Delete All
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>,
                        document.body
                    )}
                </>
            )}
        </div>
    );
};
