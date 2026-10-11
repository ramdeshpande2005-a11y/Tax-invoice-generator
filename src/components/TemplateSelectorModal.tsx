import React from 'react';
import { TEMPLATES } from '../utils/defaultData';
import { InvoiceData } from '../types/invoice';
import { X, LayoutTemplate, ArrowRight, Check } from 'lucide-react';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateData: Partial<InvoiceData>) => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Choose Invoice Preset</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-500 mb-2">
            Select a pre-filled business invoice structure or start with a clean blank invoice:
          </p>

          {TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectTemplate(tmpl.data);
                onClose();
              }}
              className="p-4 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
              </div>
              <div className="p-2 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
