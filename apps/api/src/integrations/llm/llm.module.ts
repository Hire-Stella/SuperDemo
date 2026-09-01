import { Global, Logger, Module } from '@nestjs/common';
import type { ApiEnv, LlmProvider } from '@superdemo/contracts';
import { ENV } from '../../config/config.module';
import { ScriptedBrain } from './scripted.brain';
import { ClaudeBrain } from './claude.brain';
import { OllamaBrain } from './ollama.brain';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

/**
 * Driver selection happens once, at boot, from LLM_DRIVER. Everything
 * downstream depends on the LlmProvider interface and cannot tell which brain
 * it is talking to.
 */
@Global()
@Module({
  providers: [
    ScriptedBrain,
    OllamaBrain,
    // Claude is only constructed when selected — instantiating it without a key
    // would be pointless, and the env schema already refuses that combination.
    {
      provide: ClaudeBrain,
      useFactory: (env: ApiEnv) => (env.LLM_DRIVER === 'claude' ? new ClaudeBrain(env) : null),
      inject: [ENV],
    },
    {
      provide: LLM_PROVIDER,
      useFactory: (
        env: ApiEnv,
        scripted: ScriptedBrain,
        ollama: OllamaBrain,
        claude: ClaudeBrain | null,
      ): LlmProvider => {
        const log = new Logger('LlmModule');
        switch (env.LLM_DRIVER) {
          case 'claude':
            if (!claude) throw new Error('Claude brain selected but could not be constructed');
            log.log(`conversation brain: claude (${env.ANTHROPIC_MODEL})`);
            return claude;
          case 'ollama':
            log.log(`conversation brain: ollama (${env.OLLAMA_MODEL})`);
            return ollama;
          case 'scripted':
          default:
            log.log('conversation brain: scripted (deterministic KB retrieval, zero cost)');
            return scripted;
        }
      },
      inject: [ENV, ScriptedBrain, OllamaBrain, ClaudeBrain],
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
