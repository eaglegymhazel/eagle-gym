"use client";

import { useEffect, useRef } from "react";
import styles from "../account.module.css";

type ChildSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (child: ChildSummary) => void;
  childOptions: ChildSummary[];
};

export default function ChildSelectModal({
  isOpen,
  onClose,
  onSelect,
  childOptions,
}: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const items = modalRef.current
          ? Array.from(
              modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], [tabindex]:not([tabindex="-1"])'
              )
            )
          : [];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <button
        type="button"
        className={styles.modalBackdrop}
        onClick={onClose}
        aria-label="Close"
      />
      <div className={styles.modalCard} ref={modalRef}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Select a child to book</h3>
            <p className={styles.modalSubtitle}>
              Choose who you want to book a class for.
            </p>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            ref={closeRef}
            aria-label="Close"
          >
            {"\u00D7"}
          </button>
        </div>
        <div className={styles.modalBody}>
          <ul className={styles.modalList}>
            {childOptions.map((child) => {
              return (
                <li key={child.id}>
                  <button
                    type="button"
                    className={styles.modalRow}
                    onClick={() => onSelect(child)}
                  >
                    <span className={styles.modalRowMain}>
                      <span className={styles.modalRowName}>
                        {(child.firstName ?? "").trim() || "-"}{" "}
                        {(child.lastName ?? "").trim()}
                      </span>
                    </span>
                    <span className={styles.modalRowRight}>
                      <span className={styles.chevron} aria-hidden="true">
                        {"\u203A"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
