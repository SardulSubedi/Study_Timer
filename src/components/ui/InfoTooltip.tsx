import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface InfoTooltipProps {
  /** Short heading for the popover (defaults to no title). */
  title?: string;
  /** Body content — string or rich React content. */
  children: ReactNode;
  /** Accessible label for the trigger button (defaults to "More info"). */
  label?: string;
  /** Pixel width of the popover. Defaults to 240. */
  width?: number;
  /** "left" = align popover left edge with the trigger (default). "right" = align right edges (helps near the right edge of a card). */
  side?: 'right' | 'left';
}

export function InfoTooltip({
  title,
  children,
  label = 'More info',
  width = 240,
  side = 'left',
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 8;
    const gap = 6;
    // `top` is set so that after translateY(-100%) the bottom edge sits (rect.top - gap) px from viewport top
    const top = rect.top - gap;
    let left: number;
    if (side === 'right') {
      left = rect.right - width;
    } else {
      left = rect.left;
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    setCoords({ left, top });
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [open, width, side]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, width, side]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <span ref={rootRef} className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[0.6rem] font-semibold transition-colors ${
          open
            ? 'bg-indigo-500 text-white'
            : 'bg-slate-300/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-300'
        }`}
        aria-label={label}
        aria-expanded={open}
      >
        ?
      </button>
      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {open && coords && (
              <motion.div
                ref={popRef}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                role="tooltip"
                style={{
                  position: 'fixed',
                  left: coords.left,
                  top: coords.top,
                  width,
                  zIndex: 9999,
                  transform: 'translateY(-100%)',
                }}
                className="card p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200 normal-case font-normal tracking-normal shadow-glow"
              >
                {title && (
                  <div className="text-[0.7rem] font-semibold text-slate-900 dark:text-white mb-1">
                    {title}
                  </div>
                )}
                <div className="space-y-1.5">{children}</div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalTarget,
        )}
    </span>
  );
}

/**
 * Convenience wrapper to render a label with an inline InfoTooltip.
 * Use this for the standard "label + ?" pattern.
 */
export function LabelWithInfo({
  htmlFor,
  className = '',
  children,
  tooltip,
}: {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  tooltip: { title?: string; body: ReactNode; width?: number };
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="label !mb-0">
        {children}
      </label>
      <InfoTooltip title={tooltip.title} width={tooltip.width}>
        {tooltip.body}
      </InfoTooltip>
    </div>
  );
}
