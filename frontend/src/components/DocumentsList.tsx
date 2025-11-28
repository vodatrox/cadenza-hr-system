'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiEye, FiTrash2, FiFileText, FiImage, FiFile } from 'react-icons/fi';
import api from '@/lib/api';
import type { EmployeeDocument } from '@/types';

interface DocumentsListProps {
  documents: EmployeeDocument[];
  onDelete: (documentId: number) => void;
}

export default function DocumentsList({ documents, onDelete }: DocumentsListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeletingId(documentId);

    try {
      await api.delete(`/employees/documents/${documentId}/`);
      toast.success('Document deleted successfully');
      onDelete(documentId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (document: EmployeeDocument) => {
    window.open(document.file_url, '_blank');
  };

  const handleDownload = async (document: EmployeeDocument) => {
    try {
      const response = await fetch(document.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name + '.' + document.file_type.toLowerCase();
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase();
    if (['PDF'].includes(type)) {
      return <FiFileText className="text-lg text-red-500" />;
    } else if (['PNG', 'JPG', 'JPEG', 'GIF'].includes(type)) {
      return <FiImage className="text-lg text-blue-500" />;
    } else {
      return <FiFile className="text-lg text-gray-500" />;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toUpperCase();
    if (['PDF'].includes(type)) {
      return 'bg-red-100 text-red-600';
    } else if (['PNG', 'JPG', 'JPEG', 'GIF'].includes(type)) {
      return 'bg-blue-100 text-blue-600';
    } else if (['DOC', 'DOCX'].includes(type)) {
      return 'bg-blue-100 text-blue-600';
    } else if (['XLS', 'XLSX'].includes(type)) {
      return 'bg-green-100 text-green-600';
    } else {
      return 'bg-gray-100 text-gray-600';
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FiFile className="text-4xl text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No documents uploaded yet</p>
        <p className="text-gray-400 text-xs mt-1">Click the upload button to add documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-12 h-12 ${getFileTypeColor(doc.file_type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <span className="text-xs font-bold">{doc.file_type}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
              </div>
              {doc.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{doc.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {doc.file_size_display && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-gray-400">{doc.file_size_display}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleView(doc)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View document"
            >
              <FiEye className="text-base" />
            </button>
            <button
              onClick={() => handleDownload(doc)}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Download document"
            >
              <FiDownload className="text-base" />
            </button>
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deletingId === doc.id}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete document"
            >
              {deletingId === doc.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
              ) : (
                <FiTrash2 className="text-base" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
