import bs58 from "bs58";

/**
 * Telling a person's wallet from a program's account.
 *
 * This decides three things: which of a token's holders are pools, which
 * counterparty a wallet traded against, and therefore whether tokens that
 * moved were bought or merely handed over. Getting it wrong is not cosmetic —
 * a swap misread as a transfer gives the wallet no cost basis and drops it off
 * the board entirely.
 *
 * The obvious test is the account's owner program, and it is WRONG. A program
 * derived address that holds SOL is owned by the System Program, exactly like
 * a wallet is. MEASURED on `ApZuxdpz`, whose main pool is
 * `GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL`: it is the token's largest
 * holder, does 5.4 swaps a second, and reports the System Program as its
 * owner because it holds 1,274 SOL. The token looked like it had never
 * traded. Pools that keep their SOL wrapped in a token account instead — a
 * pump.fun pool, say — happen to report the DEX and slip through, which is
 * why this only shows up on some tokens.
 *
 * The real distinction is mathematical and needs no network call at all. A
 * wallet's address IS an ed25519 public key, so it lies on the curve. A
 * program derived address is chosen precisely because it does NOT — that is
 * what makes it unsignable, and it is checked by every program that derives
 * one. Off the curve means no private key can exist for it, which is as close
 * to "not a person" as the chain can say.
 */

/** ed25519: y² − x² = 1 + d·x²·y² over the field of order 2^255 − 19. */
const P = BigInt(2) ** BigInt(255) - BigInt(19);
const D =
  BigInt(37095705934669439343138083508754565189542113879843219016388785533085940283555);

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = BigInt(1);
  let b = base % modulus;
  let e = exponent;
  while (e > BigInt(0)) {
    if (e & BigInt(1)) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= BigInt(1);
  }
  return result;
}

/**
 * Whether an address is a point on the ed25519 curve.
 *
 * Decompression in the usual form: the address is `y` in little endian with
 * the top bit carrying the sign of `x`. Recover x² = (y²−1)/(d·y²+1) and ask
 * whether it is a square, which Euler's criterion answers with one
 * exponentiation. A curve point can be signed for; anything else cannot.
 */
export function isOnCurve(address: string): boolean {
  let bytes: Uint8Array;
  try {
    bytes = bs58.decode(address);
  } catch {
    return false;
  }
  if (bytes.length !== 32) return false;

  let n = BigInt(0);
  for (let i = 31; i >= 0; i -= 1) n = (n << BigInt(8)) | BigInt(bytes[i] as number);
  const y = n & ((BigInt(1) << BigInt(255)) - BigInt(1));
  if (y >= P) return false;

  const y2 = (y * y) % P;
  const u = (y2 - BigInt(1) + P) % P;
  const v = (D * y2 + BigInt(1)) % P;
  const x2 = (u * modPow(v, P - BigInt(2), P)) % P;

  // x = 0 is on the curve only for the positive sign bit.
  if (x2 === BigInt(0)) return ((bytes[31] as number) >> 7) === 0;
  return modPow(x2, (P - BigInt(1)) / BigInt(2), P) === BigInt(1);
}

/**
 * A vault, a curve, an escrow — anything a program controls rather than a
 * person. The inverse of a wallet.
 */
export function isProgramDerived(address: string): boolean {
  return !isOnCurve(address);
}
