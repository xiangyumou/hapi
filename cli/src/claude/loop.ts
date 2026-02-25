import { ApiSessionClient } from "@/api/apiSession"
import { MessageQueue2 } from "@/utils/MessageQueue2"
import { logger } from "@/ui/logger"
import { Session } from "./session"
import { claudeLocalLauncher } from "./claudeLocalLauncher"
import { claudeRemoteLauncher } from "./claudeRemoteLauncher"
import { ApiClient } from "@/lib"
import type { SessionModelMode } from "@/api/types"
export type { PermissionMode } from "@hapi/protocol/types"
import type { PermissionMode } from "@hapi/protocol/types"

export interface EnhancedMode {
    permissionMode: PermissionMode;
    model?: string;
    fallbackModel?: string;
    customSystemPrompt?: string;
    appendSystemPrompt?: string;
    allowedTools?: string[];
    disallowedTools?: string[];
}

type LoopLauncher<TSession> = (session: TSession) => Promise<'switch' | 'exit'>;

async function runLocalRemoteLoop(opts: {
    session: Session;
    startingMode?: 'local' | 'remote';
    logTag: string;
    runLocal: LoopLauncher<Session>;
    runRemote: LoopLauncher<Session>;
}): Promise<void> {
    let mode: 'local' | 'remote' = opts.startingMode ?? 'local';

    while (true) {
        logger.debug(`[${opts.logTag}] Iteration with mode: ${mode}`);

        if (mode === 'local') {
            const reason = await opts.runLocal(opts.session);
            if (reason === 'exit') {
                return;
            }
            mode = 'remote';
            opts.session.onModeChange(mode);
            continue;
        }

        if (mode === 'remote') {
            const reason = await opts.runRemote(opts.session);
            if (reason === 'exit') {
                return;
            }
            mode = 'local';
            opts.session.onModeChange(mode);
            continue;
        }
    }
}

async function runLocalRemoteSession(opts: {
    session: Session;
    startingMode?: 'local' | 'remote';
    logTag: string;
    runLocal: LoopLauncher<Session>;
    runRemote: LoopLauncher<Session>;
    onSessionReady?: (session: Session) => void;
}): Promise<void> {
    if (opts.onSessionReady) {
        opts.onSessionReady(opts.session);
    }

    await runLocalRemoteLoop({
        session: opts.session,
        startingMode: opts.startingMode,
        logTag: opts.logTag,
        runLocal: opts.runLocal,
        runRemote: opts.runRemote
    });
}

interface LoopOptions {
    path: string
    model?: string
    permissionMode?: PermissionMode
    startingMode?: 'local' | 'remote'
    startedBy?: 'runner' | 'terminal'
    onModeChange: (mode: 'local' | 'remote') => void
    mcpServers: Record<string, any>
    session: ApiSessionClient
    api: ApiClient,
    claudeEnvVars?: Record<string, string>
    claudeArgs?: string[]
    messageQueue: MessageQueue2<EnhancedMode>
    allowedTools?: string[]
    onSessionReady?: (session: Session) => void
    hookSettingsPath: string
}

export async function loop(opts: LoopOptions) {
    const logPath = logger.logFilePath;
    const startedBy = opts.startedBy ?? 'terminal';
    const startingMode = opts.startingMode ?? 'local';
    const modelMode: SessionModelMode = opts.model === 'sonnet' || opts.model === 'opus'
        ? opts.model
        : 'default';
    const session = new Session({
        api: opts.api,
        client: opts.session,
        path: opts.path,
        sessionId: null,
        claudeEnvVars: opts.claudeEnvVars,
        claudeArgs: opts.claudeArgs,
        mcpServers: opts.mcpServers,
        logPath: logPath,
        messageQueue: opts.messageQueue,
        allowedTools: opts.allowedTools,
        onModeChange: opts.onModeChange,
        mode: startingMode,
        startedBy,
        startingMode,
        hookSettingsPath: opts.hookSettingsPath,
        permissionMode: opts.permissionMode ?? 'default',
        modelMode
    });

    await runLocalRemoteSession({
        session,
        startingMode: opts.startingMode,
        logTag: 'loop',
        runLocal: claudeLocalLauncher,
        runRemote: claudeRemoteLauncher,
        onSessionReady: opts.onSessionReady
    });
}
