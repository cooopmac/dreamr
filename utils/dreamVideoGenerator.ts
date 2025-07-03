// Dream Video Generator - Generate videos using Luma Labs API
// Based on dream-recorder implementation with identical behavior

import { getDreamConfig } from "../constants/DreamConfig";

// Progress tracking interfaces
export enum VideoGenerationStatus {
    IDLE = "idle",
    STARTING = "starting",
    QUEUED = "queued",
    GENERATING = "generating",
    COMPLETED = "completed",
    ERROR = "error",
}

export interface VideoGenerationProgress {
    status: VideoGenerationStatus;
    message: string;
    progress?: number; // 0-100
    attempt?: number;
    maxAttempts?: number;
    estimatedTimeRemaining?: number; // seconds
}

// API response interfaces
interface LumaGenerationResponse {
    id: string;
    state?: string;
    assets?: {
        video?: string;
        url?: string;
        videos?: {
            url?: string;
        };
    };
    result?: {
        url?: string;
    };
    failure_reason?: string;
    error?: string;
}

interface VideoGenerationConfig {
    apiKey: string;
    model?: string;
    resolution?: string;
    duration?: string;
    aspectRatio?: string;
    pollInterval?: number;
    maxPollAttempts?: number;
}

interface GeneratedVideo {
    videoUrl: string;
    generationId: string;
    prompt: string;
    extendedPrompt?: string;
}

class DreamVideoGenerator {
    private apiKey: string;
    private model: string;
    private resolution: string;
    private duration: string;
    private aspectRatio: string;
    private pollInterval: number;
    private maxPollAttempts: number;

    // Progress tracking
    private progressListeners: ((progress: VideoGenerationProgress) => void)[] =
        [];

    // API endpoints (matching dream-recorder)
    private readonly API_BASE_URL = "https://api.lumalabs.ai/dream-machine/v1";
    private readonly GENERATIONS_ENDPOINT = `${this.API_BASE_URL}/generations`;

    constructor(config: VideoGenerationConfig) {
        this.apiKey = config.apiKey;
        // Use centralized dream config defaults
        const dreamConfig = getDreamConfig();
        this.model = config.model || dreamConfig.luma.model;
        this.resolution = config.resolution || dreamConfig.luma.resolution;
        this.duration = config.duration || dreamConfig.luma.duration;
        this.aspectRatio = config.aspectRatio || dreamConfig.luma.aspectRatio;
        this.pollInterval =
            config.pollInterval || dreamConfig.luma.pollInterval;
        this.maxPollAttempts =
            config.maxPollAttempts || dreamConfig.luma.maxPollAttempts;
    }

    /**
     * Subscribe to progress updates
     */
    public onProgress(
        callback: (progress: VideoGenerationProgress) => void
    ): () => void {
        this.progressListeners.push(callback);
        return () => {
            this.progressListeners = this.progressListeners.filter(
                (listener) => listener !== callback
            );
        };
    }

    /**
     * Notify all progress listeners
     */
    private notifyProgress(progress: VideoGenerationProgress): void {
        this.progressListeners.forEach((listener) => {
            try {
                listener(progress);
            } catch (error) {
                console.warn("Progress listener error:", error);
            }
        });
    }

    /**
     * Generate a video from a natural language prompt (matching dream-recorder)
     * @param prompt - Simple natural language prompt from GPT
     * @param extendMode - Whether to create an extended video (default: false)
     * @param extensionPrompt - The prompt for the second part (used if extendMode is true)
     * @returns Generated video information
     */
    async generateVideo(
        prompt: string,
        extendMode: boolean = false,
        extensionPrompt?: string
    ): Promise<GeneratedVideo> {
        if (!prompt.trim()) {
            const error = "Video prompt cannot be empty";
            this.notifyProgress({
                status: VideoGenerationStatus.ERROR,
                message: error,
            });
            throw new Error(error);
        }

        try {
            // Use the prompt as-is (simple natural language from GPT)
            let processedPrompt = prompt.trim();
            let extPrompt = extensionPrompt || "Continue on with this video";

            // Handle ***** separator for extended mode (like dream-recorder)
            if (extendMode && prompt.includes("*****")) {
                const parts = prompt.split("*****");
                processedPrompt = parts[0]?.trim() || prompt;
                extPrompt = parts[1]?.trim() || extPrompt;
            }

            // Step 1: Create initial generation request
            console.log(
                "🎬 Generating video:",
                processedPrompt.substring(0, 100) +
                    (processedPrompt.length > 100 ? "..." : "")
            );

            this.notifyProgress({
                status: VideoGenerationStatus.STARTING,
                message: "Starting video generation...",
                progress: 5,
            });

            const generationId = await this.createGeneration(processedPrompt);

            // Step 2: Wait for initial video completion
            this.notifyProgress({
                status: VideoGenerationStatus.GENERATING,
                message: "AI is creating your dream video...",
                progress: 20,
                estimatedTimeRemaining: 120,
            });

            const initialVideoUrl = await this.pollForCompletion(generationId);

            let finalVideoUrl = initialVideoUrl;
            let finalGenerationId = generationId;

            // Step 3: Extend video if requested
            if (extendMode) {
                console.log("🔄 Extending video...");

                this.notifyProgress({
                    status: VideoGenerationStatus.GENERATING,
                    message: "Extending video with additional content...",
                    progress: 60,
                });

                const extendedId = await this.extendVideo(
                    generationId,
                    extPrompt
                );
                finalVideoUrl = await this.pollForCompletion(extendedId);
                finalGenerationId = extendedId;
            }

            // Notify completion
            this.notifyProgress({
                status: VideoGenerationStatus.COMPLETED,
                message: "Video generated successfully!",
                progress: 100,
            });

            console.log("✅ Video completed successfully");

            return {
                videoUrl: finalVideoUrl,
                generationId: finalGenerationId,
                prompt: processedPrompt,
                extendedPrompt: extendMode ? extPrompt : undefined,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("❌ Video generation failed:", errorMessage);

            this.notifyProgress({
                status: VideoGenerationStatus.ERROR,
                message: `Video generation failed: ${errorMessage}`,
            });

            throw error;
        }
    }

    /**
     * Create a new video generation request (matching dream-recorder exactly)
     */
    private async createGeneration(prompt: string): Promise<string> {
        const requestBody = {
            prompt: prompt.trim(),
            model: this.model,
            resolution: this.resolution,
            duration: this.duration,
            aspect_ratio: this.aspectRatio,
            loop: true, // Make videos loop seamlessly
        };

        const response = await fetch(this.GENERATIONS_ENDPOINT, {
            method: "POST",
            headers: {
                accept: "application/json",
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `LumaLabs API error: ${response.status} - ${errorText}`
            );
        }

        const data: LumaGenerationResponse = await response.json();

        if (!data.id) {
            throw new Error(
                "Failed to get generation ID from LumaLabs response"
            );
        }

        console.log("🎬 Generation started:", data.id);
        return data.id;
    }

    /**
     * Extend an existing video with additional content (matching dream-recorder)
     */
    private async extendVideo(
        baseGenerationId: string,
        extensionPrompt: string
    ): Promise<string> {
        // Parse extension prompt if it contains the ***** separator (like dream-recorder)
        let promptToUse = extensionPrompt;
        if (extensionPrompt.includes("*****")) {
            // Use the second part after the separator
            const parts = extensionPrompt.split("*****");
            promptToUse = parts[1]?.trim() || extensionPrompt;
        }

        const requestBody = {
            model: this.model,
            resolution: this.resolution,
            duration: this.duration,
            aspect_ratio: this.aspectRatio,
            loop: true, // Make extended videos loop seamlessly
            prompt: promptToUse,
            keyframes: {
                frame0: {
                    type: "generation",
                    id: baseGenerationId,
                },
            },
        };

        const response = await fetch(this.GENERATIONS_ENDPOINT, {
            method: "POST",
            headers: {
                accept: "application/json",
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `LumaLabs API error (extend): ${response.status} - ${errorText}`
            );
        }

        const data: LumaGenerationResponse = await response.json();

        if (!data.id) {
            throw new Error(
                "Failed to get extension generation ID from LumaLabs response"
            );
        }

        console.log("🔄 Extension started:", data.id);
        return data.id;
    }

    /**
     * Poll for video generation completion (matching dream-recorder)
     */
    private async pollForCompletion(generationId: string): Promise<string> {
        for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
            try {
                const response = await fetch(
                    `${this.API_BASE_URL}/generations/${generationId}`,
                    {
                        headers: {
                            accept: "application/json",
                            authorization: `Bearer ${this.apiKey}`,
                        },
                    }
                );

                if (!response.ok) {
                    if (attempt % 10 === 0) {
                        console.warn(
                            `Status check failed (${response.status}), retrying...`
                        );
                    }
                    await this.sleep(this.pollInterval);
                    continue;
                }

                const data: LumaGenerationResponse = await response.json();
                const state = data.state;

                // Calculate progress based on attempt and state
                let progress = 20 + (attempt / this.maxPollAttempts) * 70; // 20-90%
                let message = "AI is creating your dream video...";
                let estimatedTime = Math.max(
                    120 - attempt * this.pollInterval,
                    10
                );

                // Update message based on state
                if (state === "queued") {
                    message = "Video request queued for processing...";
                    progress = Math.min(progress, 40);
                } else if (state === "processing" || state === "generating") {
                    message = "AI is dreaming your video...";
                    progress = Math.max(progress, 50);
                } else if (state === "completed" || state === "succeeded") {
                    message = "Finalizing your dream video...";
                    progress = 95;
                }

                // Send progress update
                this.notifyProgress({
                    status: VideoGenerationStatus.GENERATING,
                    message,
                    progress: Math.round(progress),
                    attempt: attempt + 1,
                    maxAttempts: this.maxPollAttempts,
                    estimatedTimeRemaining: estimatedTime,
                });

                // Log progress less frequently (every 20 attempts or on state change)
                if (
                    attempt === 0 ||
                    attempt % 20 === 0 ||
                    state === "completed" ||
                    state === "succeeded"
                ) {
                    console.log(
                        `📊 ${state} (${attempt + 1}/${this.maxPollAttempts})`
                    );
                }

                if (state === "completed" || state === "succeeded") {
                    // Extract video URL from various possible locations in response
                    const videoUrl = this.extractVideoUrl(data);

                    if (!videoUrl) {
                        throw new Error(
                            "Video URL not found in completed response"
                        );
                    }

                    return videoUrl;
                }

                if (state === "failed" || state === "error") {
                    const errorMsg =
                        data.failure_reason || data.error || "Unknown error";
                    throw new Error(`Video generation failed: ${errorMsg}`);
                }

                // Continue polling
                await this.sleep(this.pollInterval);
            } catch (error) {
                if (attempt === this.maxPollAttempts - 1) {
                    throw error;
                }
                if (attempt % 10 === 0) {
                    console.warn(
                        `Polling attempt ${attempt + 1} failed, retrying...`
                    );
                }
                await this.sleep(this.pollInterval);
            }
        }

        throw new Error(
            `Timed out waiting for video generation after ${this.maxPollAttempts} attempts`
        );
    }

    /**
     * Extract video URL from LumaLabs response (handles various response formats)
     */
    private extractVideoUrl(data: LumaGenerationResponse): string | null {
        // Try assets.video
        if (data.assets?.video) {
            return data.assets.video;
        }

        // Try assets.url
        if (data.assets?.url) {
            return data.assets.url;
        }

        // Try assets.videos.url
        if (data.assets?.videos?.url) {
            return data.assets.videos.url;
        }

        // Try result.url
        if (data.result?.url) {
            return data.result.url;
        }

        return null;
    }

    /**
     * Download video from URL to local storage
     * @param videoUrl - The URL of the generated video
     * @param filename - Optional custom filename
     * @returns Local file path or blob URL
     */
    async downloadVideo(videoUrl: string, filename?: string): Promise<string> {
        try {
            const response = await fetch(videoUrl);

            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            console.log("📥 Video downloaded");
            return blobUrl;
        } catch (error) {
            console.error("❌ Video download failed:", error);
            throw error;
        }
    }

    /**
     * Test connection to LumaLabs API
     */
    async testConnection(): Promise<boolean> {
        try {
            // Test with a simple request to check API access
            const response = await fetch(`${this.API_BASE_URL}/generations`, {
                method: "GET",
                headers: {
                    authorization: `Bearer ${this.apiKey}`,
                },
            });

            return response.status !== 401; // Not unauthorized
        } catch (error) {
            console.error("LumaLabs API connection test failed:", error);
            return false;
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<VideoGenerationConfig>): void {
        if (config.apiKey) this.apiKey = config.apiKey;
        if (config.model) this.model = config.model;
        if (config.resolution) this.resolution = config.resolution;
        if (config.duration) this.duration = config.duration;
        if (config.aspectRatio) this.aspectRatio = config.aspectRatio;
        if (config.pollInterval) this.pollInterval = config.pollInterval;
        if (config.maxPollAttempts)
            this.maxPollAttempts = config.maxPollAttempts;
    }

    /**
     * Sleep utility for polling delays
     */
    private sleep(seconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
}

// Export singleton instance management
let videoGeneratorInstance: DreamVideoGenerator | null = null;

/**
 * Initialize the video generator with configuration
 */
export const initializeVideoGenerator = (
    config: VideoGenerationConfig
): DreamVideoGenerator => {
    videoGeneratorInstance = new DreamVideoGenerator(config);
    return videoGeneratorInstance;
};

/**
 * Get the initialized video generator instance
 */
export const getVideoGenerator = (): DreamVideoGenerator => {
    if (!videoGeneratorInstance) {
        throw new Error(
            "Video generator not initialized. Call initializeVideoGenerator first."
        );
    }
    return videoGeneratorInstance;
};

/**
 * Helper function to generate a video directly (matching dream-recorder)
 * @param prompt - Simple natural language prompt from GPT
 * @param apiKey - LumaLabs API key
 * @param extendMode - Whether to use extended mode (default: false)
 * @returns Generated video information
 */
export const generateDreamVideo = async (
    prompt: string,
    apiKey: string,
    extendMode: boolean = false
): Promise<GeneratedVideo> => {
    const generator = new DreamVideoGenerator({
        apiKey,
        // Use defaults from dream config for other settings
    });

    return generator.generateVideo(prompt, extendMode);
};

// Global progress tracking
let globalGenerator: DreamVideoGenerator | null = null;

/**
 * Subscribe to video generation progress updates
 */
export const onVideoGenerationProgress = (
    callback: (progress: VideoGenerationProgress) => void
): (() => void) => {
    if (!globalGenerator) {
        // Create a temporary generator for progress tracking
        // This will be replaced when actual generation starts
        globalGenerator = new DreamVideoGenerator({
            apiKey: "", // Will be set when generation starts
        });
    }

    return globalGenerator.onProgress(callback);
};

/**
 * Enhanced generateDreamVideo with progress tracking (matching dream-recorder behavior)
 */
export const generateDreamVideoWithProgress = async (
    prompt: string,
    apiKey: string,
    extendMode: boolean = false
): Promise<GeneratedVideo> => {
    // Create/update global generator
    globalGenerator = new DreamVideoGenerator({
        apiKey,
    });

    return globalGenerator.generateVideo(prompt, extendMode);
};

/**
 * Create a video processing service for post-processing downloaded videos
 * This is where the dream aesthetic will be applied (like dream-recorder does)
 * TODO: Implement FFmpeg-based post-processing for dream effects
 */
export const createVideoProcessor = () => {
    // This will be implemented to apply dream effects via post-processing
    // after videos are downloaded from Luma, just like dream-recorder does
    console.log("🎭 Video post-processing not yet implemented");
    console.log("💡 Dream effects should be applied here via FFmpeg filters");
};

export default DreamVideoGenerator;

/* 
EXAMPLE OF WHAT LUMA WILL RECEIVE (Dream-Recorder Style):

When you send a simple prompt from GPT, Luma will receive clean, natural language:

{
    "prompt": "white doves soaring through deep blue sky, their wings dissolving and morphing into pink and purple clouds, feathers transforming into wisps of vapor",
    "model": "ray-flash-2", 
    "resolution": "540p",
    "duration": "5s",
    "aspect_ratio": "1:1"
}

Simple, natural language prompts work best with Luma. The dream aesthetic will be applied
through post-processing filters (FFmpeg) after download, just like the dream-recorder does.
This approach produces much better, more predictable results than overloading Luma with 
style descriptions.
*/
