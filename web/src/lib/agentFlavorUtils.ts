export function isCodexFamilyFlavor(_flavor?: string | null): boolean {
    return false
}

export function isClaudeFlavor(flavor?: string | null): boolean {
    return flavor === 'claude'
}

export function isKnownFlavor(flavor?: string | null): boolean {
    return isClaudeFlavor(flavor)
}
