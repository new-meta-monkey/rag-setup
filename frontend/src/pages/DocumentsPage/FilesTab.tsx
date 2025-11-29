import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { useToast } from '../../components/common/Toast/Toast';
import { FileText, Trash2, AlertTriangle, Download, HardDrive } from 'lucide-react';

interface StoredFile {
    id: string;
    filename: string;
    size: number;
    created_at: string;
    physical_path: string;
    mime_type: string;
}

export const FilesTab = ({ isActive, onFileDeleted }: { isActive: boolean; onFileDeleted: () => void }) => {
    const { showToast } = useToast();
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<StoredFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/files');
            const data = await response.json();
            setFiles(data);
        } catch (error) {
            console.error('Error fetching files:', error);
            showToast('Failed to fetch files', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isActive) {
            fetchFiles();
        }
    }, [isActive]);

    const handleDeleteFile = async (file: StoredFile) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`http://localhost:8000/files/${file.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setFiles(prev => prev.filter(f => f.id !== file.id));
                setDeleteTarget(null);
                showToast('File and associated vectors deleted', 'success');
                onFileDeleted();
            } else {
                showToast('Failed to delete file', 'error');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            showToast('Failed to delete file', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        // SQLite stores UTC string, let's format it nicely
        return new Date(dateString + 'Z').toLocaleString();
    };

    if (!isActive) return null;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-blue-400" />
                    Stored Files
                </h2>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchFiles}
                    isLoading={isLoading}
                >
                    Refresh List
                </Button>
            </div>

            <Card className="overflow-hidden border-zinc-800">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-900/50 border-b border-zinc-800">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold text-zinc-400">Filename</th>
                                <th className="text-left p-4 text-sm font-semibold text-zinc-400">Size</th>
                                <th className="text-left p-4 text-sm font-semibold text-zinc-400">Uploaded At</th>
                                <th className="text-right p-4 text-sm font-semibold text-zinc-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-zinc-500">Loading files...</td>
                                </tr>
                            ) : files.length > 0 ? (
                                files.map((file) => (
                                    <tr key={file.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-zinc-800 text-zinc-400">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm text-zinc-200 font-medium">{file.filename}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-zinc-400 font-mono">
                                            {formatSize(file.size)}
                                        </td>
                                        <td className="p-4 text-sm text-zinc-400">
                                            {formatDate(file.created_at)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => setDeleteTarget(file)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-zinc-900/50 flex items-center justify-center mx-auto mb-3">
                                            <HardDrive className="w-6 h-6 text-zinc-600" />
                                        </div>
                                        <h3 className="text-zinc-300 font-medium">No files stored</h3>
                                        <p className="text-zinc-500 text-sm mt-1">Upload files in the Ingest page to see them here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            {deleteTarget && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fade-in">
                    <Card className="max-w-md w-full mx-4 border-red-500/30">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Delete File?</h3>
                            </div>
                            <p className="text-zinc-400 mb-2">
                                Are you sure you want to delete <strong className="text-white">{deleteTarget.filename}</strong>?
                            </p>
                            <p className="text-red-400 text-sm mb-6">
                                This will permanently delete the file from storage AND remove all associated vectors from the knowledge base.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="ghost"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline"
                                    leftIcon={<Trash2 className="w-4 h-4" />}
                                    onClick={() => handleDeleteFile(deleteTarget)}
                                    isLoading={isDeleting}
                                    className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                >
                                    Delete File & Vectors
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
};
