import axios from "axios";
import { renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";

jest.mock("axios");

describe("useAuth hook", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("should initialize with null user and empty token", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    const [auth] = result.current;

    expect(auth.user).toBeNull();
    expect(auth.token).toBe("");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  test("should update info from localStorage on mount", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        user: { id: 1, name: "Test User" },
        token: "test-token",
      })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    const [auth] = result.current;

    expect(auth.user).toEqual({ id: 1, name: "Test User" });
    expect(auth.token).toBe("test-token");
    expect(axios.defaults.headers.common["Authorization"]).toBe("test-token");
  });
});
