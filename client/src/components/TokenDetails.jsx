import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import moment from 'moment';
import '../styles/TokenDetails.css';
import { BACKEND_URL } from '../constants';
import { extractCreationDate } from '../utils/TokenUtils';

const TokenDetails = () => {
    const { poolAddress } = useParams();
    const location = useLocation();
    const state = location.state || {};

    const [protocol, setProtocol] = useState('uniswap3');
    const [numTransactions, setNumTransactions] = useState(100000);
    const [loading, setLoading] = useState(false);
    const [transactionsData, setTransactionsData] = useState([]);

    const handleStart = async () => {
        setLoading(true); // Disable the button
        setTransactionsData([]); // Clear previous transactions

        console.log(`Protocol: ${protocol}, Transactions: ${numTransactions}, Pool Address: ${poolAddress}`);

        try {
            const response = await fetch(`${BACKEND_URL}/api/moreDetails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    protocol: protocol,
                    numTransactions: numTransactions,
                    poolAddress: poolAddress,
                }),
            });

            const data = await response.json();
            console.log(data.data);
            setTransactionsData(data.data.transactions); // Store the fetched data
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // Enable the button again
        }
    };



    return (
        <div className="token-details">
            {/* Token Card */}
            <div className="token-card token-details-card">
                <div className="time-badge">{state.creationTime ? moment(state.creationTime).fromNow() : 'Unknown'}</div>
                <div className="token-header">
                    <div className="token-name">
                        {state.mainToken?.name || 'Inconnu'} ({state.mainToken?.symbol || 'Inconnu'})
                        <span className="holders-badge">{(state.holders || 0).toLocaleString()} détenteurs</span>
                        <div className="token-links">
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    window.open(`https://www.dextools.io/app/en/ether/pair-explorer/${poolAddress}`, '_blank');
                                }}
                                className="token-link"
                            >
                                Voir sur DexTools
                            </span>
                        </div>
                    </div>
                </div>
                <div className="token-info">
                    <div className="info-item">
                        <div className="info-label">Liquidité</div>
                        <div className="info-value liquidity-value" data-full-value={state.formattedLiquidity || 'N/A'}>
                            {state.formattedLiquidity || 'N/A'}
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">Exchange</div>
                        <div className="info-value">{state.exchangeName || 'N/A'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">Paire</div>
                        <div className="info-value">
                            {state.mainToken?.symbol || 'Inconnu'} / {state.sideToken?.symbol || 'Inconnu'}
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">Date de création</div>
                        <div className="info-value">
                            {state.formattedCreationDate || 'Unknown'}
                        </div>
                    </div>
                </div>
                <div className="token-info" style={{ marginTop: '15px' }}>
                    <div className="info-item">
                        <div className="info-label">Adresse du Token</div>
                        <div className="info-value address">{state.mainToken?.address || 'N/A'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">Adresse du Pool</div>
                        <div className="info-value address">{poolAddress || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* New Section Outside Token Card */}
            <div className="token-card additional-info-card">
                <div className="token-info" style={{ marginTop: '15px' }}>
                    <div className="info-item">
                        <div className="info-label">Protocol</div>
                        <div className="info-value address">
                            <select
                                id="protocol"
                                value={protocol}
                                onChange={(e) => setProtocol(e.target.value)}
                            >
                                <option value="ALL">All</option>
                                <option value="UNISWAP_V2">Uniswap V2</option>
                                <option value="UNISWAP_V3">Uniswap V3</option>
                                <option value="SUSHISWAP">SushiSwap</option>
                                <option value="CURVE">Curve</option>
                                <option value="BALANCER">Balancer</option>
                                <option value="BANCOR">Bancor</option>
                                <option value="DODO">DODO</option>
                            </select>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">Number of Transactions</div>
                        <div className="info-value address">
                            <input
                                type="number"
                                id="transactions"
                                value={numTransactions}
                                onChange={(e) => setNumTransactions(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="start-button-container">
                    <button onClick={handleStart} disabled={loading}>
                        {loading ? 'Loading...' : 'Start'}
                    </button>
                </div>
            </div>

            {/* Display Fetched Data */}
            {transactionsData.length > 0 && (
                <div className="transactions-list">
                    {transactionsData.map((transaction, index) => (
                        <div key={index} className="token-card token-details-card">
                            <div className="token-info">
                                <div className="info-item">
                                    <div className="info-label">Protocol</div>
                                    <div className="info-value liquidity-value" data-full-value={transaction.formattedLiquidity || 'N/A'}>
                                        {transaction.protocol || 'Unknown'}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Type</div>
                                    <div className="info-value">{transaction.type || 'N/A'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Block Number</div>
                                    <div className="info-value">{transaction.blockNumber || 'N/A'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Transaction date</div>
                                    <div className="info-value">{extractCreationDate(transaction.timestamp) || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="token-info" style={{ marginTop: '15px' }}>
                                <div className="info-item">
                                    <div className="info-label">Sender</div>
                                    <div className="info-value address">{transaction.sender || 'N/A'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Transaction Hash</div>
                                    <div className="info-value address">{transaction.transactionHash || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TokenDetails;
