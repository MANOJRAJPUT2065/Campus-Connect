
import { useNavigate } from "react-router-dom";


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

  // 🚨 RapidAPI Key (future me .env se lena)
  const RAPID_API_KEY = "dfdd0e6370msh7713ca2e6f871aap1309b8jsn2a060f288bc8";

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
const navigate = useNavigate();

  const handleClose = () => {
    navigate("/"); // 👈 redirect karega home (http://localhost:5173/)
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
          <button
            onClick={handleClose}
            className="px-3 py-2 bg-red-600 rounded text-sm"
          >
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