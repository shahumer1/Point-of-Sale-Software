import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    const containerRef = useRef(null);
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        let prevActive = null;
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            prevActive = document.activeElement;
            // focus the container for accessibility
            setTimeout(() => {
                containerRef.current?.focus();
            }, 0);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
            // restore focus
            if (prevActive && prevActive.focus) prevActive.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div ref={containerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg animated fadeIn border dark:border-gray-700 focus:outline-none">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
