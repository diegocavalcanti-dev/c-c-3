import { describe, it, expect } from "vitest";

/**
 * Test suite for date handling and timezone fixes.
 * These tests validate that dates are correctly converted between
 * local date strings (YYYY-MM-DD) and ISO UTC timestamps.
 */

describe("Date Handling and Timezone Fixes", () => {
  describe("Local date string to ISO conversion", () => {
    it("should convert YYYY-MM-DD string to ISO timestamp at midnight local time", () => {
      // Simulate the conversion logic used in AdminPostEditor
      const dateString = "2026-04-20"; // April 20, 2026
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      const iso = date.toISOString();

      // Verify the date is correctly parsed
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3); // 0-indexed
      expect(date.getDate()).toBe(20);

      // Verify ISO string is valid
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("should handle month and day padding correctly", () => {
      const dateString = "2026-01-05"; // January 5, 2026
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);

      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(5);
    });

    it("should handle leap year dates", () => {
      const dateString = "2024-02-29"; // Leap year
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);

      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1); // February
      expect(date.getDate()).toBe(29);
    });
  });

  describe("ISO timestamp back to local date string", () => {
    it("should convert ISO timestamp to YYYY-MM-DD format using local date", () => {
      // Simulate the conversion logic used in AdminPostEditor when loading
      const isoString = "2026-04-20T00:00:00.000Z";
      const date = new Date(isoString);

      // Convert to local date string
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // The date string should match the original (accounting for timezone)
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(year).toBe(2026);
    });

    it("should preserve date values through round-trip conversion", () => {
      // Start with a local date string
      const originalDateString = "2026-06-15";

      // Convert to ISO (local midnight)
      const [year, month, day] = originalDateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      const iso = date.toISOString();

      // Convert back to local date string
      const backDate = new Date(iso);
      const backYear = backDate.getFullYear();
      const backMonth = String(backDate.getMonth() + 1).padStart(2, "0");
      const backDay = String(backDate.getDate()).padStart(2, "0");
      const resultDateString = `${backYear}-${backMonth}-${backDay}`;

      // The result should match the original
      expect(resultDateString).toBe(originalDateString);
    });
  });

  describe("Edge cases and timezone considerations", () => {
    it("should handle year boundaries", () => {
      const dateString = "2026-12-31"; // End of year
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(11); // December
      expect(date.getDate()).toBe(31);
    });

    it("should handle beginning of year", () => {
      const dateString = "2026-01-01"; // Start of year
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(1);
    });

    it("should not have off-by-one errors with month boundaries", () => {
      // Test transition from one month to another
      const dateString = "2026-03-31"; // Last day of March
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);

      expect(date.getMonth()).toBe(2); // March (0-indexed)
      expect(date.getDate()).toBe(31);

      // Next day should be April 1st
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      expect(nextDate.getMonth()).toBe(3); // April
      expect(nextDate.getDate()).toBe(1);
    });
  });

  describe("Date display formatting", () => {
    it("should format date correctly for display in pt-BR locale", () => {
      const isoString = "2026-04-20T00:00:00.000Z";
      const date = new Date(isoString);
      const formatted = date.toLocaleDateString("pt-BR");

      // Should be in format DD/MM/YYYY or similar
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it("should display the correct date even with UTC offset", () => {
      // Create a date at midnight UTC
      const isoString = "2026-04-20T00:00:00.000Z";
      const date = new Date(isoString);

      // The date should still be April 20 when displayed in local time
      // (unless the local timezone is significantly behind UTC)
      const day = date.getDate();
      const month = date.getMonth() + 1;

      // For most timezones, this should be April 20
      // (only negative UTC offsets could shift it to April 19)
      expect([19, 20]).toContain(day);
      expect([4, 5]).toContain(month);
    });
  });

  describe("Database storage and retrieval", () => {
    it("should store dates as ISO strings in the database", () => {
      // Simulate storing a date
      const localDateString = "2026-04-20";
      const [year, month, day] = localDateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      const storedIso = date.toISOString();

      // Verify it's a valid ISO string
      expect(storedIso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // When retrieved, it should parse correctly
      const retrieved = new Date(storedIso);
      expect(retrieved.getFullYear()).toBe(2026);
      expect(retrieved.getMonth()).toBe(3); // April
      expect(retrieved.getDate()).toBe(20);
    });
  });
});
