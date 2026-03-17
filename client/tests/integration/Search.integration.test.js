// Jabez Tho, A0273312N
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import SearchInput from "../../src/components/Form/SearchInput";
import Search from "../../src/pages/Search";
import { AuthProvider } from "../../src/context/auth";
import { SearchProvider, useSearch } from "../../src/context/search";

jest.mock("axios");

jest.mock("../../src/components/Layout", () => {
  return ({ children }) => <div data-testid="search-layout">{children}</div>;
});

const SearchEntry = () => (
  <div>
    <SearchInput />
  </div>
);

const SearchStateSeeder = ({ keyword = "", results = [] }) => {
  const [, setSearchState] = useSearch();

  React.useEffect(() => {
    setSearchState({ keyword, results });
  }, [keyword, results, setSearchState]);

  return null;
};

const renderInputFlow = () =>
  render(
    <AuthProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<SearchEntry />} />
            <Route path="/search" element={<div>Search destination</div>} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    </AuthProvider>
  );

const renderSearchPageWithSeededState = ({ keyword = "", results = [] }) =>
  render(
    <AuthProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={["/search"]}>
          <SearchStateSeeder keyword={keyword} results={results} />
          <Routes>
            <Route path="/search" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    </AuthProvider>
  );

const renderFullFlow = () =>
  render(
    <AuthProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<SearchEntry />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    </AuthProvider>
  );

describe("Search integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // seed auth state
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: {
          _id: "u1",
          name: "Authenticated User",
          email: "auth@test.com",
          phone: "1234567890",
          address: "Address",
          role: 0,
        },
        token: "auth-token",
      })
    );
  });

  it("should submit SearchInput to API request without auth", async () => {
    // Clear auth state to test unauthenticated flow
    localStorage.clear();
    axios.get.mockResolvedValueOnce({ data: [{ _id: "p1" }] });

    renderInputFlow();

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "laptop" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
    });
  });

  it("should submit SearchInput submit to API request and navigation with seeded auth", async () => {
    axios.get.mockResolvedValueOnce({ data: [{ _id: "p2" }] });

    renderInputFlow();

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "keyboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/keyboard");
    });

    await waitFor(() => {
      expect(screen.getByText("Search destination")).toBeInTheDocument();
    });
  });

  it("should render Search page from provider state", async () => {
    const seededResults = [
      {
        _id: "p10",
        name: "Seeded Product",
        description: "Preloaded search state for result rendering",
        price: 55,
      },
    ];

    renderSearchPageWithSeededState({
      keyword: "seeded",
      results: seededResults,
    });

    await waitFor(() => {
      expect(screen.getByText("Found 1")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Seeded Product")).toBeInTheDocument();
    });
  });

  it("should complete full flow from submit to rendered empty state", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderFullFlow();

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "no-match-keyword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/search/no-match-keyword"
      );
    });

    await waitFor(() => {
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });
  });
});
