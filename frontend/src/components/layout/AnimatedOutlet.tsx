import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useLocation, Outlet } from 'react-router-dom';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -12,
  },
};

const pageTransition: Transition = {
  duration: 0.25,
  ease: 'easeOut',
};

export default function AnimatedOutlet() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        animate="animate"
        exit="exit"
        initial="initial"
        transition={pageTransition}
        variants={pageVariants}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
