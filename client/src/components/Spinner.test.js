// Kok Bo Chang, A0273542E
import React from "react";
import { render, act, getByText } from "@testing-library/react";
import Spinner from "./Spinner";
import { useLocation, useNavigate } from "react-router-dom";

const INTERVAL_IN_SECONDS = 3;

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"), // still use some original implementations for the router
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
}));

// Kok Bo Chang, A0273542E
describe("Spinner component", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.resetAllMocks();
    });

    // Kok Bo Chang, A0273542E
    test("renders countdown text", () => {
        // Arrange
        const mockLocationPath = "mock";
        
        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        useLocation.mockReturnValue({ pathname: mockLocationPath });

        // Act
        const { container } = render(<Spinner />);

        // Assert
        expect(getByText(container, `redirecting to you in ${INTERVAL_IN_SECONDS} seconds`)).toBeInTheDocument();
        expect(getByText(container, "Loading...")).toBeInTheDocument();
        
    });

    // Kok Bo Chang, A0273542E
    test("navigate is called with the default path and with the correct state", () => {
        // Arrange
        const mockLocationPath = "mock";
        const defaultSpinnerPath = "login";

        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        useLocation.mockReturnValue({ pathname: mockLocationPath });

        // Act
        render(<Spinner />);
        act(() => {
            jest.advanceTimersByTime(INTERVAL_IN_SECONDS * 1000);
        });

        // Assert
        expect(navigate).toHaveBeenCalledWith("/" + defaultSpinnerPath, { state: mockLocationPath });
    });

    // Kok Bo Chang, A0273542E
    test("navigate is called with a custom path and with the correct state", () => {
        // Arrange
        const mockLocationPath = "mock";
        const mockSpinnerPath = "dashboard";

        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        useLocation.mockReturnValue({ pathname: mockLocationPath });

        // Act
        render(<Spinner path={mockSpinnerPath} />);
        act(() => {
            jest.advanceTimersByTime(INTERVAL_IN_SECONDS * 1000);
        });

        // Assert
        expect(navigate).toHaveBeenCalledWith("/" + mockSpinnerPath, { state: mockLocationPath });
    });
});