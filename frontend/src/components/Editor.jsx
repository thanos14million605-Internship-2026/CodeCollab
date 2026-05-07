import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import {
  Play,
  Settings,
  Copy,
  Download,
  Upload,
  Terminal,
  X,
  Check,
} from "lucide-react";
import { SUPPORTED_LANGUAGES, CODE_TEMPLATES } from "../utils/constants";
import socketService from "../socket";
import { useCodeStore } from "./../store/codeStore";
import toast from "react-hot-toast";

const CodeEditor = ({ roomCode, onLanguageChange }) => {
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const { uploadCodePDF, isUploading } = useCodeStore();
  const editorRef = useRef(null);
  const outputRef = useRef(null);

  const handleUploadPDF = async () => {
    try {
      const result = await uploadCodePDF({
        code,
        language,
        room_id: roomCode,
      });

      if (result.success) {
        toast.success("PDF uploaded successfully!");

        window.open(result.data.file_url, "_blank");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Upload failed", error);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      lineNumbers: "on",
      renderWhitespace: "selection",
    });
  };

  const handleCodeChange = useCallback(
    (value) => {
      setCode(value || "");

      if (socketService.isSocketConnected()) {
        socketService.sendCodeChange(value, language);
      }
    },
    [language]
  );

  useEffect(() => {
    const handleCodeChange = (event) => {
      const { code: newCode, language: newLanguage } = event.detail;

      if (newLanguage === language) {
        setCode(newCode);

        if (editorRef.current) {
          editorRef.current.setValue(newCode);
        }
      }
    };

    window.addEventListener("code-change", handleCodeChange);
    return () => window.removeEventListener("code-change", handleCodeChange);
  }, [language]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(CODE_TEMPLATES[newLanguage] || "");
    onLanguageChange?.(newLanguage);
  };

  const runCode = async () => {
    setIsRunning(true);
    setShowOutput(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let result = "";

      switch (language) {
        case "javascript":
          try {
            const func = new Function(code);
            const consoleOutput = [];
            const originalLog = console.log;
            console.log = (...args) => {
              consoleOutput.push(args.join(" "));
            };

            func();
            console.log = originalLog;

            result =
              consoleOutput.length > 0
                ? consoleOutput.join("\n")
                : "Code executed successfully (no output)";
          } catch (error) {
            result = `Error: ${error.message}`;
          }
          break;

        case "python":
          result =
            "Python execution not implemented in demo\nOutput: Hello, World!";
          break;

        default:
          result = `${
            SUPPORTED_LANGUAGES.find((l) => l.id === language)?.name || language
          } code execution not implemented in demo`;
      }

      setOutput(result);
      toast.success("Code executed successfully!");
    } catch (error) {
      setOutput(`Execution error: ${error.message}`);
      toast.error("Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code", error);
    }
  };

  const downloadCode = () => {
    const extensions = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      html: "html",
      css: "css",
    };

    const extension = extensions[language] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Code downloaded successfully!");
  };

  return (
    <div className="editor-container h-full flex flex-col">
      <div className="editor-toolbar">
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Code
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyCode}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadCode}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Download code"
            >
              <Download className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUploadPDF}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200"
              title="Upload as PDF"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  PDF
                </>
              )}
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Room: {roomCode}</span>
          <button
            onClick={() => setShowOutput(!showOutput)}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              showOutput
                ? "bg-primary-100 text-primary-600"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
            title="Toggle output"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className={`${showOutput ? "w-1/2" : "w-full"} relative`}>
          <Editor
            height="100%"
            language={
              SUPPORTED_LANGUAGES.find((l) => l.id === language)?.monaco ||
              "javascript"
            }
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-light"
            options={{
              readOnly: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Output Panel */}
        {showOutput && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-l border-secondary-200 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-secondary-50 border-b border-secondary-200">
              <h3 className="text-sm font-medium text-gray-700">Output</h3>
              <button
                onClick={() => setShowOutput(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              ref={outputRef}
              className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto"
            >
              {isRunning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  Running code...
                </div>
              ) : output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <div className="text-gray-500">
                  Click "Run Code" to see the output
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
