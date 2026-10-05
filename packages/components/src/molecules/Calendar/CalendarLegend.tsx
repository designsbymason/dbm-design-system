import { cx } from "@dbm-design-system/primitives";
import styles from "./Calendar.module.css";

/** One line of the key: a sample of a look and its words. */
export interface CalendarLegendItem {
  key: string;
  text: string;
  /** The class that draws the sample the way the look is drawn in the grid. */
  swatch: string | undefined;
}

/**
 * The key under a calendar (`showLegend`): small shapes drawn the way the grid draws each look, each with its words.
 * A list, with its roles stated outright: Safari with VoiceOver stops treating a list as one once its markers are
 * removed, as it does the other lists in this library.
 */
export function CalendarLegend({ label, items }: { label: string; items: CalendarLegendItem[] }) {
  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
    <ul className={styles.legend} role="list" aria-label={label}>
      {items.map(({ key, text, swatch }) => (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
        <li key={key} className={styles.legendItem} role="listitem">
          <span className={cx(styles.swatch, swatch)} aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  );
}
