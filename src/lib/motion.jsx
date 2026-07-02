// Shared Framer Motion primitives — cohesive timing, RTL-aware, and every one
// degrades to a plain element when prefers-reduced-motion is set.
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useInView,
  useMotionValue,
  animate,
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

// Container that staggers its <RevealItem> children in.
export function Stagger({ children, as = 'div', amount = 0.2, stagger = 0.09, delay = 0.05, className, ...rest }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return <Plain className={className} {...rest}>{children}</Plain>;
  }
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

const itemVariants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

export function RevealItem({ children, as = 'div', className, ...rest }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return <Plain className={className} {...rest}>{children}</Plain>;
  }
  return (
    <Comp className={className} variants={itemVariants} {...rest}>
      {children}
    </Comp>
  );
}

const faDigits = (s) => String(s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// Counts up to `to` when scrolled into view (Persian numerals).
export function CountUp({ to, prefix = '', suffix = '', duration = 1.6, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) { setV(to); return undefined; }
    const controls = animate(0, to, { duration, ease: EASE, onUpdate: (x) => setV(Math.round(x)) });
    return () => controls.stop();
  }, [inView, to, reduce, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}{faDigits(v)}{suffix}
    </span>
  );
}

// Thin gradient progress bar tied to page scroll (RTL: fills from the start/right edge).
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  if (reduce) return null;
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

// A CTA that drifts slightly toward the cursor (desktop pointer only).
export function MagneticButton({ children, as = 'a', className, strength = 0.3, ...rest }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  if (reduce) {
    const Plain = as === 'link' ? Link : as;
    return <Plain className={className} {...rest}>{children}</Plain>;
  }
  const Comp = as === 'link' ? MotionLink : motion[as] || motion.a;
  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <Comp ref={ref} className={className} style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={reset} {...rest}>
      {children}
    </Comp>
  );
}

// Subtle scroll parallax for decorative accents.
export function Parallax({ children, as = 'div', distance = 50, className, ...rest }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const Comp = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return <Plain className={className} {...rest}>{children}</Plain>;
  }
  return (
    <Comp ref={ref} className={className} style={{ y }} {...rest}>
      {children}
    </Comp>
  );
}
