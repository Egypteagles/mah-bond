import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onRecorded: (blob: Blob, durationMs: number) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    };
  }, []);

  async function start() {
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const dur = Date.now() - startRef.current;
        stream.getTracks().forEach((t) => t.stop());
        onRecorded(blob, dur);
      };
      recRef.current = rec;
      startRef.current = Date.now();
      rec.start();
      setRecording(true);
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 250);
    } catch (err) {
      console.error(err);
      alert("ما قدرناش نوصل للمايكروفون");
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
  }

  function cancel() {
    chunksRef.current = [];
    if (recRef.current && recRef.current.state !== "inactive") {
      recRef.current.onstop = null;
      recRef.current.stop();
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
    setElapsed(0);
  }

  if (recording) {
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    return (
      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
        <span className="font-mono text-sm tabular-nums text-destructive" dir="ltr">
          {mm}:{ss}
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={cancel}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" onClick={stop} variant="default">
          <Square className="h-4 w-4" /> إيقاف
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={start}
      disabled={disabled || busy}
      className="gap-1"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
      تسجيل صوتي
    </Button>
  );
}

export function AudioPlayer({ src }: { src: string }) {
  return (
    <audio src={src} controls className="w-full max-w-sm" preload="metadata">
      المتصفح بتاعك ما يدعمش الصوت.
    </audio>
  );
}