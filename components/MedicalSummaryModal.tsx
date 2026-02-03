'use client';

import { useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Summary
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 overflow-y-auto pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2 text-muted-foreground">Generating summary...</p>
            </div>
          ) : summary ? (
            <div className="space-y-6 pb-4 pr-2">
                {/* Summary Metadata */}
                <div className="text-sm text-muted-foreground">
                  <p>Generated: {new Date(summary.timestamp).toLocaleString()}</p>
                  <p>Based on {summary.messageCount} messages</p>
                </div>

                <Separator />

                {/* Symptoms */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">
                    Symptoms Reported
                  </h3>
                  {summary.symptoms.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
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

                <Separator />

                {/* Medications */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-600">
                    Medications Discussed
                  </h3>
                  {summary.medications.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
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

                <Separator />

                {/* Follow-up Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-orange-600">
                    Follow-up Actions
                  </h3>
                  {summary.followUpActions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
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
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p>No summary available</p>
            </div>
          )}
        </CardContent>

        <Separator />

        <div className="p-4 flex justify-between">
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
      </Card>
    </div>
  );
}
