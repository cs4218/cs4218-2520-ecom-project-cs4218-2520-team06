import React from "react";
import { useAuth } from "../../context/auth";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import Profile from "./Profile";
import toast from "react-hot-toast";

// Mock axios
jest.mock("axios");

// Mock useAuth hook
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock UserMenu component
jest.mock("../../components/UserMenu", () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

// Mock Layout component
jest.mock("../../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const UI = {
  NAME_PLACEHOLDER: "Enter Your Name",
  EMAIL_PLACEHOLDER: "Enter Your Email",
  PWD_PLACEHOLDER: "Enter Your Password",
  PHONE_PLACEHOLDER: "Enter Your Phone",
  ADDR_PLACEHOLDER: "Enter Your Address",
  SUBMIT_BTN: /UPDATE/i,
};

describe("Profile Component", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    address: "123 Test Street",
  };

  const mockUpdatedUser = {
    name: "Jane Doe",
    email: "john@example.com",
    phone: "0987654321",
    address: "456 New Street",
  };

  const mockValidAuth = {
    user: mockUser,
    token: "valid-token",
  };

  const mockSetAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render essential components", () => {
      // Arrange: Set up authenticated user
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);

      // Act: Render the Profile component
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Assert: Verify essential components are rendered
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    it("should render all form input fields", () => {
      // Arrange: Set up authenticated user
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);

      // Act: Render the Profile component
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Assert: Verify all input fields are rendered
      expect(
        screen.getByPlaceholderText(UI.NAME_PLACEHOLDER)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(UI.EMAIL_PLACEHOLDER)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(UI.PWD_PLACEHOLDER)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(UI.PHONE_PLACEHOLDER)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(UI.ADDR_PLACEHOLDER)
      ).toBeInTheDocument();
    });
  });

  describe("Form Initial State", () => {
    it("should populate form fields with user data from auth context", () => {
      // Arrange: Set up authenticated user with complete data
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);

      // Act: Render the Profile component
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Assert: Verify form fields are populated with user data
      expect(screen.getByPlaceholderText(UI.NAME_PLACEHOLDER)).toHaveValue(
        "John Doe"
      );
      expect(screen.getByPlaceholderText(UI.EMAIL_PLACEHOLDER)).toHaveValue(
        "john@example.com"
      );
      expect(screen.getByPlaceholderText(UI.PHONE_PLACEHOLDER)).toHaveValue(
        "1234567890"
      );
      expect(screen.getByPlaceholderText(UI.ADDR_PLACEHOLDER)).toHaveValue(
        "123 Test Street"
      );
    });

    it("should handle missing optional fields gracefully", () => {
      // Arrange: Set up authenticated user with missing optional fields
      const incompleteUser = {
        name: "John Doe",
        email: "john@example.com",
        // phone and address missing
      };
      useAuth.mockReturnValue([
        { ...mockValidAuth, user: incompleteUser },
        mockSetAuth,
      ]);

      // Act: Render the Profile component
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Assert: Verify form renders without errors with empty optional fields
      expect(screen.getByPlaceholderText(UI.NAME_PLACEHOLDER)).toHaveValue(
        "John Doe"
      );
      expect(screen.getByPlaceholderText(UI.PHONE_PLACEHOLDER)).toHaveValue("");
      expect(screen.getByPlaceholderText(UI.ADDR_PLACEHOLDER)).toHaveValue("");
    });

    it("should keep email field disabled", () => {
      // Arrange: Set up authenticated user
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);

      // Act: Render the Profile component
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Assert: Verify email field is disabled
      expect(screen.getByPlaceholderText(UI.EMAIL_PLACEHOLDER)).toBeDisabled();
    });

    it("should handle null auth.user gracefully", () => {
      // Arrange: Set up auth with null user
      useAuth.mockReturnValue([{ user: null }, mockSetAuth]);

      // Act: Render the Profile component
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Assert: Verify form renders with empty fields
      expect(screen.getByPlaceholderText(UI.NAME_PLACEHOLDER)).toHaveValue("");
      expect(screen.getByPlaceholderText(UI.EMAIL_PLACEHOLDER)).toHaveValue("");
    });

    it("should update form fields when auth.user changes", () => {
      // Arrange: Set up initial authenticated user
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);

      const { rerender } = render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Verify initial values
      expect(screen.getByPlaceholderText(UI.NAME_PLACEHOLDER)).toHaveValue(
        "John Doe"
      );

      // Act: Update auth with different user and rerender
      useAuth.mockReturnValue([{ user: mockUpdatedUser }, mockSetAuth]);

      rerender(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Assert: Verify form fields and internal state are updated with new user data
      expect(screen.getByPlaceholderText(UI.NAME_PLACEHOLDER)).toHaveValue(
        "Jane Doe"
      );
      expect(screen.getByPlaceholderText(UI.PHONE_PLACEHOLDER)).toHaveValue(
        "0987654321"
      );
    });
  });

  describe("Form Input Handling", () => {
    it("should update enabled form input states when typing", () => {
      // Arrange: Set up authenticated user
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      const nameInput = screen.getByPlaceholderText(UI.NAME_PLACEHOLDER);
      const passwordInput = screen.getByPlaceholderText(UI.PWD_PLACEHOLDER);
      const phoneInput = screen.getByPlaceholderText(UI.PHONE_PLACEHOLDER);
      const addressInput = screen.getByPlaceholderText(UI.ADDR_PLACEHOLDER);

      // Act: Type in all enabled input fields
      fireEvent.change(nameInput, { target: { value: "New Name" } });
      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(phoneInput, { target: { value: "5555555555" } });
      fireEvent.change(addressInput, { target: { value: "New Address" } });

      // Assert: Verify all input values are updated
      expect(nameInput).toHaveValue("New Name");
      expect(passwordInput).toHaveValue("newpassword123");
      expect(phoneInput).toHaveValue("5555555555");
      expect(addressInput).toHaveValue("New Address");
    });

    it("should NOT allow email field to be edited", () => {
      // Arrange: Set up authenticated user
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText(UI.EMAIL_PLACEHOLDER);

      // Act: Try to type in email input (should not work since it's disabled)
      fireEvent.change(emailInput, {
        target: { value: "newemail@example.com" },
      });

      // Assert: Verify email input value remains unchanged
      expect(emailInput).toHaveValue("john@example.com");
    });
  });

  describe("Profile Update Success", () => {
    it("should call update profile endpoint with current form data (PUT) on submit", async () => {
      // Arrange: Set up authenticated user and mock successful API response
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      axios.put.mockResolvedValueOnce({
        data: { updatedUser: mockUpdatedUser },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Update form and submit
      fireEvent.change(screen.getByPlaceholderText(UI.NAME_PLACEHOLDER), {
        target: { value: "Jane Doe" },
      });
      fireEvent.change(screen.getByPlaceholderText(UI.PHONE_PLACEHOLDER), {
        target: { value: "0987654321" },
      });
      fireEvent.change(screen.getByPlaceholderText(UI.ADDR_PLACEHOLDER), {
        target: { value: "456 New Street" },
      });

      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify PUT request was made with correct data (combination of initial and updated fields)
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
          name: "Jane Doe",
          email: "john@example.com",
          password: "",
          phone: "0987654321",
          address: "456 New Street",
        });
      });
    });

    it("should call setAuth with updated user data on success", async () => {
      // Arrange: Set up authenticated user and mock successful API response
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      axios.put.mockResolvedValueOnce({
        data: { updatedUser: mockUpdatedUser },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify setAuth was called with updated user
      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith({
          user: mockUpdatedUser,
          token: mockValidAuth.token,
        });
      });
    });

    it("should update localStorage with updated user data", async () => {
      // Arrange: Set up authenticated user and mock localStorage
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      Storage.prototype.getItem.mockReturnValueOnce(
        JSON.stringify(mockValidAuth)
      );
      axios.put.mockResolvedValueOnce({
        data: { updatedUser: mockUpdatedUser },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify localStorage was updated
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "auth",
          JSON.stringify({ user: mockUpdatedUser, token: mockValidAuth.token })
        );
      });
    });

    it("should show success toast message on successful update", async () => {
      // Arrange: Set up authenticated user and mock successful API response
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      axios.put.mockResolvedValueOnce({
        data: { updatedUser: mockUpdatedUser },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify success toast was shown
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Profile Updated Successfully"
        );
      });
    });
  });

  describe("Profile Update Error Handling", () => {
    it("should show error toast when API returns error response", async () => {
      // Arrange: Set up authenticated user and mock API error response
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      axios.put.mockResolvedValueOnce({
        data: { error: "This is an error message" },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify error toast was shown with API error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("This is an error message");
      });
    });

    it("should show generic error toast on network error", async () => {
      // Arrange: Set up authenticated user and mock network error
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      axios.put.mockRejectedValueOnce(new Error("Network Error"));
      jest.spyOn(console, "log").mockImplementation();

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify generic error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });

    it("should log error to console on failure", async () => {
      // Arrange: Set up authenticated user and mock network error
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const error = new Error("Network Error");
      axios.put.mockRejectedValueOnce(error);

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify error was logged to console
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });

    it("should NOT update auth or localStorage on error", async () => {
      // Arrange: Set up authenticated user and mock API error
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      axios.put.mockRejectedValueOnce(new Error("Network Error"));
      jest.spyOn(console, "log").mockImplementation();

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify setAuth and localStorage.setItem were not called
      await waitFor(() => {
        expect(mockSetAuth).not.toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(localStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form submission", async () => {
      // Arrange: Set up authenticated user with all fields empty
      const emptyUser = {
        name: "",
        email: "test@example.com",
        phone: "",
        address: "",
      };
      useAuth.mockReturnValue([{ user: emptyUser }, mockSetAuth]);
      axios.put.mockResolvedValueOnce({
        data: { updatedUser: emptyUser },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form with empty values
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify PUT request was still made
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
          name: "",
          email: "test@example.com",
          password: "",
          phone: "",
          address: "",
        });
      });
    });

    it("should handle localStorage parsing errors", async () => {
      // Arrange: Set up authenticated user and mock localStorage with invalid JSON
      useAuth.mockReturnValue([mockValidAuth, mockSetAuth]);
      Storage.prototype.getItem.mockReturnValueOnce("invalid-json");
      jest.spyOn(console, "log").mockImplementation();
      axios.put.mockResolvedValueOnce({
        data: { updatedUser: mockUpdatedUser },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form (should not throw)
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify component handles error gracefully (does not crash)
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
    });

    it("should preserve other auth context data when updating user", async () => {
      // Arrange: Set up authenticated user with additional auth data
      const authWithExtraData = {
        user: mockUser,
        token: "test-token",
        extraField: "should-be-preserved",
      };
      useAuth.mockReturnValue([authWithExtraData, mockSetAuth]);
      axios.put.mockResolvedValueOnce({
        data: { updatedUser: mockUpdatedUser },
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      // Act: Submit form
      fireEvent.click(screen.getByRole("button", { name: UI.SUBMIT_BTN }));

      // Assert: Verify setAuth preserves other auth data
      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith({
          user: mockUpdatedUser,
          token: "test-token",
          extraField: "should-be-preserved",
        });
      });
    });
  });
});
