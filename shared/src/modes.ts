export const PERMISSION_MODES = ['default', 'acceptEdits', 'bypassPermissions', 'plan'] as const
export type PermissionMode = typeof PERMISSION_MODES[number]

export const MODEL_MODES = ['default', 'sonnet', 'opus'] as const
export type ModelMode = typeof MODEL_MODES[number]

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

export function getPermissionModes(): readonly PermissionMode[] {
    return PERMISSION_MODES
}

export function getPermissionModeOptions(): PermissionModeOption[] {
    return getPermissionModes().map((mode) => ({
        mode,
        label: getPermissionModeLabel(mode),
        tone: getPermissionModeTone(mode)
    }))
}

export function isPermissionModeAllowed(mode: PermissionMode): boolean {
    return getPermissionModes().includes(mode)
}

export function getModelModes(): readonly ModelMode[] {
    return MODEL_MODES
}

export function isModelModeAllowed(mode: ModelMode): boolean {
    return getModelModes().includes(mode)
}
