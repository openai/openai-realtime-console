import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatAvatar from "../ChatAvatar";
import Expressions from "../Expressions";
import { cn, getMessageRoleName } from "@/lib/utils";
import MessageHeader from "./MessageHeader";
import LoadingAnimation from "./LoadingAnimation";

interface MessagesProps {
  currentUser: IUser;
}

export const Messages: React.FC<MessagesProps> = ({
  currentUser,
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
      <LoadingAnimation isConnecting={true} />
    </div>
  );
};
