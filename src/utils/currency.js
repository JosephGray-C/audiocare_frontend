export function formatCRC(value) {
    if (!value) return "";

    const number = value.toString().replace(/\D/g, "");

    return new Intl.NumberFormat("es-CR").format(number);
}

export function convertCRCToEuro(value) {
    const EURO_RATE = 0.0018;
    return (value * EURO_RATE).toFixed(2);
}

export function convertCRCToUSD(value) {
    const USD_RATE = 0.0021;
    return (value * USD_RATE).toFixed(2);
}