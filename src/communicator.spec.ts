import { DEFAULT_CHAIN_ID } from "@repo/contract";
import { vi } from "vitest";

import { Communicator } from "./communicator";

import { GeminiSdkEvent } from "@/types";
import { openPopup, SDK_BACKEND_URL } from "@/utils";

vi.mock("@/utils", () => ({
  SDK_BACKEND_URL: "https://mock-backend.com",
  SDK_VERSION: "0.0.1",
  closePopup: vi.fn(),
  openPopup: vi.fn(
    () =>
      ({
        closed: false,
        focus: vi.fn(),
        postMessage: vi.fn(),
      }) as unknown as Window,
  ),
}));

const mockRequestId = "11111111-2222-3333-4444-555555555555";

describe("Communicator", () => {
  let communicator: Communicator;

  beforeEach(() => {
    communicator = new Communicator({
      appMetadata: { appLogoUrl: "https://test.com/logo.png", appName: "Test App" },
      onDisconnectCallback: () => {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should open a popup and send a message to correct backend url", async () => {
    communicator.postMessage({ chainId: DEFAULT_CHAIN_ID, event: GeminiSdkEvent.SDK_CONNECT, origin: "" });
    expect(openPopup).toHaveBeenCalledWith(new URL("https://mock-backend.com"));
  });

  it("should send a request and wait for response", async () => {
    vi.spyOn(communicator, "onMessage").mockResolvedValue({
      event: GeminiSdkEvent.SDK_CONNECT,
      requestId: mockRequestId,
    });

    const response = await communicator.postRequestAndWaitForResponse({
      chainId: DEFAULT_CHAIN_ID,
      event: GeminiSdkEvent.SDK_CONNECT,
      origin: "",
      requestId: mockRequestId,
    });
    expect(response).toEqual({ event: GeminiSdkEvent.SDK_CONNECT, requestId: mockRequestId });
  });

  it("should listen for messages matching a predicate", async () => {
    const mockMessage = { event: GeminiSdkEvent.SDK_CONNECT, id: mockRequestId };
    const event = new MessageEvent("message", { data: mockMessage, origin: SDK_BACKEND_URL });

    setTimeout(() => window.dispatchEvent(event), 250);

    await expect(communicator.onMessage(({ event }) => event === GeminiSdkEvent.SDK_CONNECT)).resolves.toEqual(
      mockMessage,
    );
  });

  it("should handle popup loaded event and send app metadata", async () => {
    vi.spyOn(communicator as any, "onRequestCancelled").mockImplementation(() => {});
    vi.spyOn(communicator, "onMessage").mockResolvedValueOnce({
      event: GeminiSdkEvent.POPUP_LOADED,
      requestId: mockRequestId,
    });
    vi.spyOn(communicator, "postMessage");

    setTimeout(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { event: GeminiSdkEvent.POPUP_LOADED, requestId: mockRequestId },
          origin: SDK_BACKEND_URL,
        }),
      );
    }, 250);

    await communicator.waitForPopupLoaded();

    expect(communicator.postMessage).toHaveBeenCalledWith({
      chainId: DEFAULT_CHAIN_ID,
      data: {
        appMetadata: { appLogoUrl: "https://test.com/logo.png", appName: "Test App" },
        origin: window.location.origin,
        sdkVersion: "0.0.1",
      },
      event: GeminiSdkEvent.POPUP_APP_CONTEXT,
      origin: window.location.origin,
      requestId: mockRequestId,
    });
  });
});
