import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Clock, CornerDownLeft, Sparkles } from 'lucide-react';

export interface AutocompleteItem {
  id: string;
  label: string;
  category?: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  metadata?: any;
  onSelect?: () => void;
}

export interface AutocompleteGroup {
  category: string;
  icon?: React.ReactNode;
  items: AutocompleteItem[];
}

export interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: AutocompleteItem) => void;
  placeholder?: string;
  items?: AutocompleteItem[];
  groups?: AutocompleteGroup[];
  recentStorageKey?: string;
  maxRecent?: number;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  autoFocus?: boolean;
  shortcutHint?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search...',
  items = [],
  groups,
  recentStorageKey,
  maxRecent = 5,
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  autoFocus = false,
  shortcutHint,
  onFocus,
  onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (!recentStorageKey) return;
    try {
      const stored = localStorage.getItem(`autocomplete_recent_${recentStorageKey}`);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore storage error
    }
  }, [recentStorageKey]);

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!recentStorageKey || !trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, maxRecent);
      setRecentSearches(updated);
      localStorage.setItem(`autocomplete_recent_${recentStorageKey}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (!recentStorageKey) return;
    try {
      const updated = recentSearches.filter(s => s !== text);
      setRecentSearches(updated);
      localStorage.setItem(`autocomplete_recent_${recentStorageKey}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recentStorageKey) return;
    try {
      setRecentSearches([]);
      localStorage.removeItem(`autocomplete_recent_${recentStorageKey}`);
    } catch {
      // ignore
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter or group items
  const flattenedSuggestions = useMemo(() => {
    const list: AutocompleteItem[] = [];

    if (groups && groups.length > 0) {
      groups.forEach(g => {
        g.items.forEach(item => {
          list.push({ ...item, category: item.category || g.category });
        });
      });
    } else {
      list.push(...items);
    }

    return list;
  }, [items, groups]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < flattenedSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : flattenedSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < flattenedSuggestions.length) {
        handleSelectItem(flattenedSuggestions[highlightedIndex]);
      } else if (value.trim()) {
        saveRecentSearch(value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectItem = (item: AutocompleteItem) => {
    onChange(item.label);
    saveRecentSearch(item.label);
    if (item.onSelect) {
      item.onSelect();
    }
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
  };

  const handleRecentClick = (text: string) => {
    onChange(text);
    saveRecentSearch(text);
    setIsOpen(false);
  };

  // Helper to highlight matching letters in search text
  const renderHighlighted = (text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;

    return (
      <>
        {text.substring(0, idx)}
        <span className="font-bold underline text-[var(--accent)] decoration-[var(--accent)]">
          {text.substring(idx, idx + q.length)}
        </span>
        {text.substring(idx + q.length)}
      </>
    );
  };

  // Group items for display
  const displayGroups = useMemo<AutocompleteGroup[]>(() => {
    if (groups && groups.length > 0) {
      return groups.filter(g => g.items.length > 0);
    }
    if (items.length > 0) {
      const grouped: { [key: string]: AutocompleteItem[] } = {};
      items.forEach(item => {
        const cat = item.category || 'Suggestions';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });
      return Object.entries(grouped).map(([category, catItems]) => ({
        category,
        items: catItems,
      }));
    }
    return [];
  }, [groups, items]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field Container */}
      <div className="relative flex items-center w-full">
        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            onFocus?.();
          }}
          onBlur={() => {
            onBlur?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`h-8 w-full bg-[var(--bg-section-alt)] border border-transparent focus:border-[var(--border-strong)] rounded-md pl-8 pr-12 text-xs font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] transition outline-none ${inputClassName}`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : shortcutHint ? (
            <span className="pointer-events-none px-1 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[9px] font-mono text-[var(--text-muted)]">
              {shortcutHint}
            </span>
          ) : null}
        </div>
      </div>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden max-h-[380px] flex flex-col backdrop-blur-md ${dropdownClassName}`}
          style={{ minWidth: '280px' }}
        >
          <div className="overflow-y-auto flex-1 divide-y divide-[var(--border-hairline)] scrollbar-thin">
            {/* Recent Searches Section (when query is empty or partially matching) */}
            {recentStorageKey && recentSearches.length > 0 && !value && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase font-mono font-medium text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Recent Searches
                  </span>
                  <button
                    onClick={clearAllRecent}
                    className="hover:text-[var(--text-primary)] hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 px-1">
                  {recentSearches.map((term, i) => (
                    <span
                      key={i}
                      onClick={() => handleRecentClick(term)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition border border-[var(--border-subtle)]"
                    >
                      <span>{term}</span>
                      <button
                        onClick={e => removeRecentSearch(e, term)}
                        className="opacity-50 hover:opacity-100 hover:text-[var(--bearish)] cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions Groups */}
            {displayGroups.length > 0 ? (
              displayGroups.map((group, gIdx) => (
                <div key={gIdx} className="py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-mono font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                    {group.icon}
                    <span>{group.category}</span>
                  </div>
                  <div className="space-y-0.5 px-1">
                    {group.items.map(item => {
                      const itemIndex = flattenedSuggestions.findIndex(it => it.id === item.id);
                      const isHighlighted = itemIndex === highlightedIndex;

                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHighlightedIndex(itemIndex)}
                          onClick={() => handleSelectItem(item)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs ${
                            isHighlighted
                              ? 'bg-[var(--active-bg)] text-[var(--active-text)] font-medium'
                              : 'text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.icon && (
                              <span className="shrink-0 text-[var(--text-muted)]">
                                {item.icon}
                              </span>
                            )}
                            <div className="truncate">
                              <span className="font-mono text-xs">
                                {renderHighlighted(item.label, value)}
                              </span>
                              {item.description && (
                                <span className="ml-2 text-[11px] text-[var(--text-muted)] truncate font-sans">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {item.badge && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-mono border"
                                style={{
                                  backgroundColor: item.badgeColor ? `${item.badgeColor}15` : 'var(--bg-section-alt)',
                                  borderColor: item.badgeColor ? `${item.badgeColor}40` : 'var(--border-subtle)',
                                  color: item.badgeColor || 'var(--text-muted)',
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                            {isHighlighted && (
                              <CornerDownLeft className="w-3 h-3 text-[var(--text-muted)]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : value ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                No matching results for &ldquo;<span className="text-[var(--text-primary)] font-medium">{value}</span>&rdquo;
                <div className="mt-1 text-[11px] opacity-75">Press Enter to search entire wire anyway</div>
              </div>
            ) : null}
          </div>

          {/* Footer Guide */}
          <div className="px-3 py-1.5 bg-[var(--bg-canvas)] border-t border-[var(--border-hairline)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--accent)]">
              <Sparkles className="w-3 h-3" />
              <span>Smart Search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
