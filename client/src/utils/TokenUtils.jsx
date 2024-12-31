import moment from 'moment';

moment.locale('fr');

/**
 * Formats a number into a currency-like string.
 * @param {number|string} num - The number to format.
 * @returns {string} The formatted number as a string.
 */
export function formatNumber(num) {
    const value = Number(num);

    if (value === null || isNaN(value) || value === undefined) return '0';

    // Handle very small values
    if (Math.abs(value) < 0.01) {
        const str = value.toString();
        if (str.includes('e-')) {
            const [base, exponent] = str.split('e-');
            const zeroCount = parseInt(exponent) - 1;
            const baseNumber = parseFloat(base).toFixed(4);
            return `$0.0${zeroCount}${baseNumber}`;
        }
    }

    // Handle other values
    if (value < 1000) {
        return '$' + value.toFixed(4);
    }

    return '$' + new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }).format(value);
}

/**
 * Formats a number to a liquidity-friendly representation.
 * @param {number|string} num - The number to format.
 * @returns {string} The liquidity-friendly formatted number.
 */
export function formatLiquidityFriendly(num) {
    const value = Number(num);

    if (value === null || isNaN(value) || value === undefined) return '0$';

    // Handle values very close to zero
    if (Math.abs(value) < 0.01) {
        return '~0$';
    }

    // Handle values between 0.01$ and 999.99$
    if (value < 1000) {
        return value.toFixed(2) + '$';
    }

    // Handle values between 1K$ and 999.9K$
    if (value < 1000000) {
        return (value / 1000).toFixed(1) + 'K$';
    }

    // Handle values of 1M$ and above
    return (value / 1000000).toFixed(1) + 'M$';
}

/**
 * Formats a date to a "time ago" string.
 * @param {string|Date} date - The date to format.
 * @returns {string} The "time ago" formatted string.
 */
export function formatTimeAgo(date) {
    const now = moment();
    const creationTime = moment(date);
    const duration = moment.duration(now.diff(creationTime));

    if (duration.asMinutes() < 60) {
        return `créé il y a ${Math.round(duration.asMinutes())} minutes`;
    } else if (duration.asHours() < 24) {
        return `créé il y a ${Math.round(duration.asHours())} heures`;
    } else {
        return `créé il y a ${Math.round(duration.asDays())} jours`;
    }
}
