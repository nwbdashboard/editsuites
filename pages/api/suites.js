export default async function handler(req, res) {
  res.status(200).json({
    success: false,
    error: "BRAND NEW API FILE - CACHE CLEARED!",
    message: "If you see this, the new file works!"
  });
}
