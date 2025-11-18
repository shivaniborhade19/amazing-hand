import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import stopCode from "@/data/stop.ino?raw";

interface CodeEditorProps {
  code: string;
  title: string;
  onClose: () => void;
  requireLogin?: boolean;
  onRequireLogin?: () => void;
  readOnly?: boolean;
  onSaveComplete?: (filename: string, code: string) => void;
  defaultFiles?: { id: string; label: string; code: string }[];
}

export default function CodeEditor({
  code,
  title,
  onClose,
  requireLogin,
  onRequireLogin,
  readOnly = false,
  onSaveComplete,
  defaultFiles,
}: CodeEditorProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [logStream, setLogStream] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [saveError, setSaveError] = useState(""); // <-- validation error shown in dialog

  const removeFocus = () => {
    requestAnimationFrame(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  };

  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  // Normalize code to ignore invisible differences
  function normalizeCode(code: string) {
    return code.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
  }

  // Handle upload (no save)
  const handleUpload = async () => {
    const defaultFile = defaultFiles?.find((f) =>
      title.toLowerCase().includes(f.label.toLowerCase())
    );

    let cleanTitle = title.replace(/\s*Code$/i, "").trim();
    cleanTitle = cleanTitle.endsWith(".ino") ? cleanTitle : `${cleanTitle}.ino`;

    const isDefaultFile = !!defaultFile;
    const isSameAsDefault =
      isDefaultFile &&
      normalizeCode(defaultFile?.code || "") === normalizeCode(currentCode);

    // Login only if edited or non-default
    if (requireLogin && (!isDefaultFile || !isSameAsDefault)) {
      onRequireLogin?.();
      localStorage.setItem("pendingUpload", "true");
      return;
    }

    await performUpload(cleanTitle, currentCode);
  };

  // Upload without saving anything
  const performUpload = async (filename: string, code: string) => {
    setUploading(true);
    removeFocus();
    setMessage(" Preparing upload...");

    try {
      setMessage(" Uploading to Robotic Hand...");

      const res = await fetch("/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, code }),
      });

      const data = await res.json();
      setMessage(data.message || " File sent to uploader.");

      const eventSource = new EventSource("/logs");
      eventSource.onmessage = (event) => {
        setLogStream((prev) => [...prev, event.data].slice(-3));
      };
      eventSource.onerror = () => eventSource.close();
    } catch (err) {
      console.error(err);
      setMessage(" Upload failed — check connection or backend.");
    }

    setUploading(false);
  };

  // Resume pending upload after login
  useEffect(() => {
    const pending = localStorage.getItem("pendingUpload");
    if (pending === "true" && !requireLogin) {
      localStorage.removeItem("pendingUpload");
      handleUpload();
    }
  }, [requireLogin]);

  // Stop upload
  const handleStopUpload = async () => {
    setUploading(true);
    removeFocus();
    setMessage(" Uploading Stop Command...");

    try {
      const res = await fetch("/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "Stop.ino",
          code: stopCode,
        }),
      });

      const data = await res.json();
      setMessage(data.message || " Stop command uploaded.");
    } catch (err) {
      console.error(err);
      setMessage(" Stop upload failed — check connection.");
    }

    setUploading(false);
  };

  // Handle manual save button click
  const handleSaveClick = () => {
    const isDefaultFile = defaultFiles?.some((f) =>
      title.toLowerCase().includes(f.label.toLowerCase())
    );

    if (isDefaultFile) {
      // default file → ask for new name
      setSaveError("");
      setShowSaveDialog(true);
    } else {
      // user file → save directly
      handleSave(title);
    }
  };

  // Perform actual save
  const handleSave = async (fileTitle: string, customCode?: string) => {
    setSaving(true);
    removeFocus();
    setMessage(" Saving file...");

    try {
      let cleanTitle = fileTitle.replace(/\s*Code$/i, "").trim();
      const filename = cleanTitle.endsWith(".ino")
        ? cleanTitle
        : `${cleanTitle}.ino`;

      const res = await fetch("/api/save-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          code: customCode ?? currentCode,
        }),
      });

      if (!res.ok) throw new Error("Failed to save file");

      setMessage(` ${filename} saved successfully!`);
      onSaveComplete?.(filename, customCode ?? currentCode);
    } catch (err) {
      console.error(" Save failed:", err);
      setMessage(" Failed to save file.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  // Confirm save with new name (with validation against default names)
  const handleConfirmSave = () => {
    setSaveError("");
    const name = (newFileName || "").trim();
    if (!name) {
      setSaveError("Please enter a filename.");
      return;
    }
    const cleanName = name.endsWith(".ino") ? name : `${name}.ino`;

    // Normalize for comparison (case-insensitive, ignore .ino)
    const candidateBase = cleanName.replace(/\.ino$/i, "").toLowerCase();

    const conflict = (defaultFiles || []).some((f) => {
      const base = f.label.replace(/\.ino$/i, "").toLowerCase();
      return base === candidateBase;
    });

    if (conflict) {
      setSaveError(
        "Filename conflicts with a default file. Please choose a different name."
      );
      return;
    }

    // OK — proceed to save
    handleSave(cleanName, currentCode);
    setShowSaveDialog(false);
    setNewFileName("");
    setSaveError("");
  };

  // Detect file type
  const ext = title.split(".").pop()?.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "gif", "svg"].includes(ext || "");
  const isMarkdown = ext === "md" || title.toLowerCase().includes("readme");
  // ✅ Enhanced useEffect with logging
  useEffect(() => {
    console.log('🖥️ CodeEditor: code prop changed');
    console.log('🖥️ New code length:', code?.length || 0);
    console.log('🖥️ New code preview:', code?.substring(0, 100));
    console.log('🖥️ Setting currentCode state...');
    
    setCurrentCode(code);
    
    console.log('✅ CodeEditor: currentCode state updated');
  }, [code]);
  useEffect(() => {
    console.log('📝 CodeEditor: currentCode state is now:', currentCode?.length || 0, 'chars');
  }, [currentCode]);

  // ✅ Log when component renders
  console.log('🎨 CodeEditor rendering with:', {
    title,
    codeLength: code?.length || 0,
    currentCodeLength: currentCode?.length || 0,
  });
  return (
    <div className="h-full bg-gray-900 border border-border rounded-lg shadow-card flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
        <h2 className="text-white text-lg font-semibold">
          {title}
          {readOnly && (
            <span className="ml-2 text-xs text-gray-400">(read-only)</span>
          )}
        </h2>
        <span className="text-xs text-gray-400 mr-auto ml-4">
          {currentCode?.length || 0} chars
        </span>
        <div
          className={`flex gap-3 ${
            uploading ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          {!isImage && !isMarkdown && !readOnly && (
            <>
              {/* Save */}
              <button
                onClick={handleSaveClick}
                disabled={saving}
                className={`px-3 py-1 rounded-md border border-gray-600 text-gray-200 transition 
                  ${
                    saving
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-blue-600 hover:border-blue-600 hover:text-white"
                  }`}
                style={{ fontSize: "14px", fontFamily: "monospace" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              {/* Stop */}
              <button
                onClick={handleStopUpload}
                disabled={uploading}
                className={`px-3 py-1 rounded-md border border-gray-600 text-gray-200 transition 
                  ${
                    uploading
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-red-600 hover:border-red-600 hover:text-white"
                  }`}
                style={{ fontSize: "14px", fontFamily: "monospace" }}
              >
                Stop
              </button>

              {/* Upload */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`px-3 py-1 rounded-md border border-gray-600 text-gray-200 transition 
                  ${
                    uploading
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-green-600 hover:border-green-600 hover:text-white"
                  }`}
                style={{ fontSize: "14px", fontFamily: "monospace" }}
              >
                {uploading ? "Uploading..." : "Upload to Robotic Hand"}
              </button>
            </>
          )}

          {/* Exit */}
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md border border-gray-600 text-gray-200 transition hover:bg-yellow-600 hover:border-yellow-600 hover:text-white"
            style={{ fontSize: "14px", fontFamily: "monospace" }}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-2">
        {/* ✅ Add temporary debug view */}
        
        {isImage ? (
          <div className="flex justify-center items-center h-full bg-gray-800">
            <img
              src={code}
              alt={title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : isMarkdown ? (
          <div className="p-4 text-gray-200 prose prose-invert max-w-none overflow-y-auto">
            <ReactMarkdown>{currentCode}</ReactMarkdown>
          </div>
        ) : (
          <Editor
          height="100%"
          defaultLanguage="cpp"
          theme="vs-dark"
          value={currentCode}  // ⬅️ This should have the Gemini code
          onChange={(value) => {
            if (readOnly) return;
            const updated = value || "";
            console.log('✏️ Editor onChange:', updated?.length || 0, 'chars');
            setCurrentCode(updated);
            window.dispatchEvent(
              new CustomEvent("tenxer_code_update", {
                detail: { title, code: updated },
              })
            );
          }}
            options={{
              fontSize: 13,
              lineHeight: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly,
            }}
          />
        )}
      </div>

      {/* Status log */}
      {!isImage && !isMarkdown && (
        <div className="text-sm text-gray-300 py-2 border-t border-gray-700 overflow-y-auto max-h-40 px-3 font-mono">
          <div>{message}</div>
          {logStream.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Save As Dialog */}
      {showSaveDialog && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
    <div className="bg-gray-900 p-5 rounded-2xl shadow-2xl w-80 border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-white">Save File As</h3>

      <input
        type="text"
        placeholder="Enter new filename (without default names)"
        value={newFileName}
        onChange={(e) => {
          setNewFileName(e.target.value);
          if (saveError) setSaveError("");
        }}
        className="w-full border border-gray-600 bg-gray-800 rounded-md p-2 mb-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {saveError && (
        <div className="text-sm text-red-500 mb-3">{saveError}</div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setShowSaveDialog(false);
            setNewFileName("");
            setSaveError("");
          }}
          className="px-3 py-1 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmSave}
          className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
