'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
export type OptionValue = string | number;
export interface Option {
  value: OptionValue;
  label: string;
  disabled?: boolean;
}
export interface ComboboxProps {
  options?: readonly Option[];
  value?: OptionValue | null | readonly OptionValue[];
  defaultValue?: OptionValue | null | readonly OptionValue[];
  onChange?: (value: OptionValue | null | OptionValue[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  name?: string;
  loadOptions?: (
    query: string,
    options: {
      signal: AbortSignal;
    },
  ) => Promise<readonly Option[]>;
  debounce?: number;
  maxOptions?: number;
  maxSelected?: number;
  maxVisible?: number;
  renderOption?: (
    option: Option,
    state: {
      selected: boolean;
      active: boolean;
    },
  ) => ReactNode;
  className?: string;
}
export function Combobox({
  options = [],
  value: controlled,
  defaultValue = null,
  onChange,
  multiple = false,
  disabled = false,
  label = 'Choose an option',
  placeholder = 'Search',
  name,
  loadOptions,
  debounce = 200,
  maxOptions = 10000,
  maxSelected = 1000,
  maxVisible = 100,
  renderOption,
  className,
}: ComboboxProps) {
  if (
    ![maxOptions, maxSelected, maxVisible].every((value) => Number.isInteger(value) && value > 0) ||
    maxOptions > 10000 ||
    maxSelected > 1000 ||
    maxVisible > 1000 ||
    !Number.isFinite(debounce) ||
    debounce < 0 ||
    debounce > 5000
  )
    throw new RangeError('Invalid combobox limits.');
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled === undefined ? internal : controlled;
  const selected = Array.isArray(value) ? value : value === null ? [] : [value as OptionValue];
  if (selected.length > maxSelected) throw new RangeError('Too many selections.');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<readonly Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const loader = useRef(loadOptions);
  loader.current = loadOptions;
  const id = useId();
  const source = loadOptions ? remote : options;
  if (
    source.length > maxOptions ||
    new Set(source.map((option) => option.value)).size !== source.length
  )
    throw new RangeError('Option limit exceeded or duplicate option value.');
  const filtered = source
    .filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .slice(0, maxVisible);
  const enabled = filtered.filter((option) => !option.disabled);
  const current = enabled[Math.min(active, Math.max(0, enabled.length - 1))];
  useEffect(() => {
    if (!open || !loader.current) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let alive = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      Promise.resolve(loader.current!(query, { signal: controller.signal }))
        .then((result) => {
          if (!alive) return;
          if (result.length > maxOptions) throw new RangeError('Async option limit exceeded.');
          setRemote(result);
        })
        .catch((reason) => {
          if (alive && !controller.signal.aborted)
            setError(reason instanceof Error ? reason.message : String(reason));
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, debounce);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, debounce, maxOptions, Boolean(loadOptions)]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const choose = (option: Option) => {
    if (disabled || option.disabled) return;
    let next: OptionValue | OptionValue[] = option.value;
    if (multiple) {
      const values = new Set(selected);
      if (values.has(option.value)) values.delete(option.value);
      else {
        if (values.size >= maxSelected) {
          setError('Selection limit reached.');
          return;
        }
        values.add(option.value);
      }
      next = [...values];
    }
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
    setQuery('');
    if (!multiple) setOpen(false);
    field.current?.focus();
  };
  const activeIndex = current ? filtered.indexOf(current) : -1;
  const display =
    source.find((option) => option.value === selected[0])?.label ?? String(selected[0] ?? '');
  return (
    <div ref={root} className={className} style={{ position: 'relative', minWidth: 0 }}>
      <label htmlFor={`${id}-input`}>{label}</label>
      <input
        ref={field}
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        maxLength={256}
        value={open || multiple ? query : display}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.currentTarget.value.slice(0, 256));
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === 'Tab') setOpen(false);
          else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            setActive((previous) =>
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? Math.max(0, enabled.length - 1)
                  : enabled.length
                    ? (previous + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) %
                      enabled.length
                    : 0,
            );
          } else if (event.key === 'Enter' && open) {
            event.preventDefault();
            if (current) choose(current);
          }
        }}
        onBlur={(event) => {
          if (!root.current?.contains(event.relatedTarget as Node)) setOpen(false);
        }}
        style={{ width: '100%', boxSizing: 'border-box', font: 'inherit' }}
      />
      {multiple && selected.length > 0 && (
        <div aria-label="Selected options">
          {selected.map((item) => (
            <button
              type="button"
              key={`${typeof item}:${item}`}
              disabled={disabled}
              aria-label={`Remove ${source.find((option) => option.value === item)?.label ?? item}`}
              onClick={() => {
                const next = selected.filter((value) => value !== item);
                if (controlled === undefined) setInternal(next);
                onChange?.(next);
              }}
            >
              {source.find((option) => option.value === item)?.label ?? item} ×
            </button>
          ))}
        </div>
      )}
      {name &&
        selected.map((item) => (
          <input key={`${typeof item}:${item}`} type="hidden" name={name} value={String(item)} />
        ))}
      {open && (
        <div
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          aria-busy={loading || undefined}
          style={{
            position: 'absolute',
            zIndex: 10,
            maxHeight: 240,
            overflow: 'auto',
            width: '100%',
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid GrayText',
            boxSizing: 'border-box',
          }}
        >
          {filtered.map((option, index) => (
            <div
              key={`${typeof option.value}:${option.value}`}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={selected.includes(option.value)}
              aria-disabled={option.disabled || undefined}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => {
                if (!option.disabled) setActive(enabled.indexOf(option));
              }}
              onClick={() => choose(option)}
              style={{
                padding: 6,
                background: current === option ? 'Highlight' : undefined,
                color: current === option ? 'HighlightText' : undefined,
                opacity: option.disabled ? 0.5 : 1,
              }}
            >
              {renderOption
                ? renderOption(option, {
                    selected: selected.includes(option.value),
                    active: current === option,
                  })
                : option.label}
            </div>
          ))}
        </div>
      )}
      {open && !filtered.length && !loading && <p role="status">No options</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export default Combobox;
