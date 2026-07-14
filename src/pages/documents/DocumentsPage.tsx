import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, PenTool, Share2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getDocumentsAPI, uploadDocumentAPI, deleteDocumentAPI, signDocumentAPI, shareDocumentAPI } from '../../api/documents';
import { getAllInvestorsAPI, getAllEntrepreneursAPI } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchOtherUsers();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await getDocumentsAPI();
      setDocuments(res.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOtherUsers = async () => {
    try {
      if (user?.role === 'entrepreneur') {
        const res = await getAllInvestorsAPI();
        setOtherUsers(res.data);
      } else {
        const res = await getAllEntrepreneursAPI();
        setOtherUsers(res.data);
      }
    } catch {
      // silently fail
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    setIsUploading(true);
    try {
      await uploadDocumentAPI(formData);
      toast.success('Document uploaded successfully');
      fetchDocuments();
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocumentAPI(id);
      toast.success('Document deleted');
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleSign = async (id: string) => {
    const signature = `sig_${user?.id}_${Date.now()}`;
    try {
      await signDocumentAPI(id, signature);
      toast.success('Document signed successfully');
      fetchDocuments();
    } catch {
      toast.error('Failed to sign document');
    }
  };

  const handleShare = async (docId: string, userId: string) => {
    try {
      await shareDocumentAPI(docId, userId);
      toast.success('Document shared successfully');
      setShareTarget(null);
      fetchDocuments();
    } catch {
      toast.error('Failed to share document');
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  };

  const myDocuments = documents.filter(d => d.uploadedBy?._id === user?.id);
  const sharedWithMe = documents.filter(d => d.uploadedBy?._id !== user?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your important files</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
          />
          <Button
            leftIcon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">My Documents</p>
            <p className="text-2xl font-bold text-gray-900">{myDocuments.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Shared With Me</p>
            <p className="text-2xl font-bold text-gray-900">{sharedWithMe.length}</p>
          </CardBody>
        </Card>
      </div>

      {/* My Documents */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">My Documents</h2>
          <Badge variant="primary">{myDocuments.length} files</Badge>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading documents...</p>
          ) : myDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No documents yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myDocuments.map(doc => (
                <div key={doc._id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="p-2 bg-primary-50 rounded-lg mr-4">
                    <FileText size={24} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                      <Badge variant={
                        doc.status === 'signed' ? 'success' :
                        doc.status === 'shared' ? 'secondary' : 'gray'
                      } size="sm">
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{doc.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                      <span>{formatSize(doc.fileSize)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      {doc.sharedWith?.length > 0 && (
                        <span>Shared with {doc.sharedWith.length} user(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <a
                      href={`${getApiUrl()}/${doc.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="p-2" title="Download">
                        <Download size={16} />
                      </Button>
                    </a>

                    {doc.status !== 'signed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-blue-600"
                        title="Sign document"
                        onClick={() => handleSign(doc._id)}
                      >
                        <PenTool size={16} />
                      </Button>
                    )}

                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-green-600"
                        title="Share document"
                        onClick={() => setShareTarget(shareTarget === doc._id ? null : doc._id)}
                      >
                        <Share2 size={16} />
                      </Button>

                      {shareTarget === doc._id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                          <p className="text-xs font-medium text-gray-500 px-3 py-2 border-b">Share with:</p>
                          {otherUsers.length === 0 ? (
                            <p className="text-xs text-gray-500 px-3 py-2">No users available</p>
                          ) : (
                            otherUsers.map((u: any) => (
                              <button
                                key={u._id}
                                onClick={() => handleShare(doc._id, u._id)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <img
                                  src={u.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4F46E5&color=fff`}
                                  alt={u.name}
                                  className="w-6 h-6 rounded-full"
                                />
                                {u.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Delete document"
                      onClick={() => handleDelete(doc._id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Shared With Me */}
      {sharedWithMe.length > 0 && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Shared With Me</h2>
            <Badge variant="secondary">{sharedWithMe.length} files</Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {sharedWithMe.map(doc => (
                <div key={doc._id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="p-2 bg-secondary-50 rounded-lg mr-4">
                    <FileText size={24} className="text-secondary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                      <Badge variant={doc.status === 'signed' ? 'success' : 'secondary'} size="sm">
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>By: {doc.uploadedBy?.name}</span>
                      <span>{formatSize(doc.fileSize)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <a href={`${getApiUrl()}/${doc.fileUrl}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="p-2" title="Download">
                        <Download size={16} />
                      </Button>
                    </a>
                    {doc.status !== 'signed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-blue-600"
                        title="Sign document"
                        onClick={() => handleSign(doc._id)}
                      >
                        <PenTool size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
