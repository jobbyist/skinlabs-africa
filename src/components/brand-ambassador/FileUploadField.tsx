import { useEffect, useId, useMemo, useRef } from "react";
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

interface FileUploadFieldProps {
  label: string;
  description?: string;
  file: File | null;
  onChange: (file: File | null, error?: string) => void;
  error?: string;
}

const formatBytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

const FileUploadField = ({ label, description, file, onChange, error }: FileUploadFieldProps) => {
  const inputId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    const picked = fileList?.[0];
    if (!picked) return;
    
    // Validate file extension as primary check
    const ext = picked.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    if (!ext || !allowedExtensions.includes(ext)) {
      onChange(null, "Please upload a PNG, JPG/JPEG or PDF file.");
      return;
    }
    
    // Validate MIME type as secondary check
    if (!ACCEPTED_TYPES.includes(picked.type)) {
      onChange(null, "Please upload a PNG, JPG/JPEG or PDF file.");
      return;
    }
    
    if (picked.size > MAX_FILE_BYTES) {
      onChange(null, `That file is ${formatBytes(picked.size)} — please upload a file under 10MB.`);
      return;
    }
    onChange(picked, undefined);
  };

  const isImage = Boolean(file && file.type.startsWith("image/"));
  const previewUrl = useMemo(() => (isImage && file ? URL.createObjectURL(file) : null), [isImage, file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label} *</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {!file ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/40",
            error && "border-destructive/60",
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Tap to upload a screenshot or PDF</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, JPEG or PDF — max 10MB</span>
        </label>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={`Preview of ${file.name}`} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null, undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={`Remove ${file.name} and upload a different file`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
        className="sr-only"
        aria-describedby={error ? statusId : undefined}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div id={statusId} role="status" aria-live="polite">
        {error && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUploadField;
