import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, BetweenHorizontalEnd, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import Visualizer from "./Visualizer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ControlPanelProps {
  connectionStatus: string;
  isMuted: boolean;
  muteMicrophone: () => void;
  unmuteMicrophone: () => void;
  handleClickInterrupt: () => void;
  handleClickCloseConnection: () => void;
  microphoneStream: MediaStream | null | undefined;
  audioBuffer: AudioBuffer | null | undefined;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  connectionStatus,
  isMuted,
  muteMicrophone,
  unmuteMicrophone,
  handleClickInterrupt,
  handleClickCloseConnection,
  microphoneStream,
  audioBuffer,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return (
    <div
      className={cn(
        "fixed bottom-10 left-0 w-full p-6 flex items-center justify-center",
        "from-card via-card/90 to-card/0"
      )}
    >
      <AnimatePresence>
        {connectionStatus === "Open" ? (
          <motion.div
            initial={{
              y: "100%",
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: "100%",
              opacity: 0,
            }}
            className={
              "p-2 sm:p-4 bg-card border border-border rounded-lg shadow-sm flex items-center gap-4"
            }
          >
            <Toggle
              pressed={!isMuted}
              onPressedChange={() => {
                if (isMuted) {
                  unmuteMicrophone();
                } else {
                  muteMicrophone();
                }
              }}
              className="rounded-full px-2"
              size={isMobile ? "sm" : "lg"}
            >
              {isMuted ? (
                <MicOff className={cn("size-7", isMobile ? "size-5" : "")} />
              ) : (
                <Mic className={cn("size-7", isMobile ? "size-5" : "")} />
              )}
            </Toggle>

            <div className="flex justify-center items-center">
              <Visualizer
                stream={microphoneStream || undefined}
                audioBuffer={audioBuffer || undefined}
              />
            </div>
            <Button
              className={cn(
                "flex items-center gap-1 rounded-full px-2",
                isMobile ? "px-2" : "px-2.5"
              )}
              onClick={() => {
                handleClickCloseConnection();
                // addSessionTime(
                //     callDurationTimestamp ?? "00:00:00",
                // );
              }}
              size={isMobile ? "sm" : "lg"}
              variant={"destructive"}
            >
              <Phone
                className={cn("size-6", isMobile ? "size-5" : "")}
                strokeWidth={2}
                stroke={"currentColor"}
              />
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ControlPanel;
