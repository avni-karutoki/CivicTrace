// Express 4 does not catch rejected promises from async handlers —
// without this, a thrown error leaves the request hanging forever.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
