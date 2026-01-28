/* eslint-disable @typescript-eslint/no-explicit-any */
import Editor, { OnMount } from "@monaco-editor/react";
import { useRef } from "react";
import { Loader2 } from "lucide-react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function MonacoEditor({ value, onChange, readOnly = false }: MonacoEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure HTML language features
    monaco.languages.html.htmlDefaults.setOptions({
      format: {
        tabSize: 2,
        insertSpaces: true,
        wrapLineLength: 120,
        unformatted: "wbr",
        contentUnformatted: "pre,code,textarea",
        indentInnerHtml: false,
        preserveNewLines: true,
        maxPreserveNewLines: null,
        indentHandlebars: false,
        endWithNewline: false,
        extraLiners: "head,body,/html",
        wrapAttributes: "auto",
      },
    });

    // Set editor theme
    monaco.editor.setTheme("vs-dark");
  };

  return (
    <div className="w-full h-full border rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="html"
        value={value}
        onChange={(newValue) => onChange(newValue || "")}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
        options={{
          readOnly,
          minimap: {
            enabled: true,
          },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          folding: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}
