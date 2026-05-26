import { describe, it, expect, vi } from "vitest";
import { sendInviteNotification } from "../lib/sendInviteNotification";

// Mock a minimal SupabaseClient with functions.invoke
function createMockClient(response: { data?: any; error?: any }) {
  return {
    functions: {
      invoke: vi.fn().mockResolvedValue(response),
    },
  } as any;
}

describe("sendInviteNotification", () => {
  it("should call functions.invoke with correct function name", async () => {
    const client = createMockClient({ data: { ok: true }, error: null });

    await sendInviteNotification(client, "+2201234567", "https://tems.market/invite/abc");

    expect(client.functions.invoke).toHaveBeenCalledWith(
      "send-notification",
      expect.any(Object),
    );
  });

  it("should pass phone, type: invite, and message in body", async () => {
    const client = createMockClient({ data: { ok: true }, error: null });
    const link = "https://tems.market/invite/abc123";

    await sendInviteNotification(client, "+2201234567", link);

    const callArgs = client.functions.invoke.mock.calls[0][1];
    expect(callArgs.body.phone).toBe("+2201234567");
    expect(callArgs.body.type).toBe("invite");
    expect(callArgs.body.message).toContain(link);
  });

  it("should include the invite link in the message", async () => {
    const client = createMockClient({ data: { ok: true }, error: null });
    const link = "https://tems.market/invite/xyz789";

    await sendInviteNotification(client, "+2207654321", link);

    const callArgs = client.functions.invoke.mock.calls[0][1];
    expect(callArgs.body.message).toContain("https://tems.market/invite/xyz789");
    expect(callArgs.body.message).toContain("Tems Market");
  });

  it("should return { success: true } on success", async () => {
    const client = createMockClient({ data: { ok: true }, error: null });

    const result = await sendInviteNotification(client, "+2201234567", "https://example.com");

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return { success: false, error } when invoke returns an error", async () => {
    const client = createMockClient({
      data: null,
      error: { message: "Function timed out" },
    });

    const result = await sendInviteNotification(client, "+2201234567", "https://example.com");

    expect(result.success).toBe(false);
    expect(result.error).toContain("timed out");
  });

  it("should return { success: false } on unexpected exceptions", async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockRejectedValue(new Error("Network error")),
      },
    } as any;

    const result = await sendInviteNotification(client, "+2201234567", "https://example.com");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });
});
