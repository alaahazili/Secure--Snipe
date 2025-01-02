import { useEffect, useState, useCallback } from 'react';
import moment from 'moment';
import '../styles/TokenSearch.css';
import { formatNumber, formatTimeAgo, formatLiquidityFriendly } from '../utils/TokenUtils';
import { BASE_URL, API_RATE_LIMIT, BACKEND_URL } from '../constants';
import { Link } from 'react-router-dom';

let searchInProgress = false;

const TokenSearch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState('');
    const [processedCount, setProcessedCount] = useState(0);

    function getLiquidityClass(liquidity) {
        const value = Number(liquidity);
        if (value >= 5) return 'liquidity-high';
        if (value >= 1) return 'liquidity-medium';
        return 'liquidity-low';
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function makeApiCall(url) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/call?url=${encodeURIComponent(url)}`, {
                method: 'GET',
            });

            if (!response.ok) throw new Error(`Erreur HTTP! statut: ${response.status}`);
            return JSON.parse(await response.text());
        } catch (error) {
            console.error(`Erreur d'appel API: ${error.message}`);
            throw error;
        }
    }

    async function getTokenHolders(chain, address, retryCount = 0) {
        try {
            const data = await makeApiCall(`${BASE_URL}/v2/token/${chain}/${address}/info`);
            return data?.data.data?.holders ?? 0;
        } catch (error) {
            if (retryCount < 2) {
                await sleep(API_RATE_LIMIT);
                return getTokenHolders(chain, address, retryCount + 1);
            }
            return 0;
        }
    }

    async function getLiquidity(poolAddress, retryCount = 0) {
        try {
            const data = await makeApiCall(`${BASE_URL}/v2/pool/ether/${poolAddress}/liquidity`);
            return data?.data.data?.liquidity || 0;
        } catch (error) {
            if (retryCount < 2) {
                await sleep(API_RATE_LIMIT);
                return getLiquidity(poolAddress, retryCount + 1);
            }
            throw error;
        }
    }

    async function processPool(pool, totalPools) {
        try {
            const liquidity = await getLiquidity(pool.address);
            const holders = await getTokenHolders('ether', pool.mainToken?.address);

            setProcessedCount(prev => {
                const newCount = prev + 1;
                const estimatedTimeRemaining = (totalPools - newCount) * (API_RATE_LIMIT / 1000);
                setProgress(`Traitement du pool ${newCount}/${totalPools}... Temps restant estimé : ${estimatedTimeRemaining} secondes`);
                return newCount;
            });

            if (Number(liquidity) <= 50) {
                const tokenCard = (
                    <Link
                        to={`/project-detector/${pool.address}`}
                        key={pool.address}
                        className='more-details'
                        state={{
                            creationTime: pool.creationTime,
                            mainToken: {
                                name: pool.mainToken?.name || 'Inconnu',
                                symbol: pool.mainToken?.symbol || 'Inconnu',
                                address: pool.mainToken?.address || 'N/A',
                            },
                            sideToken: {
                                symbol: pool.sideToken?.symbol || 'Inconnu',
                            },
                            holders: holders || 0,
                            liquidity,
                            formattedLiquidity: formatLiquidityFriendly(liquidity),
                            exchangeName: pool.exchangeName || 'N/A',
                            pair: `${pool.mainToken?.symbol || 'Inconnu'} / ${pool.sideToken?.symbol || 'Inconnu'}`,
                            formattedCreationDate: moment(pool.creationTime).format('DD/MM/YYYY HH:mm:ss'),
                            poolAddress: pool.address || 'N/A',
                        }}
                    >
                        <div className="token-card" key={pool.address}>
                            <div className="time-badge">{formatTimeAgo(pool.creationTime)}</div>
                            <div className="token-header">
                                <div className="token-name">
                                    {pool.mainToken?.name || 'Inconnu'} ({pool.mainToken?.symbol || 'Inconnu'})
                                    <span className="holders-badge">{(holders || 0).toLocaleString()} détenteurs</span>
                                    <div className="token-links">
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                window.open(`https://www.dextools.io/app/en/ether/pair-explorer/${pool.address}`, '_blank');
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
                                    <div
                                        className={`info-value ${getLiquidityClass(liquidity)} liquidity-value`}
                                        data-full-value={formatNumber(liquidity)}
                                    >
                                        {formatLiquidityFriendly(liquidity)}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Exchange</div>
                                    <div className="info-value">{pool.exchangeName || 'N/A'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Paire</div>
                                    <div className="info-value">
                                        {pool.mainToken?.symbol || 'Inconnu'} / {pool.sideToken?.symbol || 'Inconnu'}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Date de création</div>
                                    <div className="info-value">
                                        {moment(pool.creationTime).format('DD/MM/YYYY HH:mm:ss')}
                                    </div>
                                </div>
                            </div>
                            <div className="token-info" style={{ marginTop: '15px' }}>
                                <div className="info-item">
                                    <div className="info-label">Adresse du Token</div>
                                    <div className="info-value address">{pool.mainToken?.address || 'N/A'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Adresse du Pool</div>
                                    <div className="info-value address">{pool.address || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
                

                setResults(prev => [...prev, tokenCard]);
            }
        } catch (error) {
            console.error(`Erreur lors du traitement du pool ${pool.address}: ${error.message}`);
        }
    }

    async function searchTokens() {
        if (searchInProgress) return;

        searchInProgress = true;
        try {
            setLoading(true);
            setError('');
            setResults([]);
            setProgress('');
            setProcessedCount(0);

            const fromDate = moment().subtract(2, 'days').toISOString();
            const toDate = moment().toISOString();

            const url = `${BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=0&pageSize=50`;
            const data = await makeApiCall(url);

            if (!data.data?.data?.results) throw new Error('Format de réponse API invalide');

            const pools = data.data.data.results;

            for (const pool of pools) {
                if (pool?.address) {
                    await processPool(pool, pools.length);
                    await sleep(API_RATE_LIMIT);
                }
            }

            setLoading(false);
            setProgress(`Recherche terminée.`);

        } catch (error) {
            setLoading(false);
            setError(`Erreur : ${error.message}`);
        } finally {
            searchInProgress = false;
        }
    }

    useEffect(() => {
        searchTokens();
    }, []);

    return (
        <>
            <div className="loading" style={{ display: loading ? 'block' : 'none' }}>
                Recherche en cours...
            </div>
            <div className="progress">{progress}</div>
            <div className="error" style={{ display: error ? 'block' : 'none' }}>
                {error}
            </div>
            <div className="results">{results}</div>
        </>
    );
};

export default TokenSearch;