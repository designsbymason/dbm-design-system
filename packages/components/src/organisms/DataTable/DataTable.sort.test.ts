import { describe, expect, it } from "vitest";
import { compareValues, directionOf, nextDirection, sortRows } from "./DataTable.sort";

interface Person {
  name: string;
  age: number | null;
}

const people: Person[] = [
  { name: "Cy", age: 30 },
  { name: "Ada", age: null },
  { name: "Bo", age: 25 },
  { name: "Di", age: 25 },
];
const columns = [
  { id: "name", accessor: (row: Person) => row.name },
  { id: "age", accessor: (row: Person) => row.age },
];
const names = (rows: Person[]) => rows.map((row) => row.name);

describe("sortRows", () => {
  it("orders ascending and descending without changing the input", () => {
    const input = [...people];
    expect(names(sortRows(people, [{ columnId: "name", direction: "ascending" }], columns))).toEqual(["Ada", "Bo", "Cy", "Di"]);
    expect(names(sortRows(people, [{ columnId: "name", direction: "descending" }], columns))).toEqual(["Di", "Cy", "Bo", "Ada"]);
    expect(people).toEqual(input);
  });

  it("keeps rows that tie in their original order, in both directions", () => {
    expect(names(sortRows(people, [{ columnId: "age", direction: "ascending" }], columns))).toEqual(["Bo", "Di", "Cy", "Ada"]);
    expect(names(sortRows(people, [{ columnId: "age", direction: "descending" }], columns))).toEqual(["Cy", "Bo", "Di", "Ada"]);
  });

  it("puts an empty value last whichever way the column is sorted", () => {
    expect(names(sortRows(people, [{ columnId: "age", direction: "ascending" }], columns)).at(-1)).toBe("Ada");
    expect(names(sortRows(people, [{ columnId: "age", direction: "descending" }], columns)).at(-1)).toBe("Ada");
  });

  it("orders by each column in turn", () => {
    const sorted = sortRows(
      people,
      [
        { columnId: "age", direction: "ascending" },
        { columnId: "name", direction: "descending" },
      ],
      columns,
    );
    expect(names(sorted)).toEqual(["Di", "Bo", "Cy", "Ada"]);
  });

  it("uses a column's own compare, flipped when descending", () => {
    const byLength = [{ id: "name", compare: (a: Person, b: Person) => a.name.length - b.name.length || a.name.localeCompare(b.name) }];
    expect(names(sortRows(people, [{ columnId: "name", direction: "ascending" }], byLength))).toEqual(["Bo", "Cy", "Di", "Ada"]);
    expect(names(sortRows(people, [{ columnId: "name", direction: "descending" }], byLength))).toEqual(["Ada", "Di", "Cy", "Bo"]);
  });

  it("ignores a sort naming a column that is not there, and an empty sort", () => {
    expect(sortRows(people, [{ columnId: "nope", direction: "ascending" }], columns)).toEqual(people);
    expect(sortRows(people, [], columns)).toEqual(people);
  });
});

describe("compareValues", () => {
  it("orders numbers, dates, booleans and text naturally", () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues(new Date(2020, 0, 1), new Date(2021, 0, 1))).toBeLessThan(0);
    expect(compareValues(false, true)).toBeLessThan(0);
    expect(compareValues("item 2", "item 10")).toBeLessThan(0);
    expect(compareValues("apple", "Banana")).toBeLessThan(0);
    expect(compareValues(1n, 2n)).toBeLessThan(0);
  });
});

describe("nextDirection and directionOf", () => {
  it("cycles none, ascending, descending, none", () => {
    expect(nextDirection(undefined)).toBe("ascending");
    expect(nextDirection("ascending")).toBe("descending");
    expect(nextDirection("descending")).toBeUndefined();
  });

  it("reads a column's direction from a sort", () => {
    expect(directionOf([{ columnId: "a", direction: "descending" }], "a")).toBe("descending");
    expect(directionOf([], "a")).toBeUndefined();
  });
});
