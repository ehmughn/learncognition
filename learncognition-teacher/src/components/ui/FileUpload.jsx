import { useRef, useState } from "react";
import { Upload, X, Image } from "lucide-react";

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  label = "Upload Image",
  hint,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || null);

  function handleFile(file) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  function handleClear() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-1">
      {label && (
        <p className="block text-sm font-medium text-gray-700">{label}</p>
      )}
      {preview ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
        >
          <Image size={28} className="text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-600">
            Drag & drop or click to upload
          </p>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
