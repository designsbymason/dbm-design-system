import { useEffect, useRef, useState } from "react";
import { Combobox } from "./Combobox";
import type { ComboboxOption, ComboboxProps } from "./Combobox.types";

/** Countries every gallery story chooses from, so the stories differ only in what they set on the field. */
export const countries: ComboboxOption[] = [
  { value: "ar", label: "Argentina" },
  { value: "au", label: "Australia" },
  { value: "br", label: "Brazil" },
  { value: "ca", label: "Canada" },
  { value: "cl", label: "Chile" },
  { value: "cu", label: "Curaçao" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "in", label: "India" },
  { value: "jp", label: "Japan" },
  { value: "mx", label: "Mexico" },
  { value: "nz", label: "New Zealand" },
  { value: "no", label: "Norway" },
  { value: "es", label: "Spain" },
  { value: "se", label: "Sweden" },
  { value: "gb", label: "United Kingdom", keywords: ["UK", "Britain"] },
  { value: "us", label: "United States", keywords: ["USA", "America"] },
  { value: "uy", label: "Uruguay" },
];

/** Options in groups, some with a description or a reason for being unavailable. */
export const plans: ComboboxOption[] = [
  { value: "free", label: "Free", description: "For trying things out", group: "Personal" },
  { value: "plus", label: "Plus", description: "For one person, every day", group: "Personal" },
  { value: "team", label: "Team", description: "Shared projects and roles", group: "Work" },
  { value: "business", label: "Business", description: "Single sign-on and audit logs", group: "Work" },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Contact sales",
    group: "Work",
    disabled: "Available on request",
  },
];

/** A list long enough to be drawn a window at a time. */
export const manyOptions: ComboboxOption[] = Array.from({ length: 2000 }, (_, index) => ({
  value: `item-${index + 1}`,
  label: `Item ${index + 1}`,
}));

/**
 * A field that fetches as the person types, for the async story: a stand-in server answers after a short delay, a
 * reply to an older search is thrown away, and a pick doesn't start a search.
 */
export function SearchingCombobox(props: Partial<ComboboxProps>) {
  const [results, setResults] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const search = (text: string, reason: string) => {
    if (reason !== "input") return;
    window.clearTimeout(timer.current);
    const request = latest.current + 1;
    latest.current = request;
    if (text.trim() === "") {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      if (request !== latest.current) return;
      setResults(countries.filter((country) => country.label.toLowerCase().includes(text.trim().toLowerCase())));
      setLoading(false);
    }, 600);
  };

  return (
    <Combobox
      aria-label="Search countries"
      placeholder="Search countries"
      {...props}
      options={results}
      filter={false}
      loading={loading}
      onInputValueChange={search}
    />
  );
}
