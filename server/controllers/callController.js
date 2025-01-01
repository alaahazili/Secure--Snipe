const callService = require('./../services/callService');

class callController {
    async makeApiCall(req, res) {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL parameter is required'
                });
            }
            const results = await callService.makeApiCall(url);

            res.json({ success: true, data: results });
        } catch (error) {
            console.error('Api call error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new callController();
