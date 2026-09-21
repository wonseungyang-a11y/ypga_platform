"use client";

import { useEffect, useRef } from "react";

const VIDEO_ID = "N_HuGLXV-yY";
const VOLUME = 40;

type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
};

type YtNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width: number;
      height: number;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (e: { target: YtPlayer }) => void;
        onStateChange: (e: { data: number; target: YtPlayer }) => void;
      };
    },
  ) => YtPlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
  };
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeIframeApi(): Promise<YtNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  return new Promise((resolve) => {
    const finish = () => {
      if (window.YT?.Player) resolve(window.YT);
    };
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      finish();
    };

    const src = "https://www.youtube.com/iframe_api";
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }

    const timer = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(timer);
        finish();
      }
    }, 50);
  });
}

function forcePlayWithSound(player: YtPlayer) {
  player.setVolume(VOLUME);
  player.unMute();
  player.playVideo();
}

export function BackgroundMusic() {
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    let cancelled = false;
    let keepAlive: number | undefined;
    let player: YtPlayer | null = null;
    const host = document.createElement("div");
    slot.appendChild(host);

    void loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !host.isConnected) return;

      player = new YT.Player(host, {
        videoId: VIDEO_ID,
        width: 200,
        height: 200,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: VIDEO_ID,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            const iframe = slot.querySelector("iframe");
            iframe?.setAttribute(
              "allow",
              "autoplay; encrypted-media; accelerometer; gyroscope",
            );
            iframe?.setAttribute("tabindex", "-1");
            forcePlayWithSound(e.target);
            window.setTimeout(() => forcePlayWithSound(e.target), 250);
            window.setTimeout(() => forcePlayWithSound(e.target), 1000);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) {
              forcePlayWithSound(e.target);
              return;
            }
            if (e.data === YT.PlayerState.PLAYING) {
              e.target.unMute();
              e.target.setVolume(VOLUME);
            }
          },
        },
      });

      keepAlive = window.setInterval(() => {
        if (!player?.getPlayerState) return;
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
          if (player.isMuted?.()) {
            player.unMute();
            player.setVolume(VOLUME);
          }
          return;
        }
        if (state === YT.PlayerState.BUFFERING || typeof state !== "number") {
          return;
        }
        forcePlayWithSound(player);
      }, 1500);
    });

    return () => {
      cancelled = true;
      if (keepAlive) window.clearInterval(keepAlive);
      player?.destroy();
      slot.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={slotRef}
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 left-0 z-0 h-[200px] w-[200px] overflow-hidden opacity-0 [&_iframe]:h-full [&_iframe]:w-full"
    />
  );
}
