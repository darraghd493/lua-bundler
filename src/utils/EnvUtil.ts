function isTrue(value: string): boolean {
    return value.toLowerCase() === "true";
}

export function getEnvValue(key: string): string {
    return process.env[key] || "";
}

export function getEnvValueAsBoolean(key: string): boolean {
    const value = getEnvValue(key);
    return value === null ? false : isTrue(value);
}
