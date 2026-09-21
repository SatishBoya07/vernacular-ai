'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TypingIndicator } from './TypingIndicator';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export const StreamingText: React.FC<StreamingTextProps> = ({ text, isStreaming }) => {
  if (!text && isStreaming) {
    return <TypingIndicator />;
  }

  return (
    <span className="whitespace-pre-wrap">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {text}
      </motion.span>
    </span>
  );
};

