'use client';

import { X } from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';

type Props = {
  /** Renders the button that opens the dialog. */
  trigger: (open: () => void) => ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  closeLabel: string;
  /** Called with a `close` function so forms can close the dialog when they finish. */
  children: (close: () => void) => ReactNode;
};

/** Native <dialog> modal: focus trap, Esc to close and backdrop come from the browser. */
export function Dialog({ trigger, title, description, icon, closeLabel, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  // Re-mount the body on each open so forms start clean.
  const [session, setSession] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    setSession((s) => s + 1);
    setIsOpen(true);
    ref.current?.showModal();
  }

  function close() {
    ref.current?.close();
  }

  return (
    <>
      {trigger(open)}
      <dialog
        ref={ref}
        className="dialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onClose={() => setIsOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="dialog-head">
          {icon && <span className="dialog-icon">{icon}</span>}
          <div>
            <h2 id={titleId} className="dialog-title">
              {title}
            </h2>
            {description && (
              <p id={descId} className="dialog-desc">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="icon-btn dialog-close" onClick={close} aria-label={closeLabel}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="dialog-body">{isOpen && <div key={session}>{children(close)}</div>}</div>
      </dialog>
    </>
  );
}
