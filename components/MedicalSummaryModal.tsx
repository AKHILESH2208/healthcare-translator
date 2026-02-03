'use client';

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X, Loader2, ClipboardCopy } from 'lucide-react';
import { MedicalSummary } from '@/types';
import { toast } from 'sonner';

interface MedicalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MedicalSummary | null;
  isLoading: boolean;
}

export function MedicalSummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading,
}: MedicalSummaryModalProps) {
  // Handle Escape key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Copy summary to clipboard
  const handleCopyToClipboard = useCallback(() => {
    if (!summary) return;
    
    const text = `MEDICAL SUMMARY
Generated: ${new Date(summary.timestamp).toLocaleString()}
Based on ${summary.messageCount} messages

SYMPTOMS:
${summary.symptoms.length > 0 ? summary.symptoms.map(s => `• ${s}`).join('\n') : 'None mentioned'}

MEDICATIONS:
${summary.medications.length > 0 ? summary.medications.map(m => `• ${m}`).join('\n') : 'None discussed'}

FOLLOW-UP ACTIONS:
${summary.followUpActions.length > 0 ? summary.followUpActions.map(a => `• ${a}`).join('\n') : 'None specified'}
`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Summary copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  }, [summary]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <FileText className="h-5 w-5" />
            Medical Summary
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2 text-muted-foreground">Generating summary...</p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Summary Metadata */}
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>Generated: {new Date(summary.timestamp).toLocaleString()}</p>
                <p>Based on {summary.messageCount} messages</p>
              </div>

              {/* Symptoms */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
                  Symptoms Reported
                </h3>
                {summary.symptoms.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {summary.symptoms.map((symptom, index) => (
                      <li key={index} className="text-sm">
                        {symptom}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No symptoms mentioned
                  </p>
                )}
              </div>

              {/* Medications */}
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">
                  Medications Discussed
                </h3>
                {summary.medications.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {summary.medications.map((medication, index) => (
                      <li key={index} className="text-sm">
                        {medication}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No medications discussed
                  </p>
                )}
              </div>

              {/* Follow-up Actions */}
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-orange-600 dark:text-orange-400">
                  Follow-up Actions
                </h3>
                {summary.followUpActions.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {summary.followUpActions.map((action, index) => (
                      <li key={index} className="text-sm">
                        {action}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No follow-up actions specified
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <p>No summary available</p>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t flex justify-between shrink-0">
          <Button 
            variant="outline" 
            onClick={handleCopyToClipboard}
            disabled={!summary || isLoading}
          >
            <ClipboardCopy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
