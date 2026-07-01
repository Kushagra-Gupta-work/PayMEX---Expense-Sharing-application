/**
 * @desc    Simple health check to confirm the API is running
 * @route   GET /api/health
 * @access  Public
 */
export const getHealth = (req, res) => {
  res.status(200).json({ status: "ok" });
};
