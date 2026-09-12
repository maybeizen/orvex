import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectMenuOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  hint?: string;
};

export type SelectMenuProps<T extends string = string> = {
  id?: string;
  name?: string;
  value: T | null;
  onValueChange: (value: T) => void;
  options: readonly SelectMenuOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  labelledBy?: string;
  searchable?: boolean;
  searchThreshold?: number;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const TYPEAHEAD_MS = 700;
const SEARCH_THRESHOLD = 8;
const MENU_GAP = 4;

type MenuPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
};

function isTypeaheadKey(event: KeyboardEvent<HTMLElement>): boolean {
  return (
    event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
  );
}

function nextEnabledIndex<T extends string>(
  options: readonly SelectMenuOption<T>[],
  from: number,
  direction: 1 | -1,
): number {
  if (options.length === 0) {
    return -1;
  }

  let index = from;
  for (let step = 0; step < options.length; step += 1) {
    index = (index + direction + options.length) % options.length;
    if (options[index]?.disabled !== true) {
      return index;
    }
  }

  return -1;
}

function firstEnabledIndex<T extends string>(
  options: readonly SelectMenuOption<T>[],
): number {
  return options.findIndex((option) => option.disabled !== true);
}

function lastEnabledIndex<T extends string>(
  options: readonly SelectMenuOption<T>[],
): number {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (options[index]?.disabled !== true) {
      return index;
    }
  }
  return -1;
}

function measureMenu(trigger: HTMLElement): MenuPos {
  const rect = trigger.getBoundingClientRect();
  const width = Math.max(rect.width, 176);
  const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - 8;
  const spaceAbove = rect.top - MENU_GAP - 8;
  const placement =
    spaceBelow < 160 && spaceAbove > spaceBelow ? "top" : "bottom";
  const maxHeight = Math.min(
    280,
    Math.max(120, placement === "bottom" ? spaceBelow : spaceAbove),
  );
  const top =
    placement === "bottom"
      ? rect.bottom + MENU_GAP
      : rect.top - MENU_GAP - maxHeight;

  return {
    top,
    left: Math.min(rect.left, window.innerWidth - width - 8),
    width,
    maxHeight,
    placement,
  };
}

export function SelectMenu<T extends string = string>({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder = "Select",
  disabled = false,
  error = false,
  labelledBy,
  searchable,
  searchThreshold = SEARCH_THRESHOLD,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectMenuProps<T>) {
  const reactId = useId();
  const listId = `${reactId}-list`;
  const searchId = `${reactId}-search`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const typeaheadRef = useRef("");
  const typeaheadTimer = useRef<number>(0);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [active, setActive] = useState(-1);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const enableSearch = searchable ?? options.length >= searchThreshold;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!enableSearch || needle.length === 0) {
      return options;
    }
    return options.filter((option) => {
      return (
        option.label.toLowerCase().includes(needle) ||
        option.value.toLowerCase().includes(needle)
      );
    });
  }, [enableSearch, options, query]);

  const labelled = ariaLabelledBy ?? labelledBy;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    window.clearTimeout(typeaheadTimer.current);
    typeaheadRef.current = "";
  }, []);

  const openMenu = useCallback(
    (index?: number) => {
      if (disabled) {
        return;
      }
      const trigger = triggerRef.current;
      if (trigger === null) {
        return;
      }
      const selectedIndex = visible.findIndex(
        (option) => option.value === value,
      );
      const next =
        index ??
        (selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(visible));
      setPos(measureMenu(trigger));
      setActive(next);
      setOpen(true);
    },
    [disabled, value, visible],
  );

  const choose = useCallback(
    (option: SelectMenuOption<T>) => {
      if (option.disabled === true) {
        return;
      }
      onValueChange(option.value);
      close();
      triggerRef.current?.focus();
    },
    [close, onValueChange],
  );

  const applyTypeahead = useCallback(
    (key: string) => {
      window.clearTimeout(typeaheadTimer.current);
      typeaheadRef.current = `${typeaheadRef.current}${key.toLowerCase()}`;
      const needle = typeaheadRef.current;
      const match = visible.findIndex(
        (option) =>
          option.disabled !== true &&
          option.label.toLowerCase().startsWith(needle),
      );
      if (match >= 0) {
        setActive(match);
        if (!open) {
          openMenu(match);
        }
      }
      typeaheadTimer.current = window.setTimeout(() => {
        typeaheadRef.current = "";
      }, TYPEAHEAD_MS);
    },
    [open, openMenu, visible],
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const trigger = triggerRef.current;
    if (trigger === null) {
      return;
    }

    const update = (): void => {
      setPos(measureMenu(trigger));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (triggerRef.current?.contains(target) === true) {
        return;
      }
      if (menuRef.current?.contains(target) === true) {
        return;
      }
      close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const node = optionRefs.current[active];
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (enableSearch) {
      searchRef.current?.focus();
      return;
    }
    menuRef.current?.focus();
  }, [enableSearch, open]);

  useEffect(() => {
    return () => {
      window.clearTimeout(typeaheadTimer.current);
    };
  }, []);

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => nextEnabledIndex(visible, current, direction));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const option = visible[active];
      if (option !== undefined) {
        choose(option);
      }
      return;
    }

    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        close();
      }
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      if (!open) {
        openMenu(firstEnabledIndex(visible));
        return;
      }
      setActive(firstEnabledIndex(visible));
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      if (!open) {
        openMenu(lastEnabledIndex(visible));
        return;
      }
      setActive(lastEnabledIndex(visible));
      return;
    }

    if (isTypeaheadKey(event) && !enableSearch) {
      event.preventDefault();
      applyTypeahead(event.key);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => nextEnabledIndex(visible, current, direction));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActive(firstEnabledIndex(visible));
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActive(lastEnabledIndex(visible));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = visible[active];
      if (option !== undefined) {
        choose(option);
      }
      return;
    }

    if (event.key === " " && event.target === menuRef.current) {
      event.preventDefault();
      const option = visible[active];
      if (option !== undefined) {
        choose(option);
      }
      return;
    }

    if (event.key === "Tab") {
      close();
    }

    if (isTypeaheadKey(event) && !enableSearch) {
      event.preventDefault();
      applyTypeahead(event.key);
    }
  }

  function onOptionPointer(event: ReactPointerEvent<HTMLDivElement>): void {
    event.preventDefault();
  }

  const activeOption = visible[active];
  const activeId =
    activeOption === undefined ? undefined : `${listId}-${activeOption.value}`;

  const menu =
    open && pos !== null && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            tabIndex={enableSearch ? -1 : 0}
            aria-labelledby={labelled}
            aria-label={labelled === undefined ? ariaLabel : undefined}
            aria-activedescendant={activeId}
            data-slot="select-menu-list"
            onKeyDown={onMenuKeyDown}
            style={
              {
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxHeight: pos.maxHeight,
              } satisfies CSSProperties
            }
            className="fixed z-50 flex flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-none outline-none"
          >
            {enableSearch ? (
              <div className="border-b border-border p-1.5">
                <input
                  ref={searchRef}
                  id={searchId}
                  type="search"
                  value={query}
                  placeholder="Filter"
                  aria-label="Filter options"
                  autoComplete="off"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      const direction = event.key === "ArrowDown" ? 1 : -1;
                      setActive((current) =>
                        nextEnabledIndex(visible, current, direction),
                      );
                    }
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const option = visible[active];
                      if (option !== undefined) {
                        choose(option);
                      }
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      close();
                      triggerRef.current?.focus();
                    }
                  }}
                  className="h-7 w-full rounded-md border border-input bg-background px-2 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              {visible.length === 0 ? (
                <p className="px-2 py-1.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  No matches
                </p>
              ) : (
                visible.map((option, index) => {
                  const selectedOption = option.value === value;
                  const activeOptionRow = index === active;
                  return (
                    <div
                      key={option.value}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      id={`${listId}-${option.value}`}
                      role="option"
                      aria-selected={selectedOption}
                      aria-disabled={option.disabled === true || undefined}
                      tabIndex={-1}
                      data-active={activeOptionRow || undefined}
                      onPointerDown={onOptionPointer}
                      onClick={() => {
                        choose(option);
                      }}
                      onMouseEnter={() => {
                        if (option.disabled !== true) {
                          setActive(index);
                        }
                      }}
                      className={cn(
                        "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none",
                        option.disabled === true &&
                          "pointer-events-none opacity-40",
                        activeOptionRow &&
                          option.disabled !== true &&
                          "bg-accent text-accent-foreground",
                        selectedOption && "text-primary",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      {option.hint === undefined ? null : (
                        <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                          {option.hint}
                        </span>
                      )}
                      <Check
                        aria-hidden
                        className={cn(
                          "size-3.5 shrink-0",
                          selectedOption ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative min-w-0", className)}>
      {name === undefined ? null : (
        <input type="hidden" name={name} value={value ?? ""} />
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-invalid={error || undefined}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        aria-labelledby={labelled}
        disabled={disabled}
        data-slot="select-menu-trigger"
        data-state={open ? "open" : "closed"}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          openMenu();
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-left text-sm text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 ease-out outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
          error &&
            "border-destructive ring-2 ring-destructive/25 focus-visible:border-destructive focus-visible:ring-destructive/25",
          open && "border-ring",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            selected === null && "text-muted-foreground",
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />
      </button>
      {menu}
    </div>
  );
}
