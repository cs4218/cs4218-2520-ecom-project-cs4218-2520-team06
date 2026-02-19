import React from "react";
import { useState, useContext, createContext } from "react";

const SearchContext = createContext();
const SearchProvider = ({ children }) => {
  const [searchState, setSearchState] = useState({
    keyword: "",
    results: [],
  });

  return (
    <SearchContext.Provider value={[searchState, setSearchState]}>
      {children}
    </SearchContext.Provider>
  );
};

// custom hook
const useSearch = () => useContext(SearchContext);

export { useSearch, SearchProvider };
