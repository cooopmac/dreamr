// Dream Video Generation Configuration
// Based on dream-recorder config.template.json to ensure consistent styling

export interface DreamConfig {
    // OpenAI Settings
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

    // Luma Labs Settings
    luma: {
        model: "ray-flash-2" | "ray-2" | "ray-1-6";
        resolution: "540p" | "720p" | "1080p" | "4k";
        duration: "5s" | "9s";
        aspectRatio: "9:16" | "3:4" | "1:1" | "4:3" | "16:9" | "21:9";
        extend: boolean;
        pollInterval: number; // seconds
        maxPollAttempts: number;
    };

    // Video Processing (FFmpeg-like filters for dream aesthetic)
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

// Default configuration matching dream-recorder defaults
export const DREAM_CONFIG: DreamConfig = {
    whisper: {
        model: "whisper-1",
    },

    gpt: {
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 400,
        systemPrompt: `You are a creative video prompt engineer specializing in Luma Dream Machine. Transform dream descriptions into structured JSON for cinematic video generation.

Output ONLY valid JSON in this exact format:
{
  "scene": "Main visual description with specific details, objects, and setting",
  "camera": "Camera movement and angle (e.g., 'slow dolly forward', 'aerial descent', 'static wide shot')",
  "lighting": "Lighting and atmosphere (e.g., 'golden hour glow', 'ethereal moonlight', 'soft diffused light')",
  "style": "Visual style and mood (e.g., 'dreamlike with floating particles', 'surreal and painterly', 'cinematic with depth of field')",
  "prompt": "Single cohesive sentence combining all elements for Luma"
}

Make it dreamlike, cinematic, and visually rich. Focus on ethereal, floating, glowing, and magical elements.`,
        systemPromptExtend: `You are a creative video prompt engineer specializing in Luma Dream Machine. Transform dream descriptions into structured JSON for extended cinematic video generation.

Output ONLY valid JSON in this exact format:
{
  "scene": "Main visual description for first part",
  "camera": "Camera movement for first part",
  "lighting": "Lighting for first part", 
  "style": "Visual style for first part",
  "prompt": "First part cohesive sentence",
  "extend_scene": "Visual description for second part that flows from first",
  "extend_camera": "Camera movement for second part",
  "extend_lighting": "Lighting transition for second part",
  "extend_style": "Visual style continuation",
  "extend_prompt": "Second part cohesive sentence"
}

Create seamless transitions between parts. Make it dreamlike and cinematic.`,
    },

    luma: {
        model: "ray-flash-2",
        resolution: "540p",
        duration: "5s",
        aspectRatio: "9:16",
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
    // For example: process.env.LUMA_MODEL || DREAM_CONFIG.luma.model
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

// Cost estimation (matching dream-recorder costs)
export const DREAM_COSTS = {
    openai: {
        whisper: 0.006, // per minute
        gpt4oMini: 0.00015, // per 1K input tokens, 0.0006 per 1K output tokens
    },
    luma: {
        ray_flash_2: 0.14, // per 5s video
        ray_2: 0.28, // per 5s video
    },
} as const;

export const estimateDreamCost = (
    audioMinutes: number = 1,
    extend: boolean = false
): number => {
    const whisperCost = audioMinutes * DREAM_COSTS.openai.whisper;
    const gptCost = DREAM_COSTS.openai.gpt4oMini * 2; // rough estimate for tokens
    const lumaCost = DREAM_COSTS.luma.ray_flash_2 * (extend ? 2 : 1);

    return whisperCost + gptCost + lumaCost;
};

// Video Processing Instructions (for reference or future web implementation)
// These are the exact FFmpeg filters used in dream-recorder for the dream aesthetic
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

// Preset configurations for different dream styles (future enhancement)
export const DREAM_STYLE_PRESETS = {
    cinematic: {
        ...DREAM_CONFIG,
        luma: {
            ...DREAM_CONFIG.luma,
            aspectRatio: "21:9" as const,
            resolution: "540p" as const,
        },
    },
    portrait: {
        ...DREAM_CONFIG,
        luma: {
            ...DREAM_CONFIG.luma,
            aspectRatio: "9:16" as const,
            resolution: "540p" as const,
        },
    },
    square: {
        ...DREAM_CONFIG,
        luma: {
            ...DREAM_CONFIG.luma,
            aspectRatio: "1:1" as const,
            resolution: "540p" as const,
        },
    },
} as const;
