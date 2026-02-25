export type AgentType = 'claude'
export type SessionType = 'simple' | 'worktree'

export const MODEL_OPTIONS: Record<AgentType, { value: string; label: string }[]> = {
    claude: [
        { value: 'auto', label: 'Auto' },
        { value: 'opus', label: 'Opus' },
        { value: 'sonnet', label: 'Sonnet' },
    ],
}
