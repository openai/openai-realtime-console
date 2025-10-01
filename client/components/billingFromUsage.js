// client/components/billingFromUsage.js

// GPT-4o Realtime Prices (September 2025)
// $4.00 / 1M input tokens (text)
// $16.00 / 1M output tokens (text)
// $0.40 / 1M cached input tokens
// $32.00 / 1M input audio tokens
// $64.00 / 1M output audio tokens

const RATES_PER_1M = {
  text_input: 4.0,
  text_output: 16.0,
  cached_input: 0.4,
  audio_input: 32.0,
  audio_output: 64.0,
};

const RATE = {
  text_input: RATES_PER_1M.text_input / 1_000_000,
  text_output: RATES_PER_1M.text_output / 1_000_000,
  cached_input: RATES_PER_1M.cached_input / 1_000_000,
  audio_input: RATES_PER_1M.audio_input / 1_000_000,
  audio_output: RATES_PER_1M.audio_output / 1_000_000,
};

export function computeCostFromUsage(usage) {
  if (!usage) {
    return { total: 0, breakdown: {}, tokens: {} };
  }

  const inputText = usage.input_token_details?.text_tokens ?? 0;
  const inputAudio = usage.input_token_details?.audio_tokens ?? 0;
  const cached = usage.input_token_details?.cached_tokens ?? 0;
  const outputText = usage.output_token_details?.text_tokens ?? 0;
  const outputAudio = usage.output_token_details?.audio_tokens ?? 0;

  const costInText = Math.max(0, inputText - cached) * RATE.text_input;
  const costInAudio = inputAudio * RATE.audio_input;
  const costCached = cached * RATE.cached_input;
  const costOutText = outputText * RATE.text_output;
  const costOutAudio = outputAudio * RATE.audio_output;

  const total = costInText + costInAudio + costCached + costOutText + costOutAudio;

  return {
    total,
    breakdown: {
      costInText,
      costInAudio,
      costCached,
      costOutText,
      costOutAudio,
    },
    tokens: {
      inputText,
      inputAudio,
      cached,
      outputText,
      outputAudio,
    },
  };
}
