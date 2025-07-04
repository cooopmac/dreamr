// Dream Video Generation Configuration
// Based on dream-recorder config to ensure identical behavior

export interface DreamConfig {
    // OpenAI Settings (matching dream-recorder)
    whisper: {
        model: "whisper-1" | "gpt-4o-transcribe" | "gpt-4o-mini-transcribe";
    };

    gpt: {
        model: "gpt-4o-mini" | "gpt-4o" | "o1-mini";
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
        systemPromptExtend: string;
    };

    // Luma Labs Settings (matching dream-recorder)
    luma: {
        model: "ray-flash-2" | "ray-2" | "ray-1-6";
        resolution: "540p" | "720p" | "1080p" | "4k";
        duration: "5s" | "9s";
        aspectRatio: "9:16" | "3:4" | "1:1" | "4:3" | "16:9" | "21:9";
        extend: boolean;
        pollInterval: number; // seconds
        maxPollAttempts: number;
    };

    // Video Processing (FFmpeg filters for dream aesthetic)
    videoProcessing: {
        brightness: number; // 0.2
        vibrance: number; // 2
        denoiseThreshold: number; // 300
        bilateralSigma: number; // 100
        noiseStrength: number; // 40
    };

    // Audio Recording
    audio: {
        channels: 1 | 2;
        sampleWidth: number;
        frameRate: number;
    };

    // UI/UX Settings
    ui: {
        playbackDuration: number; // seconds
        videoHistoryLimit: number;
        logoFadeInDuration: number; // ms
        logoFadeOutDuration: number; // ms
        transitionDelay: number; // ms
        clockFadeInDuration: number; // ms
        clockFadeOutDuration: number; // ms
    };
}

// System prompts matching dream-recorder exactly
const DREAM_RECORDER_SYSTEM_PROMPT = `You are a creative video prompt engineer specializing in Luma Dream Machine. Your task is to transform dream descriptions into cinematic video prompts using clear, simple language. Be specific about useful visual elements and emotional tone. Keep the prompt concise but rich in visual detail, formatted as a single, succinct sentence.`;

const DREAM_RECORDER_SYSTEM_PROMPT_EXTEND = `You are a creative video prompt engineer specializing in Luma Dream Machine. Your task is to transform dream descriptions into cinematic video prompts using clear, simple language. Be specific about useful visual elements and emotional tone. Keep the prompt concise but rich in visual detail, formatted as two succinct sentences. Break down the prompt into exactly two clear separate parts, using '*****' as a separator between part one and part two.`;

// Default configuration matching dream-recorder
export const DREAM_CONFIG: DreamConfig = {
    whisper: {
        model: "whisper-1",
    },

    gpt: {
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 400,
        systemPrompt: DREAM_RECORDER_SYSTEM_PROMPT,
        systemPromptExtend: DREAM_RECORDER_SYSTEM_PROMPT_EXTEND,
    },

    luma: {
        model: "ray-flash-2",
        resolution: "540p",
        duration: "5s",
        aspectRatio: "1:1",
        extend: false,
        pollInterval: 5,
        maxPollAttempts: 100,
    },

    videoProcessing: {
        brightness: 0.2,
        vibrance: 2,
        denoiseThreshold: 300,
        bilateralSigma: 100,
        noiseStrength: 40,
    },

    audio: {
        channels: 1,
        sampleWidth: 2,
        frameRate: 44100,
    },

    ui: {
        playbackDuration: 120,
        videoHistoryLimit: 7,
        logoFadeInDuration: 2000,
        logoFadeOutDuration: 1000,
        transitionDelay: 100,
        clockFadeInDuration: 500,
        clockFadeOutDuration: 500,
    },
};

// Configuration getter with environment overrides
export const getDreamConfig = (): DreamConfig => {
    // You can add environment variable overrides here if needed
    return DREAM_CONFIG;
};

// Helper functions for specific configs
export const getGPTSystemPrompt = (extend: boolean = false): string => {
    const config = getDreamConfig();
    return extend ? config.gpt.systemPromptExtend : config.gpt.systemPrompt;
};

export const getLumaConfig = () => {
    const config = getDreamConfig();
    return {
        model: config.luma.model,
        resolution: config.luma.resolution,
        duration: config.luma.duration,
        aspect_ratio: config.luma.aspectRatio,
    };
};

export const getVideoProcessingConfig = () => {
    const config = getDreamConfig();
    return config.videoProcessing;
};

// Cost estimation helper
export const estimateDreamCost = (
    audioMinutes: number = 1,
    extend: boolean = false
): number => {
    // OpenAI costs (Whisper + GPT)
    const whisperCost = audioMinutes * 0.006; // $0.006 per minute
    const gptCost = 0.002; // ~$0.002 per request

    // Luma costs
    const lumaCost = extend ? 0.28 : 0.14; // $0.14 per 5s video, $0.28 for extended

    return whisperCost + gptCost + lumaCost;
};

// Video Processing Instructions (for reference or future implementation)
// These are the exact FFmpeg filters used in dream-recorder
export const VIDEO_PROCESSING_INSTRUCTIONS = {
    filters: [
        `eq=brightness=${DREAM_CONFIG.videoProcessing.brightness}`, // Slight brightness boost
        `vibrance=intensity=${DREAM_CONFIG.videoProcessing.vibrance}`, // Enhanced color vibrance
        `vaguedenoiser=threshold=${DREAM_CONFIG.videoProcessing.denoiseThreshold}`, // Denoise for cleaner look
        `bilateral=sigmaS=${DREAM_CONFIG.videoProcessing.bilateralSigma}`, // Bilateral filtering
        `noise=all_strength=${DREAM_CONFIG.videoProcessing.noiseStrength}`, // Add subtle film grain
    ],
    description:
        "These filters create the signature dream-like aesthetic: enhanced brightness and vibrance for vivid colors, denoising for clarity, bilateral filtering for smooth edges, and subtle noise for organic texture.",
} as const;
