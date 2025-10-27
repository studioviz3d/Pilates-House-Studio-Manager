import React, { useState } from 'react';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { AlertCircle, CheckCircle, Clipboard, ClipboardCheck } from 'lucide-react';

interface CreateStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";

const CreateStudioModal: React.FC<CreateStudioModalProps> = ({ isOpen, onClose }) => {
    const [studioName, setStudioName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; password?: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopyToClipboard = () => {
        if (result?.password) {
            navigator.clipboard.writeText(result.password).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };
    
    const resetAndClose = () => {
        setStudioName('');
        setAdminName('');
        setAdminEmail('');
        setResult(null);
        setLoading(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const functions = getFunctions(getApp());
            const createStudio = httpsCallable(functions, 'createStudio');
            const response = await createStudio({ studioName, adminName, adminEmail }) as HttpsCallableResult<{ success: boolean; message: string; initialPassword?: string }>;
            
            if (response.data.success) {
                setResult({ success: true, message: response.data.message, password: response.data.initialPassword });
            } else {
                setResult({ success: false, message: response.data.message || "An unknown error occurred." });
            }
        } catch (error: any) {
            console.error("Error calling createStudio function:", error);
            setResult({ success: false, message: error.message || "Failed to create studio." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} title={result?.success ? "Studio Created Successfully" : "Create New Studio"}>
            {!result ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Studio Name</label>
                        <input type="text" value={studioName} onChange={e => setStudioName(e.target.value)} required className={inputBaseClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin's Full Name</label>
                        <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} required className={inputBaseClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin's Email</label>
                        <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required className={inputBaseClasses} />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center">
                            {loading && <Spinner className="w-4 h-4 mr-2" />}
                            Create Studio
                        </button>
                    </div>
                </form>
            ) : result.success ? (
                <div className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">{result.message}</h3>
                    <p className="mt-2 text-sm text-gray-500">Please securely share the initial login credentials with the new studio admin.</p>
                    <div className="mt-4 space-y-2 text-left bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm"><span className="font-semibold text-gray-600">Email:</span> <span className="font-mono">{adminEmail}</span></p>
                        <div className="flex items-center">
                            <p className="text-sm"><span className="font-semibold text-gray-600">Password:</span> <span className="font-mono">{result.password}</span></p>
                            <button onClick={handleCopyToClipboard} className="ml-4 p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-200">
                                {copied ? <ClipboardCheck size={16} className="text-green-600" /> : <Clipboard size={16} />}
                            </button>
                        </div>
                    </div>
                     <div className="mt-6">
                        <button type="button" onClick={resetAndClose} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:text-sm">Done</button>
                    </div>
                </div>
            ) : (
                 <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Creation Failed</h3>
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">{result.message}</p>
                     <div className="mt-6">
                        <button type="button" onClick={() => setResult(null)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm">Try Again</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CreateStudioModal;