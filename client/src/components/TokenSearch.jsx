import { useEffect, useState } from 'react';
import moment from 'moment'; // Ensure moment.js is imported
import '../styles/TokenSearch.css';
import { formatNumber, formatTimeAgo, formatLiquidityFriendly,  } from '../utils/TokenUtils';

const API_KEY = 'E1ml8j809n74ylLvuV11FmOIrywJcei35pZZZE31';
const BASE_URL = 'https://public-api.dextools.io/trial';
const CORS_PROXY = 'http://localhost:8080/';
const API_RATE_LIMIT = 1000;

let searchInProgress = false;

const TokenSearch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState('');
    const [searchButtonDisabled, setSearchButtonDisabled] = useState(false);
    const [stopButtonVisible, setStopButtonVisible] = useState(false);

    function getLiquidityClass(liquidity) {
        const value = Number(liquidity);
        if (value >= 5) return 'liquidity-high';
        if (value >= 1) return 'liquidity-medium';
        return 'liquidity-low';
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function makeApiCall(url) {
        const proxyUrl = CORS_PROXY + url;
        console.log(`Appel API vers : ${url}`);

        try {
            const response = await fetch(proxyUrl, {
                headers: {
                    'X-API-KEY': API_KEY,
                    'accept': 'application/json',
                    'origin': window.location.origin
                }
            });

            console.log(`Statut de la réponse : ${response.status}`);

            if (!response.ok) {
                throw new Error(`Erreur HTTP! statut: ${response.status}`);
            }

            const text = await response.text();
            console.log(`Réponse brute : ${text.substring(0, 200)}...`);

            try {
                const data = JSON.parse(text);
                console.log(`Réponse parsée avec succès`);
                return data;
            } catch (e) {
                throw new Error(`Erreur de parsing JSON : ${e.message}`);
            }
        } catch (error) {
            console.log(`Erreur d'appel API : ${error.message}`, true);
            throw error;
        }
    }

    async function getTokenHolders(chain, address, retryCount = 0) {
        try {
            const data = await makeApiCall(`${BASE_URL}/v2/token/${chain}/${address}/info`);
            const holders = data?.data?.holders;

            console.log(`Holders trouvés pour ${address}: ${holders}`);

            if (holders === undefined || holders === null) {
                throw new Error('Données de holders non trouvées');
            }

            return holders;
        } catch (error) {
            console.log(`Erreur lors de la récupération des holders (tentative ${retryCount + 1}): ${error.message}`);

            if (retryCount < 2) {
                console.log(`Nouvelle tentative dans ${API_RATE_LIMIT}ms...`);
                await sleep(API_RATE_LIMIT);
                return getTokenHolders(chain, address, retryCount + 1);
            }

            console.log('Échec de la récupération des holders après plusieurs tentatives');
            return null;
        }
    }

    async function getLiquidity(poolAddress, retryCount = 0) {
        console.log(`Récupération de la liquidité pour le pool : ${poolAddress} (tentative ${retryCount + 1})`);
        try {
            const data = await makeApiCall(`${BASE_URL}/v2/pool/ether/${poolAddress}/liquidity`);
            console.log(`Données de liquidité reçues : ${JSON.stringify(data)}`);
            return data?.data?.liquidity || 0;
        } catch (error) {
            if (retryCount < 2) {
                console.log(`Nouvelle tentative après erreur : ${error.message}`);
                await sleep(API_RATE_LIMIT);
                return getLiquidity(poolAddress, retryCount + 1);
            }
            throw error;
        }
    }

    async function searchTokens() {
        console.log("[==========================================]");
        if (searchInProgress) {
            console.log('Recherche déjà en cours');
            return;
        }

        try {
            searchInProgress = true;

            const daysAgo = 2;
            const maxLiquidity = 50;

            setLoading(true);
            setError('');
            setResults([]);
            setProgress('');
            setSearchButtonDisabled(true);
            setStopButtonVisible(true);

            console.log('Démarrage de la recherche...');
            console.log(`Paramètres : jours=${daysAgo}, liquiditéMax=${maxLiquidity}`);

            const fromDate = moment().subtract(daysAgo, 'days').toISOString();
            const toDate = moment().toISOString();
            console.log(`Plage de dates : ${fromDate} à ${toDate}`);

            const url = `${BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=0&pageSize=50`;
            const data = await makeApiCall(url);
            await sleep(API_RATE_LIMIT);

            if (!data.data || !data.data.results) {
                throw new Error('Format de réponse API invalide');
            }

            console.log(`${data.data.results.length} pools trouvés à traiter`);

            const totalPools = data.data.results.length;
            let processedPools = 0;
            let matchingPools = 0;

            const tokenResults = [];

            for (let i = 0; i < data.data.results.length; i++) {
                const pool = data.data.results[i];
                const estimatedTimeRemaining = (totalPools - i) * (API_RATE_LIMIT / 1000);
                setProgress(`Traitement du pool ${i + 1}/${totalPools}... Temps restant estimé : ${estimatedTimeRemaining} secondes`);

                if (pool && pool.address) {
                    try {
                        const liquidity = await getLiquidity(pool.address);
                        const holders = await getTokenHolders('ether', pool.mainToken?.address);
                        processedPools++;
                        console.log(`Pool ${pool.mainToken?.symbol || 'Inconnu'} liquidité: $${liquidity}`);

                        if (Number(liquidity) <= maxLiquidity) {
                            matchingPools++;
                            console.log(`Pool trouvé : ${pool.mainToken?.symbol} avec liquidité $${liquidity}`);

                            const tokenCard = (
                                <div className="token-card" key={pool.address}>
                                    <div className="time-badge">{formatTimeAgo(pool.creationTime)}</div>
                                    <div className="token-header">
                                        <h3 className="token-name">
                                            {pool.mainToken?.name || 'Inconnu'} ({pool.mainToken?.symbol || 'Inconnu'})
                                            {holders !== null && (
                                                <span className="holders-badge">{holders.toLocaleString()} holders</span>
                                            )}
                                        </h3>
                                        <div className="token-links">
                                            <a href={`https://www.dextools.io/app/en/ether/pair-explorer/${pool.address}`} target="_blank" className="token-link">
                                                Voir sur DexTools
                                            </a>
                                        </div>
                                    </div>
                                    <div className="token-info">
                                        <div className="info-item">
                                            <div className="info-label">Liquidité</div>
                                            <div className={`info-value ${getLiquidityClass(liquidity)} liquidity-value`} data-full-value={formatNumber(liquidity)}>
                                                {formatLiquidityFriendly(liquidity)}
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">Exchange</div>
                                            <div className="info-value">{pool.exchangeName || 'N/A'}</div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">Paire</div>
                                            <div className="info-value">{pool.mainToken?.symbol || 'Inconnu'} / {pool.sideToken?.symbol || 'Inconnu'}</div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">Date de création</div>
                                            <div className="info-value">{moment(pool.creationTime).format('DD/MM/YYYY HH:mm:ss')}</div>
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
                            );
                            tokenResults.push(tokenCard);
                        }

                        await sleep(API_RATE_LIMIT);
                    } catch (error) {
                        console.log(`Erreur lors du traitement du pool ${pool.address}: ${error.message}`, true);
                        await sleep(API_RATE_LIMIT);
                        continue;
                    }
                }
            }

            setLoading(false);
            setStopButtonVisible(false);
            setSearchButtonDisabled(false);
            setProgress(`Recherche terminée. ${processedPools} pools traités, ${matchingPools} pools correspondants trouvés.`);
            setResults(tokenResults);

            if (matchingPools === 0) {
                setResults(['<p>Aucun token trouvé correspondant à vos critères.</p>']);
            }
        } catch (error) {
            setLoading(false);
            setStopButtonVisible(false);
            setSearchButtonDisabled(false);
            setError('Erreur : ' + error.message);
            console.log(`Erreur rencontrée : ${error.message}`, true);
            console.error('Erreur de recherche :', error);
        } finally {
            searchInProgress = false;
        }
    }

    useEffect(() => {
        searchTokens();
    }, []);

    return (
        <>
            <div className="loading" style={{ display: loading ? 'block' : 'none' }}>Recherche en cours...</div>
            <div className="progress">{progress}</div>
            <div className="error" style={{ display: error ? 'block' : 'none' }}>{error}</div>
            <div className="results">{results}</div>
        </>
    );
};

export default TokenSearch;
