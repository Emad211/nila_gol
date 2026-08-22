// Shared Framer Motion primitives — cohesive timing, RTL-aware, and every one
// degrades to a plain element when prefers-reduced-motion is set.
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import { Link } from 'react-router-dom';

export const EASE = [0.16, 1, 0.3, 1];
const MotionLink = motion.create(Link);

const offset = (dir, d = 26) => {
  if (dir === 'down') return { y: -d };
  if (dir === 'end') return { x: d };
  if (dir === 'start') return { x: -d };
  return { y: d };
};

// Fade + rise a block into view once. For headings, text, images, standalone blocks.
export function Reveal({ children, as = 'div', dir = 'up', delay = 0, amount = 0.2, duration = 0.6, className, ...rest }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return <Plain className={className} {...rest}>{children}</Plain>;
  }
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, ...offset(dir) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

const cardAnim = (index, reduce) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.18 },
        transition: { duration: 0.55, ease: EASE, delay: Math.min(index * 0.08, 0.45) },
        whileHover: { y: -6, transition: { duration: 0.2, ease: 'easeOut' } },
        whileTap: { scale: 0.985 },
      };

// A card that reveals on scroll (staggered by `index`) and springs up on hover.
// Use as the card root; remove any `transform` from the element's CSS :hover.
export function MotionCard({ children, index = 0, className, ...rest }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} {...cardAnim(index, reduce)} {...rest}>
      {children}
    </motion.div>
  );
}

// Same, but renders a react-router <Link> (pass `to`).
export function MotionLinkCard({ children, index = 0, className, to, ...rest }) {
  const reduce = useReducedMotion();
  return (
    <MotionLink to={to} className={className} {...cardAnim(index, reduce)} {...rest}>
      {children}
    </MotionLink>
  );
}

