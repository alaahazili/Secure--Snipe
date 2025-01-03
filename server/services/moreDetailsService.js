const { ethers } = require('ethers');

const PROTOCOLS = {
    UNISWAP_V2: {
        name: 'Uniswap V2',
        events: { add: 'Mint', remove: 'Burn' },
        abi: [
            "event Mint(address indexed sender, uint amount0, uint amount1)",
            "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)"
        ]
    },
    UNISWAP_V3: {
        name: 'Uniswap V3',
        events: { add: 'IncreaseLiquidity', remove: 'DecreaseLiquidity' },
        abi: [
            "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
            "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
        ]
    },
    SUSHISWAP: {
        name: 'SushiSwap',
        events: { add: 'Mint', remove: 'Burn' },
        abi: [
            "event Mint(address indexed sender, uint amount0, uint amount1)",
            "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)"
        ]
    },
    CURVE: {
        name: 'Curve',
        events: { add: 'AddLiquidity', remove: 'RemoveLiquidity' },
        abi: [
            "event AddLiquidity(address indexed provider, uint256[] token_amounts, uint256[] fees, uint256 invariant, uint256 token_supply)",
            "event RemoveLiquidity(address indexed provider, uint256[] token_amounts, uint256[] fees, uint256 token_supply)"
        ]
    },
    BALANCER: {
        name: 'Balancer',
        events: { add: 'PoolBalanceChanged', remove: 'PoolBalanceChanged' },
        abi: [
            "event PoolBalanceChanged(bytes32 indexed poolId, address indexed liquidityProvider, address[] tokens, int256[] deltas, uint256[] protocolFeeAmounts)"
        ]
    },
    BANCOR: {
        name: 'Bancor',
        events: { add: 'LiquidityAdded', remove: 'LiquidityRemoved' },
        abi: [
            "event LiquidityAdded(address indexed provider, address indexed reserve, uint256 amount, uint256 newBalance, uint256 newSupply)",
            "event LiquidityRemoved(address indexed provider, address indexed reserve, uint256 amount, uint256 newBalance, uint256 newSupply)"
        ]
    },
    DODO: {
        name: 'DODO',
        events: { add: 'BuyShares', remove: 'SellShares' },
        abi: [
            "event BuyShares(address indexed buyer, uint256 valueBase, uint256 valueQuote, uint256 sharesMinted)",
            "event SellShares(address indexed seller, uint256 valueBase, uint256 valueQuote, uint256 sharesBurned)"
        ]
    },
};

class moreDetailsService {
    constructor(providerUrl) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
    }

    async makeApiCall(protocol, numTransactions, poolAddress) {
        console.log(`Fetching details for protocol: ${protocol}, numTransactions: ${numTransactions}, poolAddress: ${poolAddress}`);

        const tracker = new CrossProtocolTracker(this.provider);

        // Track address and fetch results
        const results = await tracker.trackAddress(poolAddress, numTransactions, protocol);

        // Process results to include protocol name and other details
        const transactions = results.transactions.slice(0, numTransactions); // limit to numTransactions

        // Return a formatted response
        return {
            protocol,
            numTransactions,
            poolAddress,
            transactions
        };
    }
}

class CrossProtocolTracker {
    constructor(provider) {
        this.provider = provider;
    }

    async trackAddress(pairAddress, blocksToTrack = 100000, protocol) {
        const results = {
            address: pairAddress,
            transactions: [],
            protocolsFound: []
        };
        if (!PROTOCOLS[protocol]) {
            await Promise.all(Object.entries(PROTOCOLS).map(async ([protocolName, protocol]) => {
                try {
                    const contract = new ethers.Contract(pairAddress, protocol.abi, this.provider);
                    const currentBlock = await this.provider.getBlockNumber();
                    const fromBlock = currentBlock - blocksToTrack;

                    const addEvents = await contract.queryFilter(
                        contract.filters[protocol.events.add](),
                        fromBlock,
                        currentBlock
                    );

                    const removeEvents = await contract.queryFilter(
                        contract.filters[protocol.events.remove](),
                        fromBlock,
                        currentBlock
                    );

                    if (addEvents.length > 0 || removeEvents.length > 0) {
                        results.protocolsFound.push(protocolName);
                        const transactions = await this.processEvents(protocol.name, addEvents, removeEvents);
                        results.transactions.push(...transactions);
                    }
                } catch (error) {
                    // Skip if contract doesn't match protocol
                }
            }));
        } else {
            try {
                const contract = new ethers.Contract(pairAddress, PROTOCOLS[protocol].abi, this.provider);
                const currentBlock = await this.provider.getBlockNumber();
                const fromBlock = currentBlock - blocksToTrack;

                const addEvents = await contract.queryFilter(
                    contract.filters[PROTOCOLS[protocol].events.add](),
                    fromBlock,
                    currentBlock
                );

                const removeEvents = await contract.queryFilter(
                    contract.filters[PROTOCOLS[protocol].events.remove](),
                    fromBlock,
                    currentBlock
                );

                if (addEvents.length > 0 || removeEvents.length > 0) {
                    results.protocolsFound.push(PROTOCOLS[protocol].namey);
                    const transactions = await this.processEvents(PROTOCOLS[protocol].name, addEvents, removeEvents);
                    results.transactions.push(...transactions);
                }
            } catch (error) {
                // Skip if contract doesn't match protocol
            }
        }

        results.transactions.sort((a, b) => b.blockNumber - a.blockNumber);
        return results;
    }

    async processEvents(protocol, addEvents, removeEvents) {
        const processEvent = async (event, type) => ({
            protocol,
            type,
            sender: event.args.sender,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: (await event.getBlock()).timestamp
        });

        const addTxs = await Promise.all(addEvents.map(e => processEvent(e, 'ADD_LIQUIDITY')));
        const removeTxs = await Promise.all(removeEvents.map(e => processEvent(e, 'REMOVE_LIQUIDITY')));

        return [...addTxs, ...removeTxs];
    }
}

// Instantiate moreDetailsService with provider URL
const providerUrl = 'https://mainnet.infura.io/v3/12075a367f8041f2a850acee04454bb9';  // Replace with your provider URL
const moreDetailsServiceInstance = new moreDetailsService(providerUrl);

module.exports = moreDetailsServiceInstance;
