import { logger } from '@/ui/logger'
import type { RpcHandlerManager } from '@/api/rpc/RpcHandlerManager'
import { listSlashCommands, type ListSlashCommandsResponse } from '../slashCommands'
import { getErrorMessage, rpcError } from '../rpcResponses'

export function registerSlashCommandHandlers(rpcHandlerManager: RpcHandlerManager): void {
    rpcHandlerManager.registerHandler<Record<string, never>, ListSlashCommandsResponse>('listSlashCommands', async () => {
        logger.debug('List slash commands request')

        try {
            const commands = await listSlashCommands()
            return { success: true, commands }
        } catch (error) {
            logger.debug('Failed to list slash commands:', error)
            return rpcError(getErrorMessage(error, 'Failed to list slash commands'))
        }
    })
}
