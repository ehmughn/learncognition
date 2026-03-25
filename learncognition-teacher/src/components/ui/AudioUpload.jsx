import { useRef, useState } from "react";
import { Mic, Upload, X, Square, Play, Pause } from "lucide-react";
import { Button } from "./Button";

export function AudioUpload({ value, onChange, label = "Audio Narration" }) {
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState(value || null);
  const [playing, setPlaying] = useState(false);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `recording-${Date.now()}.webm`, {
        type: "audio/webm",
      });
      const url = URL.createObjectURL(blob);
      setAudioPreview(url);
      onChange(file);
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function handleFile(file) {
    if (!file) return;
    setAudioPreview(URL.createObjectURL(file));
    onChange(file);
  }

  function handleClear() {
    setAudioPreview(null);
    onChange(null);
    setPlaying(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <div className="space-y-1">
      {label && (
        <p className="block text-sm font-medium text-gray-700">{label}</p>
      )}
      {audioPreview ? (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <audio
            ref={audioRef}
            src={audioPreview}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <p className="text-sm text-indigo-700 flex-1 font-medium">
            Audio recorded
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            <Upload size={14} /> Upload File
          </Button>
          <Button
            type="button"
            variant={recording ? "danger" : "secondary"}
            size="sm"
            onClick={
              recording
                ? stopRecording
                : () => {
                    startRecording();
                  }
            }
          >
            {recording ? (
              <>
                <Square size={14} /> Stop Recording
              </>
            ) : (
              <>
                <Mic size={14} /> Record Audio
              </>
            )}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}
      <p className="text-xs text-gray-500">
        Audio narration helps SPED students identify objects more easily.
      </p>
    </div>
  );
}
