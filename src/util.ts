// https://github.com/oven-sh/bun/issues/16062
// https://github.com/tc39/proposal-arraybuffer-base64
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64#browser_compatibility
declare global {
  interface Uint8Array {
    toBase64(options?: {
      alphabet?: "base64url" | "base64";
      omitPadding?: boolean;
    }): string;
  }

  interface Uint8ArrayConstructor {
    fromBase64(
      base64: string,
      options?: { alphabet?: "base64url" | "base64" },
    ): Uint8Array;
  }
}

export function errorMessage(...message: string[]): Response {
  console.error(message.join(" "));
  return new Response(message.join(" "), {
    status: 400,
    headers: { "Content-Type": "text/plain" },
  });
}
