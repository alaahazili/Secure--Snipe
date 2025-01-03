const moreDetailsService = require('./../services/moreDetailsService');

class moreDetailsController {
    async makeApiCall(req, res) {
        try {
            const { protocol, numTransactions, poolAddress } = req.body;

            // Validate parameters
            if (!protocol || !numTransactions || !poolAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'All parameters (protocol, numTransactions, poolAddress) are required'
                });
            }

            // Call the service's makeApiCall method and get the results
            const results = await moreDetailsService.makeApiCall(protocol, numTransactions, poolAddress);
            // Return the results in the response
            return res.json({ success: true, data: results });
        } catch (error) {
            console.error('Api call error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new moreDetailsController();
