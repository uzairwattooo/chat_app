export function normalizeDateValue(value) {
    if (!value) {
        return new Date();
    }

    if (value instanceof Date) {
        return value;
    }

    const stringValue = String(value);

    const hasTimezone =
        stringValue.endsWith("Z") ||
        /[+-]\d{2}:\d{2}$/.test(stringValue);

    const normalizedValue = hasTimezone
        ? stringValue
        : `${stringValue}Z`;

    const date = new Date(normalizedValue);

    return Number.isNaN(date.getTime())
        ? new Date()
        : date;
}

export function formatMessageTime(value) {
    return normalizeDateValue(value).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Karachi",
    });
}

export function getMessageTimestamp(value) {
    return normalizeDateValue(value).getTime();
}