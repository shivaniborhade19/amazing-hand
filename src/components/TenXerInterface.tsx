// File: TenXerInterface.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import RoboticHand from './RoboticHand';
import CodeEditor from './CodeEditor';
import NavigationControls from './NavigationControls';
import AskInput from './AskInput';
import { useNavigation } from '@/hooks/useNavigation';
import { Home, ArrowLeft } from 'lucide-react';
import { Maximize } from "lucide-react";
import { Minimize } from "lucide-react";

import extraImage from '@/assets/side bar.jpg';
import IndividualFingerControl from '@/data/thumb.ino?raw';
import ringcode from '@/data/index.ino?raw';
import victorycode from '@/data/victory.ino?raw';
import spreadhandcode from '@/data/spread.ino?raw';
import amazingHandCode from '@/data/Amazing_Hand_Demo(1).ino?raw';
import stopCode from "@/data/stop.ino?raw";
import rukaHandImage from '@/assets/rukaa.jpeg';
import loadingImage from '@/assets/loadingImange.jpg';
import Login from "./Login";
import { useAuth } from "@/hooks/useAuth";
// 👇 Add near your other imports
// 👇 Add near your other imports
const repoFiles = import.meta.glob('@/data/AmazingHand-main/AmazingHand-main/**/*', { as: 'raw' });

interface RepoNode {
  type: 'file' | 'folder';
  path?: string;
  children?: Record<string, RepoNode>;
}

const buildFileTree = (files: Record<string, () => Promise<string>>): Record<string, RepoNode> => {
  const tree: Record<string, RepoNode> = {};
  Object.keys(files).forEach((path) => {
    // remove everything before AmazingHand-main/AmazingHand-main/
    const relativePath = path.split('AmazingHand-main/AmazingHand-main/')[1];
    const parts = relativePath.split('/');
    let current = tree;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!current[part]) {
        current[part] = isFile
          ? { type: 'file', path }
          : { type: 'folder', children: {} };
      }
      current = current[part].children || {};
    });
  });
  return tree;
};
const fileTree = buildFileTree(repoFiles);
function FolderNode({
  name,
  node,
  onFileClick,
}: {
  name: string;
  node: RepoNode;
  onFileClick: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  
  // A common way to represent the arrow is using a unicode character (like '▼' or '▶')
  // or a dedicated icon component (like an SVG or a library icon).
  // Using a triangle unicode character '▶' (right-pointing) or '▼' (down-pointing) is simplest.
  const ArrowIcon = open ? '>' : '>';

  // Alternatively, if you want the V-shape from your image, you'll need to use an 
  // SVG or an icon from a library, but for a simple toggle, a triangle is standard.
  // We'll use a CSS class for rotation if you were using a dedicated SVG icon 
  // that always points right, but for the unicode character, we just switch the character.

  return (
    <li>
      <div
        className="p-2 pl-3 cursor-pointer text-gray-300 hover:bg-[#2a2d2e] flex items-center"
        onClick={() => setOpen(!open)}
      >
        {/* ADD THE ARROW ICON HERE */}
        <span 
          className={`mr-1 text-white text-xs`} 
          // Note: If you were using a standard right-pointing SVG, you'd apply a rotation class:
          // className={`mr-1 text-white transition-transform duration-100 ${open ? 'rotate-90' : ''}`}
        >
          {ArrowIcon}
        </span>
        
        {name}
      </div>
      {open && node.children && (
        <ul className="ml-4 border-l border-[#333]">
          {/* ... (rest of the children logic remains the same) */}
          {Object.entries(node.children).map(([childName, childNode]) =>
            childNode.type === 'folder' ? (
              <FolderNode
                key={childName}
                name={childName}
                node={childNode}
                onFileClick={onFileClick}
              />
            ) : (
              <li
                key={childName}
                className="p-2 pl-5 cursor-pointer hover:bg-[#2a2d2e] text-gray-400"
                onClick={() => childNode.path && onFileClick(childNode.path)}
              >
                {childName}
              </li>
            )
          )}
        </ul>
      )}
    </li>
  );
}
interface InteractivePoint {
  id: string;
  x: number;
  y: number;
  label: string;
  code: string;
}

type ViewMode = 'Amazing' | 'landing' | 'split' | 'video-only';

export default function TenXerInterface() {
  const [viewMode, setViewMode] = useState<ViewMode>('Amazing');
  const [selectedPoint, setSelectedPoint] = useState<InteractivePoint | null>(null);
  const [currentCode, setCurrentCode] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [dotsClicked, setDotsClicked] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState<"files" | "search">("files");
  const [searchTerm, setSearchTerm] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRepo, setShowRepo] = useState(false);
  const [isVideoExtended, setIsVideoExtended] = useState(false);
  useEffect(() => {
    if (viewMode === "split") {
      // Reset sidebar + input each time user enters split mode
      setSearchTerm("");
      setActiveTab("files");
    }
  }, [viewMode]);
 
  
const [isCreatingFile, setIsCreatingFile] = useState(false);
const onFileClick = async (path: string) => {
  const loader = repoFiles[path];
  if (loader) {
    const content = await loader();
    setSelectedPoint({
      id: path,
      x: 0,
      y: 0,
      label: path.split('/').pop()!,
      code: content,
    });
    setCurrentCode(content);
  }
};
const handleExtendVideo = () => {
  setIsVideoExtended(true);
};

const handleCloseExtendedVideo = () => {
  setIsVideoExtended(false);
};

// --- Default Files (Always Present) ---
const defaultFiles = [
  { id: "SpreadHand", label: "SpreadHand", code: spreadhandcode},
  { id: "Peace", label: "Peace", code: victorycode },
  { id: "palm", label: "IndividualFingerControl", code: ringcode },
  { id: "amazing_hand", label: "All Gestures", code: amazingHandCode },
];

  // --- Load from backend on mount ---
// --- All Files State ---
const [allFiles, setAllFiles] = useState(() => {
  const stored = localStorage.getItem("tenxer_files");
  if (!stored) return defaultFiles;
  try {
    const saved = JSON.parse(stored);
    const merged = [
      ...defaultFiles,
      ...saved.filter((sf: any) => !defaultFiles.some((df) => df.id === sf.id)),
    ];
    return merged;
  } catch {
    return defaultFiles;
  }
});

// ✅ Keep localStorage synced for user-created files
useEffect(() => {
  const userFiles = allFiles.filter(
    (f) => !defaultFiles.some((df) => df.id === f.id)
  );
  localStorage.setItem("tenxer_files", JSON.stringify(userFiles));
}, [allFiles]);

// --- Fetch files from backend ---
const fetchFiles = async () => {
  try {
    const res = await fetch("/api/files"); // ✅ correct route now
    if (!res.ok) throw new Error("Failed to fetch files");
    const data = await res.json();
const backendFiles = (data.files || []).map(f => ({
  id: f.filename,
  label: f.filename,
  code: f.code,
}));


    // ✅ Merge backend + defaults (unique by id)
    const mergedIds = new Set(defaultFiles.map((df) => df.id));
    const merged = [
      ...defaultFiles,
      ...backendFiles.filter((bf) => !mergedIds.has(bf.id)),
    ];

    setAllFiles(merged);

    // ✅ Store only user-created files
    const userFiles = merged.filter(
      (f) => !defaultFiles.some((df) => df.id === f.id)
    );
    localStorage.setItem("tenxer_files", JSON.stringify(userFiles));
  } catch (err) {
    console.error(" Failed to load backend files:", err);
    setAllFiles(defaultFiles);
  }
};
useEffect(() => {
  fetchFiles();
}, []);


// --- Create New File ---
const handleCreateFile = async () => {
  if (!newFileName.trim()) return;
  const filename = newFileName.endsWith(".ino") ? newFileName : `${newFileName}.ino`;
  const newFile = { id: filename, label: filename, code: "" };

  try {
    // Save to backend
    const res = await fetch("/api/save-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, code: "" }),
    });

    if (!res.ok) throw new Error("Failed to save to backend");

    // Refresh file list
    await fetchFiles();
  } catch (err) {
    console.error(" Error creating file:", err);
    // Add locally as fallback
    setAllFiles((prev) => [...prev, newFile]);
  }

  setNewFileName("");
  setIsCreatingFile(false);
};

// --- Save existing file ---
const handleSaveComplete = async (filename: string, code: string) => {
  const finalName = filename.endsWith("") ? filename : `${filename}.ino`;

  // Create or update in local state immediately
  setAllFiles((prev) => {
    const exists = prev.some((f) => f.id === finalName);
    const updated = exists
      ? prev.map((f) =>
          f.id === finalName ? { ...f, code, label: finalName } : f
        )
      : [...prev, { id: finalName, label: finalName, code }];

    // ✅ keep localStorage sync for user files
    const userFiles = updated.filter(
      (f) => !defaultFiles.some((df) => df.id === f.id)
    );
    localStorage.setItem("tenxer_files", JSON.stringify(userFiles));

    return updated;
  });

  try {
    await fetch("/api/save-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: finalName, code }),
    });

    // Optional: refresh backend copy later
    fetchFiles();

    setSelectedPoint({
      id: finalName,
      x: 0,
      y: 0,
      label: finalName,
      code,
    });
    setCurrentCode(code);
  } catch (err) {
    console.error(" Error saving file:", err);
    alert("Failed to save file.");
  }
};

// Filtered files for search
const filteredFiles =
  searchTerm.trim() === ""
    ? allFiles // show all files when input is empty
    : allFiles.filter((file) =>
        file.label.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const [showLogin, setShowLogin] = useState(false);

const fingerCodeMap: Record<string, string> = {
    thumb: IndividualFingerControl,
    finger3: ringcode,
    palm: IndividualFingerControl,
    wrist: IndividualFingerControl
  };
// Split mode dots (new positions, red color)
const splitModePoints: InteractivePoint[] = [
  { id: "thumb", x: 38, y: 53, label: "Thumb", code: IndividualFingerControl },
  { id: "finger3", x: 76, y: 40, label: "Ring Finger", code: IndividualFingerControl },
  { id: "palm", x: 57, y: 37, label: "pinky finger", code: IndividualFingerControl }, // optional
  { id: "wrist", x: 36, y: 36, label: "index finger", code: IndividualFingerControl }, // optional
];

// Landing page dots (old positions)
const landingPoints: InteractivePoint[] = [
  { id: "thumb", x: 43, y: 56, label: "Thumb", code: IndividualFingerControl },
  { id: "finger3", x: 42, y: 33, label: "Ring Finger", code: IndividualFingerControl },
  { id: "palm", x: 49, y: 35, label: "pinky finger", code: IndividualFingerControl }, // optional
  { id: "wrist", x: 56, y: 37, label: "index finger", code: IndividualFingerControl }, // optional
];
const [splitSearchTerm, setSplitSearchTerm] = useState("");

// === Split mode AskInput ===
const handleSplitAskQuestion = async (question: string) => {
  // 1️⃣ Run the global question handler (same Gemini logic)
  const result = await handleAskQuestion(question);

  // 2️⃣ Special: after Gemini or navigation completes, reset sidebar
  setActiveTab("files");
  setSearchTerm("");

  return result;
};



const handlePointInteraction = (point: InteractivePoint) => {
  const code = point.code || fingerCodeMap[point.id] || "";
  setSelectedPoint(point);
  setCurrentCode(code || "");
  setViewMode('split');
  setDotsClicked(true);
};


  const handleCloseCode = () => {
    setDisableTransition(true);
    setSelectedPoint(null);
    setViewMode('landing');
    setCurrentIndex(3);
    setDotsClicked(false);
    setTimeout(() => setDisableTransition(false), 50);
  };

  const handleHomeClick = () => {
    setDisableTransition(true);
    setVideoPlaying(false);
    setViewMode('Amazing'); // first page view
    setCurrentIndex(0);       // go to page index 0
    setDotsClicked(false);
    setTimeout(() => setDisableTransition(false), 50);
  };
  

  const handleExitClick = () => {
    setVideoPlaying(false);
    setViewMode('Amazing');
    setCurrentIndex(1);
    
  };
  const [isUploading, setIsUploading] = useState(false);
const [uploadComplete, setUploadComplete] = useState(false);
const [terminalOutput, setTerminalOutput] = useState("");

const handleStartHand = async () => {
  setIsUploading(true);
  setUploadComplete(false);
  setUploadProgress(0);

  // Fake gradual progress until real success
  const progressInterval = setInterval(() => {
    setUploadProgress((prev) => {
      if (prev < 90) return prev + 5; // Stop around 90% until success arrives
      return prev;
    });
  }, 400);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "Start.ino",
        code: amazingHandCode,
      }),
    });

    const data = await res.json();

    const eventSource = new EventSource("/logs");
    eventSource.onmessage = (event) => {
      const logLine = event.data.trim();

      if (logLine.includes("uploaded successfully")) {
        clearInterval(progressInterval); // Stop fake progress
        setUploadProgress(100); // fill bar fully
        setUploadComplete(true);
        setIsUploading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      console.error("Log stream closed or failed.");
      clearInterval(progressInterval);
      eventSource.close();
      setIsUploading(false);
    };
  } catch (err) {
    console.error("Start upload failed:", err);
    setIsUploading(false);
  }
};


const [showExtraButton, setShowExtraButton] = useState(false);
const [extraUploading, setExtraUploading] = useState(false);
const [extraTerminalOutput, setExtraTerminalOutput] = useState("");
const [isStopping, setIsStopping] = useState(false);
const handleUploadExtraCode = async () => {
  setExtraUploading(true);
  setIsStopping(true);   // 🔥 show "Stopping..."

  try {
    const res = await fetch("/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "stopHand.ino",
        code: stopCode,
      }),
    });

    const data = await res.json();

    // Listen to backend logs
    const eventSource = new EventSource("/logs");

    eventSource.onmessage = (event) => {
      const logLine = event.data.trim();

      if (logLine.includes("uploaded successfully")) {
        // 🔥 STOP COMPLETE → reset all
        setUploadComplete(false);
        setIsUploading(false);
        setExtraUploading(false);
        setIsStopping(false);     // 🔥 stop text ends
        setUploadProgress(0);

        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      console.error("Stop upload failed SSE.");
      setExtraUploading(false);
      setIsStopping(false);
      eventSource.close();
    };
  } catch (err) {
    console.error("Stop upload failed:", err);
    setExtraUploading(false);
    setIsStopping(false);
  }
};



  const handleBackFromVideo = () => {
    setVideoPlaying(false);
    setViewMode('Amazing');
    setCurrentIndex(0);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    if (index === 0) setViewMode('Amazing');
    else if (index === 1) setViewMode('Amazing');
    else setViewMode('landing');
    setDotsClicked(index === 2);
  };

  const handleNext = () => {
    setDisableTransition(true);
  
    if (currentIndex === 2) {
      // Go back to first page after last page
      setCurrentIndex(0);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  
    setTimeout(() => setDisableTransition(false), 50);
  };
  
  const handlePrevious = () => {
    setDisableTransition(true);
  
    if (currentIndex === 0) {
      // Optional: Loop to last page if going back from first
      setCurrentIndex(2);
    } else {
      setCurrentIndex(currentIndex - 1);
    }
  
    setTimeout(() => setDisableTransition(false), 50);
  };

  const { processPrompt, initializeGemini, isGeminiInitialized } = useNavigation(
    {
      currentView: viewMode,
      currentIndex,
      videoPlaying,
      selectedPoint: selectedPoint?.id || null,
    },
    {
      setViewMode: (mode: string) => setViewMode(mode as ViewMode),
      setCurrentIndex,
      setVideoPlaying,
      setSelectedPoint,
      handleDotClick,
      handleHomeClick,
      handleExitClick,
      handlePointInteraction,
    }
  );

  const handleAskQuestion = async (question: string) => {
    if (isGeminiInitialized) {
      return await processPrompt(question);
    } else {
      console.log('User asked:', question);
      return 'Please setup Gemini API key to enable AI responses.';
    }
  };
  
  const getSearchBarStyle = () => {
    if (viewMode === 'split') {
      return {
        width: '38%',         // smaller width
        maxWidth: '396px',    // reduced max size
        left: '11%',          // move slightly left
        transform: 'translateX(-50%)',
        bottom: '9px',       // adjust bottom spacing
      };
    }

    // default for other modes
    return {
      width: '50%',
      maxWidth: '800px',
      left: '52%',
      transform: 'translateX(-50%)',
      bottom: '28px',
    };
  };
  
 

 // === Split view (Hand + Code side-by-side) ===
if (viewMode === 'split' && selectedPoint) {
  return (
    <div className="h-screen w-screen bg-[hsl(37.5,100%,97%)] overflow-hidden p-3 flex flex-col relative">
      <div className="flex flex-1 gap-4 min-h-0"> 
        {/* === Left Side: Video + AskInput === */}
        <div className="flex flex-col flex-[1_1_28%] min-w-[280px] max-w-[520px] h-full">
          {/* Video Card */}
          <div className="bg-white rounded-[20px] shadow-md relative overflow-hidden flex-1 w-full">
            {/* Header with Enlarge Button */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <h1>TenXer</h1>
                <span>|</span>
                <span>Amazing Hand</span>
              </div>
              <button
  onClick={handleExtendVideo}
  className="p-1 bg-transparent text-white"
>
  <Maximize className="w-5 h-5" />
</button>

            </div>

            {/* Video */}
            <iframe
              src="https://media1.tenxerlabs.com/stream/amazing_hand_portrait.html?room=1234&audio=true&username=null&remote_stream=null&debug=false"
              className="absolute top-0 left-0 w-full h-full scale-[1.15] origin-center"
            />

            {/* Interactive Hand Overlay */}
            <div className="absolute inset-0 z-10">
              <RoboticHand
                onInteraction={handlePointInteraction}
                isInteractive
                points={splitModePoints}
                dotColor="red"
              />
            </div>
          </div>

          {/* AskInput */}
          <div className="w-full mt-3 z-30">
          
      <AskInput
        onSubmit={handleAskQuestion}
        isGeminiInitialized={isGeminiInitialized}
      />
    
          </div>
        </div>

        {/* === Right Side: Code Editor === */}
        <div className="flex flex-1 min-w-0 h-full bg-[#1e1e1e] rounded-[20px] shadow-md overflow-hidden">
          {/* Sidebar */}
          <div className="w-[20%] min-w-[160px] max-w-[260px] bg-[#252526] flex flex-col border-r border-[#333] font-mono text-[14px]">
            {/* Tabs */}
            <div className="flex border-b border-[#333]">
              <button
                className={`flex-1 py-1.5 text-center font-monospace ${
                  activeTab === "files"
                    ? "bg-[#37373d] text-white"
                    : "bg-[#2a2d2e] text-gray-300 hover:bg-[#323436]"
                }`}
                onClick={() => setActiveTab("files")}
                style={{ fontSize: "11px", fontFamily: "monospace" }}
              >
                Files
              </button>
              <button
    className={`flex-1 py-2 text-center text-sm font-semibold ${
      activeTab === "search"
        ? "bg-[#37373d] text-white"
        : "bg-[#2a2d2e] text-gray-300 hover:bg-[#323436]"
    }`}
    onClick={() => setActiveTab("search")}
  >
    Search
  </button>

              <button
                className="flex-1 py-1.5 text-center font-monospace text-white hover:bg-green-700"
                onClick={() => setIsCreatingFile(true)}
                style={{ fontSize: "11px", fontFamily: "monospace" }}
              >
                + New
              </button>
            </div>

            {/* Files List */}
            {activeTab === "files" && (
              <ul className="flex-1 overflow-y-auto relative">
                {/* Default Files Section */}
                <div className="pb-1">
                  {defaultFiles.map((file) => (
                    <li
                      key={file.id}
                      className={`group flex justify-between items-center p-3 pl-5 cursor-pointer text-white hover:bg-[#2a2d2e] ${
                        selectedPoint?.id === file.id ? "bg-[#37373d]" : ""
                      }`}
                      onClick={() => {
                        setCurrentCode(file.code);
                        setSelectedPoint({
                          id: file.id,
                          x: 0,
                          y: 0,
                          label: file.label,
                          code: file.code,
                        });
                      }}
                    >
                      <span
                        className={`flex-1 truncate ${
                          selectedPoint?.id === file.id ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {file.label}
                      </span>
                    </li>
                  ))}
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center my-2">
                  <div className="flex-grow border-t border-[#444]" />
                  <span className="px-2 text-xs text-gray-400 tracking-wider uppercase">
                    Users Files
                  </span>
                  <div className="flex-grow border-t border-[#444]" />
                </div>

                {/* User Files Section */}
                <div className="pb-1">
                  {allFiles
                    .filter((f) => !defaultFiles.some((df) => df.id === f.id))
                    .map((file) => (
                      <li
                        key={file.id}
                        className={`group flex justify-between items-center p-3 pl-5 cursor-pointer hover:bg-[#2a2d2e] ${
                          selectedPoint?.id === file.id ? "bg-[#37373d]" : "text-white"
                        }`}
                        onClick={() => {
                          setCurrentCode(file.code);
                          setSelectedPoint({
                            id: file.id,
                            x: 0,
                            y: 0,
                            label: file.label,
                            code: file.code,
                          });
                        }}
                      >
                        <span
                          className={`flex-1 truncate ${
                            selectedPoint?.id === file.id ? "text-white" : "text-gray-300"
                          }`}
                        >
                          {file.label}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = allFiles.filter((f) => f.id !== file.id);
                            setAllFiles(updated);
                            const userFiles = updated.filter(
                              (f) => !defaultFiles.some((df) => df.id === f.id)
                            );
                            localStorage.setItem("tenxer_files", JSON.stringify(userFiles));
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 ml-2 text-xs transition-opacity"
                          title="Delete file"
                        >
                          
                        </button>
                      </li>
                    ))}
                </div>

                {/* Divider before Doc Section */}
                <div className="flex items-center justify-center my-2">
                  <div className="flex-grow border-t border-[#444]" />
                  <span className="px-2 text-xs text-gray-400 tracking-wider uppercase">
                    Doc
                  </span>
                  <div className="flex-grow border-t border-[#444]" />
                </div>

                {/* Repo Folder Section */}
                <div className="pt-1">
                  {Object.entries(fileTree).map(([childName, childNode]) => (
                    <FolderNode
                      key={childName}
                      name={childName}
                      node={childNode}
                      onFileClick={onFileClick}
                    />
                  ))}
                </div>

                {/* New File Modal */}
                {isCreatingFile && (
                  <div
                    className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
                    onClick={() => setIsCreatingFile(false)}
                  >
                    <div
                      className="bg-[#2a2d2e] p-5 rounded-lg shadow-lg flex flex-col gap-3 w-[300px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h2 className="text-white text-sm font-semibold">Create New File</h2>
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="Enter file name (e.g. myGesture.ino)"
                        className="bg-[#1e1e1e] text-gray-200 text-sm px-3 py-2 rounded-md border border-[#333]"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          className="text-gray-300 text-sm hover:text-gray-100"
                          onClick={() => setIsCreatingFile(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                          onClick={handleCreateFile}
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </ul>
            )}

            {/* Search Tab */}
            {activeTab === "search" && (
              <div className="p-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Search files..."
                className="flex-1 bg-[#1e1e1e] text-gray-200 text-sm px-3 py-2 rounded-md border border-[#333] focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          
                {searchTerm && (
                  
                  <ul className="flex-1 overflow-y-auto mt-2">
                    {filteredFiles.length > 0 ? (
                      filteredFiles.map((file) => (
                        <li
                          key={file.id}
                          className="p-2 pl-5 cursor-pointer text-gray-300 hover:text-white hover:bg-[#2a2d2e]"
                          onClick={() => {
                            setCurrentCode(file.code);
                            setSelectedPoint({
                              id: file.id,
                              x: 0,
                              y: 0,
                              label: file.label,
                              code: file.code,
                            });
                          }}
                        >
                          {file.label}
                        </li>
                      ))
                    ) : (
                      <p className="text-white-500 text-sm px-3 mt-2">
                        No files found
                      </p>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Code Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <CodeEditor
              title={selectedPoint?.label ? `${selectedPoint.label} Code` : "Code Editor"}
              code={currentCode}
              onClose={handleCloseCode}
              requireLogin={!isAuthenticated}
              onRequireLogin={() => setShowLogin(true)}
              readOnly={selectedPoint?.id?.includes("AmazingHand-main")}
              onSaveComplete={handleSaveComplete}
              defaultFiles={defaultFiles}
            />

            {showLogin && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
                onClick={() => setShowLogin(false)}
              >
                <div
                  className="bg-white rounded-lg shadow-lg p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Login
                    onLogin={() => {
                      login();
                      setShowLogin(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ EXTENDED VIDEO OVERLAY - Split mode stays in background, blurred */}
      {isVideoExtended && (
        <div className="absolute inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="relative w-full max-w-7xl h-[90vh] mx-auto">
            {/* White Container with Video */}
           

  {/* Video fills entire container */}
  <iframe
    src={import.meta.env.VITE_VIDEO_STREAM_URL}
    className="absolute inset-0 w-full h-full rounded-[20px]"
    allow="camera;microphone;autoplay;fullscreen"
  />

  {/* Header on top */}
  <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white">
    <div className="flex items-center gap-2">
      <span></span>
      <span>Enlarge view</span>
    </div>

    <button
  onClick={handleCloseExtendedVideo}
  className="p-2 bg-transparent text-white  transition-all duration-200"
>
  <Minimize className="w-5 h-5" />
</button>
  </div>

</div>

         
        </div>
      )}
    </div>
  );
}

  // === Main Pages (Now only 3: Page 0, 1, and Landing) ===
  return (
    <div className="min-h-screen flex items-center justify-center px-2 md:px-6 lg:px-10" style={{ backgroundColor: 'hsl(37.5, 100%, 97%)' }} >
       <div className="relative w-full max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] aspect-video rounded-2xl overflow-hidden shadow-xl bg-white">
 <div
        className={`flex w-full h-full ${!disableTransition ? 'transition-transform duration-500' : ''}`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
       <div className="w-full flex-none relative flex flex-col justify-center items-center">
          {/* Inner video container */}
          <div className="relative w-full flex-1">
            <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden shadow-md">
              <iframe
                src={import.meta.env.VITE_VIDEO_STREAM_URL}
                className="absolute top-0 left-0 w-full h-full object-cover border-none rounded-2xl"
                allow="camera;microphone;autoplay;fullscreen"
              />
              {/* Transparent overlay for click */}
              <div
                onClick={() => {
                  setDisableTransition(true);
                  setCurrentIndex(3);
                  setViewMode('landing');
                  setDotsClicked(true);
                  setTimeout(() => setDisableTransition(false), 50);
                }}
                className="absolute inset-0 cursor-pointer z-20"
              />
              {/* Top-left label */}
              <div className="absolute top-4 left-4 z-30 flex items-center gap-2 text-sm text-white">
                <h1>TenXer</h1>
                <span>| Amazing Hand</span>
              </div>
              {/* Bottom AskInput */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-[70%] max-w-[600px]">
                <AskInput
                  onSubmit={handleAskQuestion}
                  isGeminiInitialized={isGeminiInitialized}
                />
              </div>
            </div>
          </div>
        
</div>


          {/* Page 1: Original Ruka Hand */}
         {/* Page 1: Original Ruka Hand */}
         <div className="w-full flex-none relative flex flex-col justify-center items-center">
          <div className="relative w-full flex-1">
            <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden shadow-md">
            <iframe
                src="https://media1.tenxerlabs.com/stream/amazing_hand.html?room=2000&audio=true"
                className="absolute top-0 left-0 w-full h-full object-cover border-none rounded-2xl"
                allow="camera;microphone;autoplay;fullscreen"
              />
              {/* AskInput */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-[70%] max-w-[600px]">
                <AskInput
                  onSubmit={handleAskQuestion}
                  isGeminiInitialized={isGeminiInitialized}
                />
              </div>
              {/* Navigation arrows */}
              
            </div>
          
        

    {/* ✅ Navigation arrows on top */}
    <div className="absolute inset-0 flex items-center justify-between z-30 pointer-events-none">
  <div className="pointer-events-auto">
    <NavigationControls
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      showNext={true}
    />
  </div>
</div>
  </div>
</div>

{/* Page 2: Image Display Page */}
<div className="w-full flex-none bg-transparent flex flex-col justify-center items-center relative">
  {/* Outer ratio container (locks aspect ratio for image + overlay + input) */}
  <div className="relative w-full pb-[56.40%] rounded-[20px] shadow-md overflow-hidden bg-white">

    {/* Image fills the container */}
    <img
      src={rukaHandImage}
      alt="Ruka Hand"
      className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-500 hover:scale-105 z-10"
    />

    {/* Gray Transparent Overlay */}
    <div className="absolute inset-0 bg-gray-500/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white">
      {/* Top-left title */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 text-sm">
        <h1
          className="text-white font-semibold"
          style={{
            textShadow: "none",
            filter: "none",
            WebkitTextStroke: "0px",
          }}
        >
          TenXer
        </h1>
        <span className="text-white">| Ruka hand</span>
      </div>

      {/* Center content */}
      <p className="text-2xl font-semibold mb-4">Loading..</p>

      {/* Progress Bar */}
      <div className="w-64 h-5 bg-gray-300 rounded-full overflow-hidden mb-4">
        <div className="bg-green-500 h-full w-1/5 flex items-center justify-center text-xs font-bold">
          20%
        </div>
      </div>

      <p className="text-xl font-medium">Coming in Q2 2026</p>
    </div>

    {/* Ask Input (kept proportionally fixed) */}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-[70%] max-w-[600px]">
      <AskInput
        onSubmit={handleAskQuestion}
        isGeminiInitialized={isGeminiInitialized}
      />
    </div>

    {/* ✅ Navigation arrows (top-most layer) */}
    <div className="absolute inset-0 z-50 flex items-center justify-between pointer-events-none">
      <div className="pointer-events-auto">
        <NavigationControls
          onPrevious={handlePrevious}
          onNext={() => {
            // ✅ Wrap to first page from here
            setDisableTransition(true);
            setCurrentIndex(0);
            setTimeout(() => setDisableTransition(false), 50);
          }}
          showPrevious={true}
          showNext={true}
        />
      </div>
    </div>

  </div>
</div>


          {/* Page 2: Landing Page (Dots on video) */}
          <div className="w-full flex-none bg-transparent flex flex-col justify-center items-center relative">
  {/* ✅ Outer container controlling zoom + aspect ratio */}
  <div className="relative w-full pb-[56.40%] rounded-[20px] shadow-md overflow-hidden bg-white">

    {/* 🔹 Title overlay */}
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-sm">
      <h1 className="font-bold text-white">TenXer</h1>
      <span className="text-white">| Amazing Hand</span>
    </div>

    {/* 🔹 Video (same ratio & responsive as Page 0) */}
    <iframe
      src={import.meta.env.VITE_VIDEO_STREAM_URL}
      className="absolute inset-0 w-full h-full rounded-[20px] object-cover border-none"
      allow="camera;microphone;autoplay;fullscreen"
      style={{ zIndex: 1 }}
    />

    {/* 🔹 Transparent click layer */}
    <div className="absolute inset-0 w-full h-full cursor-pointer" style={{ zIndex: 5 }} />

    {/* 🔹 Robotic hand overlay */}
    <div className="absolute inset-0" style={{ zIndex: 10 }}>
      <RoboticHand
        onInteraction={handlePointInteraction}
        isInteractive
        points={landingPoints}
        dotColor="blue"
      />
    </div>

    {/* 🔹 Bottom center image */}
    

    
{/* 🔹 Right-top buttons */}
{/* 🔹 Right-top buttons */}
<div className="absolute top-4 right-4 z-40 flex items-center space-x-3 h-[50px]">

  {/* 🏠 Home Button — MOVED HERE */}
  <Button
    onClick={handleHomeClick}
    variant="outline"
    className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-200 focus:ring-0 px-4 py-2 rounded-md text-[14px] font-mono"
  >
    <Home className="w-5 h-5 text-black" /> Home
  </Button>

  {/* 💻 Code Button */}
  <button
    onClick={() =>
      handlePointInteraction({
        id: "manual",
        x: 0,
        y: 0,
        label: "code editor",
        code: "",
      })
    }
    className="px-4 py-2 rounded-md border border-gray-500 text-[14px] font-mono bg-white text-gray-700 hover:bg-green-600 transition-all duration-300"
  >
    Code
  </button>

  {/* ✨ Hand Magic Button + Stop */}
  <div className="relative inline-block">
  <button
  onClick={() => {
    if (uploadComplete) {
      // 🔥 STOP MODE
      handleUploadExtraCode();
    } else {
      // 🔥 START MODE
      handleStartHand();
    }
  }}
  disabled={isUploading || isStopping}
  className={`relative overflow-hidden px-6 py-1.5 rounded-md border text-[14px] font-mono transition-all duration-500
    ${
      uploadComplete
        ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
        : "bg-white text-black border-gray-500 hover:bg-green-600 hover:text-black"
    }`}
>
  {(isUploading || isStopping) && (
    <span
      className="absolute left-0 top-0 h-full bg-green-600 transition-all duration-500 ease-linear"
      style={{ width: `${uploadProgress}%`, zIndex: 0 }}
    ></span>
  )}

  <span className="relative z-10">
    {isUploading
      ? "Uploading..."
      : isStopping
      ? "Stopping..."
      : uploadComplete
      ? "Stop"
      : "Do Hand Magic"}
  </span>
</button>

  </div>

</div>


    {/* 🔹 AskInput bar (fixed & responsive inside ratio box) */}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 w-[70%] max-w-[600px] pointer-events-auto">
      <AskInput
        onSubmit={handleAskQuestion}
        isGeminiInitialized={isGeminiInitialized}
      />
    </div>

  </div> {/* closes inner pb-[56.40%] container */}
</div> {/* closes outer wrapper */}



        {/* Navigation Arrows */}
        <NavigationControls
  onPrevious={handlePrevious}
  onNext={handleNext}
  showPrevious={currentIndex > 0}
  showNext={true}
/>

        {/* Page Dots */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-30">
  {[0, 1, 2].map((index) => (
    <div
      key={index}
      onClick={() => handleDotClick(index)}
      className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
        index === currentIndex ? 'bg-gray-600' : 'bg-gray-300'
      }`}
    />
  ))}
</div>

        {/* Video Overlay */}
        
      </div>
    </div>
    </div>
  );
}
