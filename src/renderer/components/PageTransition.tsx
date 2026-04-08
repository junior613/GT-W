import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

// Animation variants with bounce/deceleration effect
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: -30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}