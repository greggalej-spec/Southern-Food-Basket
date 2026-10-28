"use client";

import { useEffect } from "react";
import { startEntrance } from "@/lib/home/entrance";
import { startLiving } from "@/lib/home/living";

/** Starts the Grand Entrance on the server-rendered page: the camera and page controls first, then the living layer,
 *  which reads the camera. Renders nothing; unmounting stops both. */
export function HomeLive() {
  useEffect(() => {
    const entrance = startEntrance();
    const stopLiving = startLiving(entrance.stage);
    return () => {
      stopLiving();
      entrance.stop();
    };
  }, []);
  return null;
}
