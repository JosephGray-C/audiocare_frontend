export function formatCRC(value) {
    if (!value) return "";

    const numericValue = value.toString().replace(/\D/g, "");

    if (!numericValue) return "";

    return Number(numericValue).toLocaleString("en-US");
}

export function convertCRCToEuro(value) {
    const EURO_RATE = 0.0018;
    return (value * EURO_RATE).toFixed(2);
}

export function convertCRCToUSD(value) {
    const USD_RATE = 0.0021;
    return (value * USD_RATE).toFixed(2);
}

export function formatConvertedCurrency(value) {
    const number = Number(value);

    if (Number.isNaN(number)) return "0.00";

    return number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
