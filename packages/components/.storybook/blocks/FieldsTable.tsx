import type { ReactNode } from "react";
import { propName, renderInline } from "./PropertiesTable";

export interface FieldRow {
  /** The field's name. */
  name: string;
  /** Marks the field as required, as the Properties table does. */
  required?: boolean;
  /** The literal values the field accepts, drawn as pills like the Properties table's Value options. */
  options?: ReadonlyArray<string>;
  /** What the field does; `` `code` `` spans are drawn as code. */
  description: string;
  /** The field's default, drawn as code. */
  defaultValue?: string;
}

const dash: ReactNode = <span className="dbm-proptable-empty">—</span>;

/**
 * The fields of a plain object a component takes (a `DataTable` column), in the same table as a Properties table: same columns, same
 * stripes, same name, option and default cells. `<PropertiesTable>` reads a component's argTypes, and an object's fields are not a
 * component's props, so this takes the rows directly. Not part of the published package.
 */
export function FieldsTable({ rows }: { rows: FieldRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="dbm-proptable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value options</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const shownName = propName(row.name);
            return (
              <tr key={row.name}>
                <td>
                  <code className={shownName.className || undefined}>{shownName.content}</code>
                  {row.required && (
                    <span className="dbm-proptable-required" title="Required">
                      *
                    </span>
                  )}
                </td>
                <td>
                  {row.options && row.options.length > 0 ? (
                    <span className="dbm-proptable-options">
                      {row.options.map((option) => (
                        <code key={option}>{option}</code>
                      ))}
                    </span>
                  ) : (
                    dash
                  )}
                </td>
                <td>{renderInline(row.description)}</td>
                <td>{row.defaultValue ? <code>{row.defaultValue}</code> : dash}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
