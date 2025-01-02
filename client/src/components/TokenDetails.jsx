import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import moment from 'moment';
import '../styles/TokenDetails.css';

const TokenDetails = () => {
    const { poolAddress } = useParams();
    const location = useLocation();
    const state = location.state || {};

    return (
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
                    <div
                        className={`info-value liquidity-value`}
                        data-full-value={state.formattedLiquidity || 'N/A'}
                    >
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
    );
};

export default TokenDetails;
