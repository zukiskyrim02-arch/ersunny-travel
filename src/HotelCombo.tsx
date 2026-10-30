import { useEffect, useMemo, useRef, useState } from "react";

type HotelComboProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  required?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

function sortedUnique(options: string[]): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of options) {
    const name = item.replace(/\s+/g, " ").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(name);
  }
  return list.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function HotelCombo({
  id,
  label,
  placeholder,
  value,
  options,
  required = false,
  className = "",
  onChange,
}: HotelComboProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hotels = useMemo(() => sortedUnique(options), [options]);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return hotels.slice(0, 8);
    return hotels.filter((h) => h.toLowerCase().includes(q)).slice(0, 8);
  }, [value, hotels]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div
      className={`field hotel-combo${className ? ` ${className}` : ""}`}
      ref={wrapRef}
    >
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        role="combobox"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        required={required}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && matches.length > 0 && (
        <ul id={`${id}-list`} className="hotel-combo__list" role="listbox">
          {matches.map((h) => (
            <li key={h}>
              <button
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(h);
                  setOpen(false);
                }}
              >
                {h}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function sortPlaces(options: string[]): string[] {
  return sortedUnique(options);
}
