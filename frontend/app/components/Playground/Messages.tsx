import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatAvatar from "../ChatAvatar";
import Expressions from "../Expressions";
import { cn, getMessageRoleName } from "@/lib/utils";
import MessageHeader from "./MessageHeader";
import LoadingAnimation from "./LoadingAnimation";

interface MessagesProps {
  messageHistory: any[];
  currentUser: IUser;
  personalityTranslation: IPersonalitiesTranslation;
  emotionDictionary: any;
}

export const Messages: React.FC<MessagesProps> = ({
  messageHistory,
  currentUser,
  emotionDictionary,
  personalityTranslation,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ref: any = useRef(null);

  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setIsScrolledToBottom(isAtBottom);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messageHistory, emotionDictionary, isScrolledToBottom]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return (
    <div
      className="flex-grow pb-6 mb-20 overflow-auto max-w-screen-md"
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      <ul className="space-y-2">
        <motion.div
          layoutScroll
          className={"grow rounded-md overflow-auto px-2 pb-4 md:px-2 w-full"}
          ref={ref}
        >
          <AnimatePresence mode={"popLayout"}>
            {messageHistory.length === 0 && (
              <LoadingAnimation isConnecting={true} />
            )}
            {messageHistory.map((msg, index) => {
              if (msg.type === "input" || msg.type === "response") {
                return (
                  <motion.div
                    key={msg.type + index}
                    className={cn(
                      "w-[80%]",
                      "bg-card",
                      "border border-border rounded-lg my-4",
                      msg.type === "input" ? "ml-auto" : ""
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 0 }}
                  >
                    <div className="flex flex-row gap-1 pt-3 pl-3">
                      <ChatAvatar
                        role={msg!.type}
                        user={currentUser}
                        personalityTranslation={personalityTranslation}
                      />
                      <div>
                        <div
                          className={cn(
                            "text-xs capitalize font-medium leading-none opacity-50 px-3"
                          )}
                        >
                          {getMessageRoleName(
                            msg!.type,
                            personalityTranslation
                          )}
                        </div>
                        <div className={"pb-3 px-3"}>{msg!.text_data}</div>
                      </div>
                    </div>
                    <Expressions
                      values={emotionDictionary[msg!.task_id]?.scores ?? {}}
                    />
                  </motion.div>
                );
              }
              return null;
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </motion.div>
      </ul>
    </div>
  );
};
