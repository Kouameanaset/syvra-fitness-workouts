// Tests for the useFetch hook. renderHook runs a hook inside a tiny fake
// component so we can read what it returns and see it change over time.

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFetch } from "./useFetch";

describe("useFetch", () => {
  it("starts loading, then returns the data", async () => {
    const fetcher = vi.fn().mockResolvedValue(["a", "b"]);
    const { result } = renderHook(() => useFetch(fetcher, []));

    // Right after the first render nothing has arrived yet.
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    // waitFor retries until the promise has resolved and state has updated.
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["a", "b"]);
    expect(result.current.error).toBeNull();
  });

  it("returns the error message when the request fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Boom"));
    const { result } = renderHook(() => useFetch(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Boom");
    expect(result.current.data).toBeNull();
  });

  it("reload() runs the request again", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    const { result } = renderHook(() => useFetch(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe("first"));

    // act() tells React we are causing a state change from the test.
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toBe("second"));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("fetches again when a dependency changes and ignores the stale answer", async () => {
    // The first request is slow, the second one is fast.
    let resolveSlow: (value: string) => void = () => {};
    const slow = new Promise<string>((resolve) => {
      resolveSlow = resolve;
    });
    const fetcher = vi.fn((id: number) => (id === 1 ? slow : Promise.resolve("fast")));

    const { result, rerender } = renderHook(({ id }) => useFetch(() => fetcher(id), [id]), {
      initialProps: { id: 1 },
    });

    rerender({ id: 2 }); // dependency changed: request 1 is now out of date
    await waitFor(() => expect(result.current.data).toBe("fast"));

    // The old request finishes late. Its result must NOT replace the new data.
    await act(async () => {
      resolveSlow("stale");
    });
    expect(result.current.data).toBe("fast");
  });
});
