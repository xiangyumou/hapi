export const CLAUDE_PERMISSION_MODES = ['default', 'acceptEdits', 'bypassPermissions', 'plan'] as const
export type ClaudePermissionMode = typeof CLAUDE_PERMISSION_MODES[number]

export const PERMISSION_MODES = ['default', 'acceptEdits', 'bypassPermissions', 'plan'] as const
export type PermissionMode = typeof PERMISSION_MODES[number]

export const MODEL_MODES = ['default', 'sonnet', 'opus'] as const
export type ModelMode = typeof MODEL_MODES[number]

export type AgentFlavor = 'claude'

export const PERMISSION_MODE_LABELS: Record<PermissionMode, string> = {
    default: 'Default',
    acceptEdits: 'Accept Edits',
    plan: 'Plan Mode',
    bypassPermissions: 'Yolo'
}

export type PermissionModeTone = 'neutral' | 'info' | 'warning' | 'danger'

export const PERMISSION_MODE_TONES: Record<PermissionMode, PermissionModeTone> = {
    default: 'neutral',
    acceptEdits: 'warning',
    plan: 'info',
    bypassPermissions: 'danger'
}

export type PermissionModeOption = {
    mode: PermissionMode
    label: string
    tone: PermissionModeTone
}

export const MODEL_MODE_LABELS: Record<ModelMode, string> = {
    default: 'Default',
    sonnet: 'Sonnet',
    opus: 'Opus'
}

export function getPermissionModeLabel(mode: PermissionMode): string {
    return PERMISSION_MODE_LABELS[mode]
}

export function getPermissionModeTone(mode: PermissionMode): PermissionModeTone {
    return PERMISSION_MODE_TONES[mode]
}

export function getPermissionModesForFlavor(_flavor?: string | null): readonly PermissionMode[] {
    return CLAUDE_PERMISSION_MODES
}

export function getPermissionModeOptionsForFlavor(flavor?: string | null): PermissionModeOption[] {
    return getPermissionModesForFlavor(flavor).map((mode) => ({
        mode,
        label: getPermissionModeLabel(mode),
        tone: getPermissionModeTone(mode)
    }))
}

export function isPermissionModeAllowedForFlavor(mode: PermissionMode, flavor?: string | null): boolean {
    return getPermissionModesForFlavor(flavor).includes(mode)
}

export function getModelModesForFlavor(_flavor?: string | null): readonly ModelMode[] {
    return MODEL_MODES
}

export function isModelModeAllowedForFlavor(mode: ModelMode, flavor?: string | null): boolean {
    return getModelModesForFlavor(flavor).includes(mode)
}
