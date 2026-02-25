import { ApiClient, ApiSessionClient } from '@/lib';
import { MessageQueue2 } from '@/utils/MessageQueue2';
import { logger } from '@/ui/logger';
import type { Metadata, SessionModelMode, SessionPermissionMode } from '@/api/types';
import type { EnhancedMode } from './loop';
import type { PermissionMode } from './loop';
import type { LocalLaunchExitReason } from './localLaunchPolicy';

type LocalLaunchFailure = {
    message: string;
    exitReason: LocalLaunchExitReason;
};

export class Session {
    readonly path: string;
    readonly logPath: string;
    readonly api: ApiClient;
    readonly client: ApiSessionClient;
    readonly queue: MessageQueue2<EnhancedMode>;
    protected readonly _onModeChange: (mode: 'local' | 'remote') => void;

    sessionId: string | null;
    mode: 'local' | 'remote' = 'local';
    thinking: boolean = false;

    private sessionFoundCallbacks: ((sessionId: string) => void)[] = [];
    private keepAliveInterval: NodeJS.Timeout | null = null;
    protected permissionMode?: SessionPermissionMode;
    protected modelMode?: SessionModelMode;

    readonly claudeEnvVars?: Record<string, string>;
    claudeArgs?: string[];
    readonly mcpServers: Record<string, any>;
    readonly allowedTools?: string[];
    readonly hookSettingsPath: string;
    readonly startedBy: 'runner' | 'terminal';
    readonly startingMode: 'local' | 'remote';
    localLaunchFailure: LocalLaunchFailure | null = null;

    constructor(opts: {
        api: ApiClient;
        client: ApiSessionClient;
        path: string;
        logPath: string;
        sessionId: string | null;
        claudeEnvVars?: Record<string, string>;
        claudeArgs?: string[];
        mcpServers: Record<string, any>;
        messageQueue: MessageQueue2<EnhancedMode>;
        onModeChange: (mode: 'local' | 'remote') => void;
        allowedTools?: string[];
        mode?: 'local' | 'remote';
        startedBy: 'runner' | 'terminal';
        startingMode: 'local' | 'remote';
        hookSettingsPath: string;
        permissionMode?: PermissionMode;
        modelMode?: SessionModelMode;
    }) {
        this.path = opts.path;
        this.api = opts.api;
        this.client = opts.client;
        this.logPath = opts.logPath;
        this.sessionId = opts.sessionId;
        this.queue = opts.messageQueue;
        this._onModeChange = opts.onModeChange;
        this.mode = opts.mode ?? 'local';
        this.permissionMode = opts.permissionMode;
        this.modelMode = opts.modelMode;

        this.claudeEnvVars = opts.claudeEnvVars;
        this.claudeArgs = opts.claudeArgs;
        this.mcpServers = opts.mcpServers;
        this.allowedTools = opts.allowedTools;
        this.hookSettingsPath = opts.hookSettingsPath;
        this.startedBy = opts.startedBy;
        this.startingMode = opts.startingMode;

        this.client.keepAlive(this.thinking, this.mode, this.getKeepAliveRuntime());
        this.keepAliveInterval = setInterval(() => {
            this.client.keepAlive(this.thinking, this.mode, this.getKeepAliveRuntime());
        }, 2000);
    }

    onThinkingChange = (thinking: boolean) => {
        this.thinking = thinking;
        this.client.keepAlive(thinking, this.mode, this.getKeepAliveRuntime());
    };

    onModeChange = (mode: 'local' | 'remote') => {
        this.mode = mode;
        this.client.keepAlive(this.thinking, mode, this.getKeepAliveRuntime());
        const permissionLabel = this.permissionMode ?? 'unset';
        const modelLabel = this.modelMode ?? 'unset';
        logger.debug(`[Session] Mode switched to ${mode} (permissionMode=${permissionLabel}, modelMode=${modelLabel})`);
        this._onModeChange(mode);
    };

    onSessionFound = (sessionId: string) => {
        this.sessionId = sessionId;
        this.client.updateMetadata((metadata: Metadata) => ({
            ...metadata,
            claudeSessionId: sessionId
        }));
        logger.debug(`[Session] Claude Code session ID ${sessionId} added to metadata`);

        for (const callback of this.sessionFoundCallbacks) {
            callback(sessionId);
        }
    };

    addSessionFoundCallback = (callback: (sessionId: string) => void): void => {
        this.sessionFoundCallbacks.push(callback);
    };

    removeSessionFoundCallback = (callback: (sessionId: string) => void): void => {
        const index = this.sessionFoundCallbacks.indexOf(callback);
        if (index !== -1) {
            this.sessionFoundCallbacks.splice(index, 1);
        }
    };

    stopKeepAlive = (): void => {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    };

    protected getKeepAliveRuntime(): { permissionMode?: SessionPermissionMode; modelMode?: SessionModelMode } | undefined {
        if (this.permissionMode === undefined && this.modelMode === undefined) {
            return undefined;
        }
        return {
            permissionMode: this.permissionMode,
            modelMode: this.modelMode
        };
    }

    getPermissionMode(): SessionPermissionMode | undefined {
        return this.permissionMode;
    }

    getModelMode(): SessionModelMode | undefined {
        return this.modelMode;
    }

    setPermissionMode = (mode: PermissionMode): void => {
        this.permissionMode = mode;
    };

    setModelMode = (mode: SessionModelMode): void => {
        this.modelMode = mode;
    };

    recordLocalLaunchFailure = (message: string, exitReason: LocalLaunchExitReason): void => {
        this.localLaunchFailure = { message, exitReason };
    };

    /**
     * Clear the current session ID (used by /clear command)
     */
    clearSessionId = (): void => {
        this.sessionId = null;
        logger.debug('[Session] Session ID cleared');
    };

    /**
     * Consume one-time Claude flags from claudeArgs after Claude spawn
     * Currently handles: --resume (with or without session ID)
     */
    consumeOneTimeFlags = (): void => {
        if (!this.claudeArgs) return;

        const filteredArgs: string[] = [];
        for (let i = 0; i < this.claudeArgs.length; i++) {
            if (this.claudeArgs[i] === '--resume') {
                if (i + 1 < this.claudeArgs.length) {
                    const nextArg = this.claudeArgs[i + 1];
                    if (!nextArg.startsWith('-') && nextArg.includes('-')) {
                        i++;
                        logger.debug(`[Session] Consumed --resume flag with session ID: ${nextArg}`);
                    } else {
                        logger.debug('[Session] Consumed --resume flag (no session ID)');
                    }
                } else {
                    logger.debug('[Session] Consumed --resume flag (no session ID)');
                }
            } else {
                filteredArgs.push(this.claudeArgs[i]);
            }
        }

        this.claudeArgs = filteredArgs.length > 0 ? filteredArgs : undefined;
        logger.debug(`[Session] Consumed one-time flags, remaining args:`, this.claudeArgs);
    };
}
