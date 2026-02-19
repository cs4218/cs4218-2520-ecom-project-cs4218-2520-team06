import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import SearchInput from "./SearchInput";
import { useSearch } from "../../context/search";

jest.mock("axios");
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(),
}));
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

const { useNavigate } = require("react-router-dom");

describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates keyword on input change", () => {
    const setSearchState = jest.fn();
    useSearch.mockReturnValue([{ keyword: "", results: [] }, setSearchState]);
    render(<SearchInput />);

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "shoe" },
    });

    expect(setSearchState).toHaveBeenCalledWith({
      keyword: "shoe",
      results: [],
    });
  });

  test("submits search and navigates on non-empty keyword", async () => {
    const setSearchState = jest.fn();
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useSearch.mockReturnValue([
      { keyword: "shoe", results: [] },
      setSearchState,
    ]);
    axios.get.mockResolvedValue({ data: [{ _id: "1" }] });
    render(<SearchInput />);

    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/shoe");
    });
    await waitFor(() => {
      expect(setSearchState).toHaveBeenCalledWith({
        keyword: "shoe",
        results: [{ _id: "1" }],
      });
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/search");
    });
  });

  test("does not submits search when keyword is empty", async () => {
    const setSearchState = jest.fn();
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    // Equivalence partition of empty keyword: empty string, string with only spaces
    useSearch.mockReturnValue([
      { keyword: "    ", results: [] },
      setSearchState,
    ]);
    axios.get.mockResolvedValue({ data: [] });
    render(<SearchInput />);

    fireEvent.submit(screen.getByRole("search"));

    expect(screen.getByRole("button", { name: /search/i })).toBeDisabled();
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
