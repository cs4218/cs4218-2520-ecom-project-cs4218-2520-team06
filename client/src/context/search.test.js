// Jabez Tho, A0273312N
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

describe("useSearch hook", () => {
  test("initializes with empty keyword and results", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    const [searchState, setSearchState] = result.current;

    expect(searchState.keyword).toBe("");
    expect(searchState.results).toEqual([]);
    expect(typeof setSearchState).toBe("function");
  });

  test("updates search state via setter", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    act(() => {
      const [, setSearchState] = result.current;
      setSearchState({ keyword: "a", results: [{ _id: "1" }] });
    });

    const [searchState] = result.current;
    expect(searchState.keyword).toBe("a");
    expect(searchState.results).toHaveLength(1);
  });
});
