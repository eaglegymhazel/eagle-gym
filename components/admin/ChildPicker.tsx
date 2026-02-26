"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Child } from "./mockChildren";

type ChildPickerProps = {
  children: Child[];
  onSelect: (child: Child) => void;
  placeholder?: string;
  recentChildren?: string[];
  maxResults?: number;
};

const PAGE_SIZE = 12;
type PageItem = number | "...";

function fullName(child: Child): string {
  return `${child.firstName} ${child.lastName}`;
}

function formatDob(dateOfBirth: string): string {
  if (!dateOfBirth) return "-";
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) return dateOfBirth;
  return date.toLocaleDateString("en-GB");
}

function highlightMatch(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const start = lowerText.indexOf(lowerQuery);

  if (start < 0) return text;

  const end = start + trimmed.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-[#efe3ff] px-0.5 text-[#3a1465]">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export default function ChildPicker({
  children,
  onSelect,
  placeholder = "Type a name (e.g., 'Olivia Smi')",
  recentChildren,
  maxResults = 16,
}: ChildPickerProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [page, setPage] = useState(1);

  const childById = useMemo(() => {
    return new Map(children.map((child) => [child.id, child]));
  }, [children]);

  const recentItems = useMemo(() => {
    if (recentChildren && recentChildren.length > 0) {
      return recentChildren
        .map((id) => childById.get(id))
        .filter((item): item is Child => !!item)
        .slice(0, 6);
    }
    return children.slice(0, 6);
  }, [childById, children, recentChildren]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const isLoading = debouncedQuery !== query;

  const filteredResults = useMemo(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (!trimmed) return [];

    // Swap this client filter with server-side search later when API is available.
    const scored = children
      .map((child) => {
        const first = child.firstName.toLowerCase();
        const last = child.lastName.toLowerCase();
        const normal = `${first} ${last}`;
        const reversed = `${last} ${first}`;

        if (!normal.includes(trimmed) && !reversed.includes(trimmed)) return null;

        const firstStarts = first.startsWith(trimmed);
        const firstIncludes = first.includes(trimmed);
        const lastStarts = last.startsWith(trimmed);
        const lastIncludes = last.includes(trimmed);

        const score = firstStarts
          ? 0
          : firstIncludes
            ? 1
            : lastStarts
              ? 2
              : lastIncludes
                ? 3
                : 4;

        return { child, score };
      })
      .filter((item): item is { child: Child; score: number } => !!item)
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        const firstNameCompare = a.child.firstName.localeCompare(b.child.firstName, undefined, {
          sensitivity: "base",
        });
        if (firstNameCompare !== 0) return firstNameCompare;
        return a.child.lastName.localeCompare(b.child.lastName, undefined, {
          sensitivity: "base",
        });
      });

    return scored
      .map((item) => item.child)
      .slice(0, maxResults);
  }, [children, debouncedQuery, maxResults]);

  const dropdownItems = query.trim() ? filteredResults : recentItems;
  const tableFilteredChildren = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return children;

    return children.filter((child) => {
      const normal = `${child.firstName} ${child.lastName}`.toLowerCase();
      const reversed = `${child.lastName} ${child.firstName}`.toLowerCase();
      return normal.includes(trimmed) || reversed.includes(trimmed);
    });
  }, [children, query]);

  const totalPages = Math.max(1, Math.ceil(tableFilteredChildren.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedChildren = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return tableFilteredChildren.slice(start, start + PAGE_SIZE);
  }, [currentPage, tableFilteredChildren]);
  const pageItems = useMemo<PageItem[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: PageItem[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) items.push("...");
    for (let value = start; value <= end; value += 1) {
      items.push(value);
    }
    if (end < totalPages - 1) items.push("...");

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const selectChild = (child: Child) => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setQuery(fullName(child));
    console.log(child);
    onSelect(child);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!dropdownItems.length || isLoading) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= dropdownItems.length ? 0 : next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        if (prev <= 0) return dropdownItems.length - 1;
        return prev - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < dropdownItems.length) {
        event.preventDefault();
        selectChild(dropdownItems[highlightedIndex]);
      }
    }
  };

  return (
    <>
    <div className="space-y-3">
      <div ref={rootRef} className="relative">
        <label
          htmlFor="child-picker-input"
          className="mb-1 block text-sm font-semibold tracking-[0.01em] text-[#2a203c]"
        >
          Find Student
        </label>
        <input
          ref={inputRef}
          id="child-picker-input"
          aria-label="Find child"
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
            setPage(1);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          className="h-10 w-full rounded-md border border-[#d9d1e5] bg-white px-3 text-sm text-[#1f1a25] outline-none transition focus:border-[#6e2ac0] focus:ring-2 focus:ring-[#6e2ac0]/20"
        />

        {isOpen ? (
          <div
            className="absolute z-30 mt-2 w-full rounded-xl border border-[#ddd5ea] bg-white p-2 shadow-[0_14px_28px_-22px_rgba(27,14,45,0.45)]"
          >
            <div
              id={listboxId}
              role="listbox"
              aria-label="Child search results"
              className="max-h-[360px] overflow-y-auto"
            >
              {!query.trim() ? (
                <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#7c6b98]">
                  Recent
                </p>
              ) : null}

              {isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`sk-${index}`}
                      className="h-14 animate-pulse rounded-xl bg-gradient-to-r from-[#f6f1fc] via-[#f1e9fb] to-[#f6f1fc]"
                    />
                  ))}
                </div>
              ) : dropdownItems.length === 0 ? (
                <p className="px-3 py-5 text-sm font-medium text-[#6f6188]">No children found</p>
              ) : (
                dropdownItems.map((child, index) => {
                  const active = highlightedIndex === index;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectChild(child)}
                      className={[
                        "relative mb-1 w-full rounded-lg border px-2 py-1.5 text-left transition",
                        active
                          ? "border-[#d2b6ef] bg-[#f7f1ff]"
                          : "border-transparent hover:border-[#eadcf9] hover:bg-[#fbf8ff]",
                      ].join(" ")}
                    >
                      {active ? (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#6e2ac0]" aria-hidden />
                      ) : null}
                      <div className="min-w-0 pr-2">
                        <p className="truncate text-sm font-bold leading-tight text-[#221833]">
                          {highlightMatch(fullName(child), query)}
                          <span className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-medium text-[#a196b4]">
                            <span
                              className={[
                                "h-1.5 w-1.5 rounded-full",
                                child.status === "Active" ? "bg-[#1d6a3e]" : "bg-[#8d2f48]",
                              ].join(" ")}
                              aria-hidden
                            />
                            {child.status}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-xs leading-tight text-[#655a79]">
                          Age {child.age} • DOB {formatDob(child.dateOfBirth)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#e6e0ee] pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#2a203c]">All Students</h3>
        </div>

        <div className="mb-0.5 hidden border-b border-[#ebe6f2] px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#615573] sm:grid sm:grid-cols-[minmax(0,1fr)_220px]">
          <span>Name</span>
          <span className="text-right">Recently attended</span>
        </div>

        <div>
          {pagedChildren.length === 0 ? (
            <div className="px-2 py-3 text-sm text-[#6d6281]">No children found.</div>
          ) : null}
          {pagedChildren.map((child) => {
            const currentClass =
              child.lastAttendedClass && child.lastAttendedClass.trim()
                ? child.lastAttendedClass
                : "—";
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => selectChild(child)}
                className={[
                  "group relative w-full cursor-pointer overflow-hidden border-b border-[#ede8f3] px-2 py-1.5 text-left transition last:border-b-0",
                  "bg-transparent",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="adminTintOverlay absolute inset-0 bg-[#f0e8fb]"
                />
                <span
                  aria-hidden
                  className={[
                    "absolute inset-y-1 left-0 z-[1] w-[2px] rounded-full transition-opacity",
                    "bg-[#6e2ac0] opacity-0 group-hover:opacity-75",
                  ].join(" ")}
                />
                <div className="relative z-[1] grid grid-cols-1 gap-1.5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold leading-tight text-[#221833]">
                      {fullName(child)}
                      <span className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-medium text-[#a196b4]">
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            child.status === "Active" ? "bg-[#1d6a3e]" : "bg-[#8d2f48]",
                          ].join(" ")}
                          aria-hidden
                        />
                        {child.status}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs leading-tight text-[#655a79]">
                      Age {child.age} • DOB {formatDob(child.dateOfBirth)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
                      <p className="truncate text-xs font-medium leading-tight text-[#4f4362]">
                        {currentClass}
                      </p>
                      <span className="inline-block text-[10px] leading-none text-[#7e7292] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-90">
                        &gt;
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <p className="mr-auto text-xs text-[#7b6d92]">
            Page {currentPage} of {totalPages}
            {query.trim() ? ` • ${tableFilteredChildren.length} match${tableFilteredChildren.length === 1 ? "" : "es"}` : ""}
          </p>
          <div className="flex items-center gap-1 text-xs">
            {pageItems.map((item, index) =>
              item === "..." ? (
                <span key={`ellipsis-${index}`} className="px-1 text-[#8d83a0]">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${item}`}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={item === currentPage ? "page" : undefined}
                  className={[
                    "cursor-pointer rounded-md font-medium transition",
                    item === currentPage
                      ? "min-w-7 bg-[#e5e1ec] px-2 py-1 text-xs text-[#2d243b]"
                      : "min-w-6 px-1.5 py-0.5 text-[11px] text-[#5e556d] hover:bg-[#e7e3ee]",
                  ].join(" ")}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
    <style jsx global>{`
      .adminTintOverlay {
        transform-origin: left;
        transform: scaleX(1);
        opacity: 0;
        transition: opacity 180ms ease-out;
        pointer-events: none;
      }
      .group:hover .adminTintOverlay {
        opacity: 1;
        transition-duration: 0ms;
        animation: adminTintWipeIn 280ms ease-out both;
      }
      @keyframes adminTintWipeIn {
        from {
          transform: scaleX(0);
        }
        to {
          transform: scaleX(1);
        }
      }
    `}</style>
    </>
  );
}

