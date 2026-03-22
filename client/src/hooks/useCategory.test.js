// Hans Delano, A0273456X
import React from "react";
import "@testing-library/jest-dom";
import { afterEach, describe } from "node:test";
import axios from "axios";
import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";

jest.mock("axios");

const mockCategories = [
  { _id: "1", name: "Electronics", slug: "electronics" },
  { _id: "2", name: "Books", slug: "books" },
];

describe("useCategory Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return categories", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: mockCategories,
      },
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });
  });

  it("should handle API errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("API Error"));

    renderHook(() => useCategory());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(new Error("API Error"));
    });
    consoleSpy.mockRestore();
  });
});
