// Gabriel Chang, A0276978Y
import { hashPassword, comparePassword } from "../helpers/authHelper";

describe("hashPassword", () => {
  test("hashPassword produces a string different from the original password", async () => {
    const password = "testPassword";

    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
  });

  test("hashPassword produces different hashes for different passwords", async () => {
    const password = "testPassword";
    const otherPassword = "differentPassword";

    const hashed = await hashPassword(password);
    const hashedOther = await hashPassword(otherPassword);

    expect(hashed).not.toBe(hashedOther);
  });

  test("hashPassword handles errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await hashPassword(null);

    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe("comparePassword", () => {
  test("comparePassword correctly compares passwords", async () => {
    const password = "testPassword";
    const hashed = await hashPassword(password);

    const isMatch = await comparePassword(password, hashed);

    expect(isMatch).toBe(true);
  });

  test("comparePassword returns false for non-matching passwords", async () => {
    const password = "testPassword";
    const wrongPassword = "wrongPassword";
    const hashed = await hashPassword(password);

    const isMatch = await comparePassword(wrongPassword, hashed);

    expect(isMatch).toBe(false);
  });
});
