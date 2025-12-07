// import React, { useState, useEffect, useRef } from 'react';
// import { motion } from 'framer-motion';
// import { FaPlay, FaSave, FaShare, FaDownload, FaCode, FaLanguage, FaUsers, FaEye } from 'react-icons/fa';
// import { toast } from 'react-toastify';
// import { buildApiUrl } from '../config/api';
// import axios from 'axios';

// const CodeEditor = React.memo(({ onClose }) => {
//   const [code, setCode] = useState('console.log("Hello World!");');
//   const [language, setLanguage] = useState('javascript');
//   const [theme, setTheme] = useState('vs-dark');
//   const [fontSize, setFontSize] = useState(14);
//   const [isRunning, setIsRunning] = useState(false);
//   const [output, setOutput] = useState('');
//   const [isCollaborative, setIsCollaborative] = useState(false);
//   const [fileName, setFileName] = useState('untitled.js');
//   const [savedFiles, setSavedFiles] = useState([]);
//   const [showFileManager, setShowFileManager] = useState(false);
//   const [executionInput, setExecutionInput] = useState('');

//   const editorRef = useRef(null);
//   const outputRef = useRef(null);

//   // Language mapping for RapidAPI
//   const languageMapping = {
//     'javascript': '17',
//     'python': '5',
//     'java': '4',
//     'cpp': '7',
//     'c': '6',
//     'csharp': '1',
//     'php': '8',
//     'ruby': '9',
//     'go': '20',
//     'rust': '46',
//     'swift': '15'
//   };

//   // Default code templates for different languages
//   const getDefaultCode = (lang) => {
//     switch (lang) {
//       case 'cpp':
//         return `#include <bits/stdc++.h>
// using namespace std;

// int main() {
//     cout << "Hello World!" << endl;
//     return 0;
// }`;
//       case 'c':
//         return `#include <stdio.h>

// int main() {
//     printf("Hello World!\\n");
//     return 0;
// }`;
//       case 'java':
//         return `public class Main {
//     public static void main(String[] args) {
//         System.out.println("Hello World!");
//     }
// }`;
//       case 'python':
//         return `print("Hello World!")`;
//       case 'javascript':
//         return `console.log("Hello World!");`;
//       default:
//         return `// Write your code here`;
//     }
//   };

//   const languages = [
//     { value: 'javascript', label: 'JavaScript', extension: '.js' },
//     { value: 'python', label: 'Python', extension: '.py' },
//     { value: 'java', label: 'Java', extension: '.java' },
//     { value: 'cpp', label: 'C++', extension: '.cpp' },
//     { value: 'c', label: 'C', extension: '.c' },
//     { value: 'csharp', label: 'C#', extension: '.cs' },
//     { value: 'php', label: 'PHP', extension: '.php' },
//     { value: 'ruby', label: 'Ruby', extension: '.rb' },
//     { value: 'go', label: 'Go', extension: '.go' },
//     { value: 'rust', label: 'Rust', extension: '.rs' },
//     { value: 'swift', label: 'Swift', extension: '.swift' }
//   ];

//   const themes = [
//     { value: 'vs-dark', label: 'Dark' },
//     { value: 'vs-light', label: 'Light' },
//     { value: 'hc-black', label: 'High Contrast' }
//   ];

//   // Execute code using RapidAPI
//   const executeCode = async (code, languageChoice, inputData = "") => {
//     try {
//       const response = await axios.post(
//         'https://code-compiler.p.rapidapi.com/v2',
//         {
//           LanguageChoice: languageChoice,
//           Program: code,
//           Input: inputData,
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'X-RapidAPI-Host': 'code-compiler.p.rapidapi.com',
//             'X-RapidAPI-Key': 'dfdd0e6370msh7713ca2e6f871aap1309b8jsn2a060f288bc8',
//           },
//         }
//       );

//       console.log('API Response:', response.data);

//       if (response.data && response.data.Result !== undefined) {
//         return {
//           success: true,
//           output: response.data.Result || "No output received.",
//         };
//       } else {
//         return {
//           success: false,
//           output: "Unexpected response format or no output returned from the server.",
//         };
//       }
//     } catch (error) {
//       return {
//         success: false,
//         output: `Error: ${error.message}`,
//       };
//     }
//   };

//   // Initialize Monaco Editor - Only once
//   useEffect(() => {
//     let editorInstance = null;
    
//     const loadMonaco = async () => {
//       try {
//         const monaco = await import('monaco-editor');
        
//         if (editorRef.current && !editorRef.current.editor) {
//           editorInstance = monaco.editor.create(editorRef.current, {
//             value: code,
//             language: language,
//             theme: theme,
//             fontSize: fontSize,
//             automaticLayout: true,
//             minimap: { enabled: true },
//             scrollBeyondLastLine: false,
//             wordWrap: 'on',
//             lineNumbers: 'on',
//             roundedSelection: false,
//             selectOnLineNumbers: true,
//             cursorStyle: 'line',
//             scrollbar: {
//               vertical: 'visible',
//               horizontal: 'visible'
//             },
//             // Performance optimizations
//             renderWhitespace: 'none',
//             renderControlCharacters: false,
//             renderLineHighlight: 'line',
//             smoothScrolling: true,
//             mouseWheelScrollSensitivity: 1,
//             fastScrollSensitivity: 5
//           });

//           // Debounced content change handler to prevent excessive re-renders
//           let changeTimeout;
//           editorInstance.onDidChangeModelContent(() => {
//             clearTimeout(changeTimeout);
//             changeTimeout = setTimeout(() => {
//               const newCode = editorInstance.getValue();
//               if (newCode !== code) {
//                 setCode(newCode);
//               }
//             }, 300); // 300ms debounce
//           });

//           // Store editor instance
//           editorRef.current.editor = editorInstance;
//           editorRef.current.monaco = monaco;
//         }
//       } catch (error) {
//         console.error('Failed to load Monaco Editor:', error);
//         toast.error('Code editor failed to load. Using fallback.');
//       }
//     };

//     loadMonaco();

//     // Cleanup function
//     return () => {
//       if (editorInstance) {
//         editorInstance.dispose();
//       }
//     };
//   }, [code, language, theme, fontSize]); // Include dependencies

//   // Update editor when language/theme changes - Optimized
//   useEffect(() => {
//     if (editorRef.current?.editor && editorRef.current?.monaco) {
//       const editor = editorRef.current.editor;
//       const monaco = editorRef.current.monaco;
      
//       // Batch updates to prevent multiple re-renders
//       const model = editor.getModel();
//       if (model) {
//         monaco.editor.setModelLanguage(model, language);
//         editor.updateOptions({ 
//           fontSize,
//           theme: theme 
//         });
//       }
//     }
//   }, [language, theme, fontSize]);

//   // Update editor value when code changes (for language switching)
//   useEffect(() => {
//     if (editorRef.current?.editor) {
//       const editor = editorRef.current.editor;
//       const currentValue = editor.getValue();
//       if (currentValue !== code) {
//         editor.setValue(code);
//       }
//     }
//   }, [code]);

//   const runCode = async () => {
//     if (isRunning) return; // Prevent multiple simultaneous executions
    
//     if (!code || !code.trim()) {
//       toast.error("Error: Code cannot be empty");
//       return;
//     }
    
//     setIsRunning(true);
//     setOutput('Running code...\n');
    
//     try {
//       const languageCode = languageMapping[language];
//       if (!languageCode) {
//         setOutput('Error: Language not supported for execution');
//         return;
//       }

//       const response = await executeCode(code, languageCode, executionInput);
      
//       if (response.success) {
//         setOutput(response.output);
//       } else {
//         setOutput(`Error: ${response.output}`);
//         toast.error(`Execution failed: ${response.output}`);
//       }
//     } catch (error) {
//       setOutput(`Error: ${error.message}`);
//       toast.error(`Execution error: ${error.message}`);
//     } finally {
//       setIsRunning(false);
//     }
//   };

//   const saveCode = async () => {
//     try {
//       const response = await fetch(buildApiUrl('/api/code/save'), {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: fileName,
//           code,
//           language,
//           isPublic: false
//         })
//       });

//       if (response.ok) {
//         toast.success('Code saved successfully!');
//         // Refresh saved files
//         fetchSavedFiles();
//       } else {
//         toast.error('Failed to save code');
//       }
//     } catch (error) {
//       toast.error('Error saving code');
//     }
//   };

//   const downloadCode = () => {
//     const blob = new Blob([code], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = fileName;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//     toast.success('Code downloaded!');
//   };

//   const shareCode = async () => {
//     try {
//       const response = await fetch(buildApiUrl('/api/code/share'), {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: fileName,
//           code,
//           language,
//           isPublic: true
//         })
//       });

//       if (response.ok) {
//         const data = await response.json();
//         const shareUrl = `${window.location.origin}/code/${data.id}`;
//         await navigator.clipboard.writeText(shareUrl);
//         toast.success('Share link copied to clipboard!');
//       } else {
//         toast.error('Failed to share code');
//       }
//     } catch (error) {
//       toast.error('Error sharing code');
//     }
//   };

//   const fetchSavedFiles = async () => {
//     try {
//       const response = await fetch(buildApiUrl('/api/code/files'));
//       if (response.ok) {
//         const data = await response.json();
//         setSavedFiles(data.files || []);
//       }
//     } catch (error) {
//       console.error('Failed to fetch saved files:', error);
//     }
//   };

//   const loadFile = (file) => {
//     setCode(file.code);
//     setLanguage(file.language);
//     setFileName(file.name);
//     setShowFileManager(false);
//     toast.success(`Loaded ${file.name}`);
//   };

//   const toggleCollaboration = () => {
//     setIsCollaborative(!isCollaborative);
//     if (!isCollaborative) {
//       toast.info('Collaboration mode enabled. Share this link with others!');
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
//       <motion.div 
//         initial={{ scale: 0.9, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col"
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-t-xl">
//           <div className="flex items-center space-x-4">
//             <FaCode className="text-2xl" />
//             <div>
//               <h2 className="text-xl font-bold">Code Editor</h2>
//               <p className="text-sm text-gray-300">Write, run, and share code</p>
//             </div>
//           </div>
          
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={toggleCollaboration}
//               className={`px-3 py-2 rounded text-sm ${
//                 isCollaborative ? 'bg-green-600' : 'bg-gray-600'
//               }`}
//             >
//               <FaUsers className="inline mr-1" />
//               {isCollaborative ? 'Collaborating' : 'Collaborate'}
//             </button>
//             <button
//               onClick={() => setShowFileManager(!showFileManager)}
//               className="px-3 py-2 bg-blue-600 rounded text-sm"
//             >
//               <FaEye className="inline mr-1" />
//               Files
//             </button>
//             <button
//               onClick={onClose}
//               className="px-3 py-2 bg-red-600 rounded text-sm"
//             >
//               Close
//             </button>
//           </div>
//         </div>

//         {/* Toolbar */}
//         <div className="flex items-center justify-between p-3 bg-gray-100 border-b">
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <FaLanguage className="text-gray-600" />
//               <select
//                 value={language}
//                 onChange={(e) => {
//                   const newLang = e.target.value;
//                   setLanguage(newLang);
//                   // Update code template when language changes
//                   setCode(getDefaultCode(newLang));
//                   // Update file extension
//                   const langObj = languages.find(l => l.value === newLang);
//                   if (langObj) {
//                     setFileName(`untitled${langObj.extension}`);
//                   }
//                 }}
//                 className="px-3 py-1 border rounded text-sm"
//               >
//                 {languages.map(lang => (
//                   <option key={lang.value} value={lang.value}>
//                     {lang.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-600">Theme:</span>
//               <select
//                 value={theme}
//                 onChange={(e) => setTheme(e.target.value)}
//                 className="px-2 py-1 border rounded text-sm"
//               >
//                 {themes.map(t => (
//                   <option key={t.value} value={t.value}>{t.label}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-600">Font:</span>
//               <input
//                 type="range"
//                 min="10"
//                 max="24"
//                 value={fontSize}
//                 onChange={(e) => setFontSize(parseInt(e.target.value))}
//                 className="w-20"
//               />
//               <span className="text-sm text-gray-600">{fontSize}px</span>
//             </div>
//           </div>

//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => {
//                 setCode(getDefaultCode(language));
//                 setOutput('');
//                 toast.info('New file created!');
//               }}
//               className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
//               title="Create new file with template"
//             >
//               <FaCode className="inline mr-1" />
//               New
//             </button>
//             <input
//               type="text"
//               value={fileName}
//               onChange={(e) => setFileName(e.target.value)}
//               className="px-3 py-1 border rounded text-sm w-40"
//               placeholder="File name"
//             />
//             <button
//               onClick={saveCode}
//               className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
//             >
//               <FaSave className="inline mr-1" />
//               Save
//             </button>
//             <button
//               onClick={downloadCode}
//               className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
//             >
//               <FaDownload className="inline mr-1" />
//               Download
//             </button>
//             <button
//               onClick={shareCode}
//               className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
//             >
//               <FaShare className="inline mr-1" />
//               Share
//             </button>
//             <button
//               onClick={runCode}
//               disabled={isRunning}
//               className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
//             >
//               <FaPlay className="inline mr-1" />
//               {isRunning ? 'Running...' : 'Run'}
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 flex overflow-hidden">
//           {/* Code Editor */}
//           <div className="flex-1 flex flex-col">
//             <div className="flex-1 relative">
//               <div ref={editorRef} className="w-full h-full" />
//             </div>
//           </div>

//           {/* Right Panel - Input and Output */}
//           <div className="w-1/3 bg-gray-900 text-green-400 p-4 border-l border-gray-700 flex flex-col">
//             {/* Input Section */}
//             <div className="mb-4">
//               <h3 className="text-lg font-semibold mb-3 text-white">Input (if required)</h3>
//               <textarea
//                 value={executionInput}
//                 onChange={(e) => setExecutionInput(e.target.value)}
//                 placeholder="Enter input for your code here"
//                 rows="3"
//                 className="w-full bg-black text-green-400 p-3 rounded font-mono text-sm border border-gray-600 resize-none"
//               />
//             </div>

//             {/* Output Section */}
//             <div className="flex-1">
//               <h3 className="text-lg font-semibold mb-3 text-white">Output</h3>
//               <div 
//                 ref={outputRef}
//                 className="bg-black p-3 rounded h-full overflow-y-auto font-mono text-sm border border-gray-600"
//               >
//                 <pre className="text-green-400">{output || '// Output will appear here'}</pre>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* File Manager Modal */}
//         {showFileManager && (
//           <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//             <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
//               <h3 className="text-lg font-semibold mb-4">Saved Files</h3>
//               {savedFiles.length === 0 ? (
//                 <p className="text-gray-500">No saved files yet</p>
//               ) : (
//                 <div className="space-y-2">
//                   {savedFiles.map((file, index) => (
//                     <div
//                       key={index}
//                       onClick={() => loadFile(file)}
//                       className="p-3 border rounded cursor-pointer hover:bg-gray-50"
//                     >
//                       <div className="font-semibold">{file.name}</div>
//                       <div className="text-sm text-gray-600">{file.language}</div>
//                       <div className="text-xs text-gray-500">
//                         {new Date(file.updatedAt).toLocaleDateString()}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//               <button
//                 onClick={() => setShowFileManager(false)}
//                 className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </motion.div>
//     </div>
//   );
// });

// CodeEditor.displayName = 'CodeEditor';

// export default CodeEditor;



import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlay, FaSave, FaShare, FaDownload, FaCode, 
  FaLanguage, FaUsers, FaEye 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const CodeEditor = React.memo(({ onClose }) => {
  const [code, setCode] = useState('console.log("Hello World!");');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [fileName, setFileName] = useState('untitled.js');
  const [savedFiles, setSavedFiles] = useState([]);
  const [showFileManager, setShowFileManager] = useState(false);
  const [executionInput, setExecutionInput] = useState('');

  const editorRef = useRef(null);
  const outputRef = useRef(null);

  // RapidAPI Key from environment variable
  const RAPID_API_KEY = import.meta.env.VITE_RAPID_API_KEY || "";

  // Language mapping for RapidAPI
  const languageMapping = {
    javascript: '17',
    python: '5',
    java: '4',
    cpp: '7',
    c: '6',
    csharp: '1',
    php: '8',
    ruby: '9',
    go: '20',
    rust: '46',
    swift: '15'
  };

  // Default code templates for different languages
  const getDefaultCode = (lang) => {
    switch (lang) {
      case 'cpp':
        return `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`;
      case 'c':
        return `#include <stdio.h>

int main() {
    printf("Hello World!\\n");
    return 0;
}`;
      case 'java':
        return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}`;
      case 'python':
        return `print("Hello World!")`;
      case 'javascript':
        return `console.log("Hello World!");`;
      default:
        return `// Write your code here`;
    }
  };

  const languages = [
    { value: 'javascript', label: 'JavaScript', extension: '.js' },
    { value: 'python', label: 'Python', extension: '.py' },
    { value: 'java', label: 'Java', extension: '.java' },
    { value: 'cpp', label: 'C++', extension: '.cpp' },
    { value: 'c', label: 'C', extension: '.c' },
    { value: 'csharp', label: 'C#', extension: '.cs' },
    { value: 'php', label: 'PHP', extension: '.php' },
    { value: 'ruby', label: 'Ruby', extension: '.rb' },
    { value: 'go', label: 'Go', extension: '.go' },
    { value: 'rust', label: 'Rust', extension: '.rs' },
    { value: 'swift', label: 'Swift', extension: '.swift' }
  ];

  const themes = [
    { value: 'vs-dark', label: 'Dark' },
    { value: 'vs-light', label: 'Light' },
    { value: 'hc-black', label: 'High Contrast' }
  ];

  // 🚀 Execute code using RapidAPI
  const executeCode = async (code, languageChoice, inputData = "") => {
    try {
      const response = await axios.post(
        "https://code-compiler.p.rapidapi.com/v2",
        {
          LanguageChoice: languageChoice,
          Program: code,
          Input: inputData,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Host": "code-compiler.p.rapidapi.com",
            "X-RapidAPI-Key": RAPID_API_KEY,
          },
        }
      );

      if (response.data && response.data.Result !== undefined) {
        return { success: true, output: response.data.Result || "No output received." };
      } else {
        return { success: false, output: "Unexpected response format or no output returned." };
      }
    } catch (error) {
      return { success: false, output: `Error: ${error.message}` };
    }
  };

  // 🖊 Initialize Monaco Editor once
  useEffect(() => {
    let editorInstance = null;
    const loadMonaco = async () => {
      try {
        const monaco = await import("monaco-editor");
        if (editorRef.current && !editorRef.current.editor) {
          editorInstance = monaco.editor.create(editorRef.current, {
            value: code,
            language,
            theme,
            fontSize,
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            renderWhitespace: "none",
            smoothScrolling: true,
          });

          let changeTimeout;
          editorInstance.onDidChangeModelContent(() => {
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(() => {
              const newCode = editorInstance.getValue();
              if (newCode !== code) setCode(newCode);
            }, 300);
          });

          editorRef.current.editor = editorInstance;
          editorRef.current.monaco = monaco;
        }
      } catch (error) {
        console.error("Failed to load Monaco:", error);
        toast.error("Code editor failed to load.");
      }
    };

    loadMonaco();
    return () => editorInstance?.dispose();
  }, []);

  // ⚡ Update theme, lang, font size
  useEffect(() => {
    if (editorRef.current?.editor && editorRef.current?.monaco) {
      const editor = editorRef.current.editor;
      const monaco = editorRef.current.monaco;
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
        editor.updateOptions({ fontSize });
        monaco.editor.setTheme(theme);
      }
    }
  }, [language, theme, fontSize]);

  // Keep editor in sync with state
  useEffect(() => {
    if (editorRef.current?.editor) {
      const editor = editorRef.current.editor;
      if (editor.getValue() !== code) editor.setValue(code);
    }
  }, [code]);

  // ▶ Run code
  const runCode = async () => {
    if (isRunning) return;
    if (!code.trim()) {
      toast.error("Error: Code cannot be empty");
      return;
    }

    setIsRunning(true);
    setOutput("Running code...\n");

    try {
      const langCode = languageMapping[language];
      if (!langCode) {
        setOutput("Error: Language not supported");
        return;
      }
      const response = await executeCode(code, langCode, executionInput);
      if (response.success) {
        setOutput(response.output);
      } else {
        setOutput(`Error: ${response.output}`);
        toast.error(response.output);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 💾 Save (dummy for now)
  const saveCode = () => toast.success("Code saved locally!");

  // ⬇ Download
  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-t-xl">
          <div className="flex items-center space-x-4">
            <FaCode className="text-2xl" />
            <h2 className="text-xl font-bold">Code Editor</h2>
          </div>
          <button onClick={onClose} className="px-3 py-2 bg-red-600 rounded text-sm">
            Close
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-gray-100 border-b">
          <div className="flex items-center space-x-2">
            <FaLanguage className="text-gray-600" />
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setCode(getDefaultCode(e.target.value));
                setFileName(`untitled.${e.target.value}`);
              }}
              className="px-3 py-1 border rounded text-sm"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <button onClick={saveCode} className="px-3 py-2 bg-green-600 text-white rounded text-sm"><FaSave /></button>
            <button onClick={downloadCode} className="px-3 py-2 bg-blue-600 text-white rounded text-sm"><FaDownload /></button>
            <button onClick={runCode} disabled={isRunning} className="px-3 py-2 bg-orange-600 text-white rounded text-sm"><FaPlay /> {isRunning ? "Running..." : "Run"}</button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <div ref={editorRef} className="w-full h-full" />
          </div>
          <div className="w-1/3 bg-gray-900 text-green-400 p-4 border-l border-gray-700 flex flex-col">
            <h3 className="text-lg font-semibold text-white">Input</h3>
            <textarea
              value={executionInput}
              onChange={(e) => setExecutionInput(e.target.value)}
              rows="3"
              className="w-full bg-black text-green-400 p-2 rounded font-mono text-sm mb-3"
            />
            <h3 className="text-lg font-semibold text-white">Output</h3>
            <div ref={outputRef} className="bg-black p-2 rounded flex-1 overflow-y-auto">
              <pre>{output || "// Output will appear here"}</pre>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

CodeEditor.displayName = "CodeEditor";
export default CodeEditor;
