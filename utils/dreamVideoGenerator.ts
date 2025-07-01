// Dream Video Generator - Generate videos using Luma Labs API
// Based on the dream-recorder implementation with identical settings

import { getDreamConfig } from "../constants/DreamConfig";

// Enhanced prompt structure from GPT
export interface StructuredPrompt {
    scene: string;
    camera: string;
    lighting: string;
    style: string;
    prompt: string;
    // For extended videos
    extend_scene?: string;
    extend_camera?: string;
    extend_lighting?: string;
    extend_style?: string;
    extend_prompt?: string;
}

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

    // API endpoints from dream-recorder
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
     * Generate a video from a cinematic prompt
     * @param prompt - The enhanced cinematic prompt
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
            // Notify start
            this.notifyProgress({
                status: VideoGenerationStatus.STARTING,
                message: "Starting video generation...",
                progress: 5,
            });

            // Parse extended prompt if needed
            let initialPrompt = prompt;
            let extPrompt = extensionPrompt || "Continue on with this video";

            if (extendMode && prompt.includes("*****")) {
                const [initial, extension] = prompt.split("*****", 2);
                initialPrompt = initial.trim();
                extPrompt = extension.trim();
            }

            // Step 1: Create initial generation request
            console.log(
                "🎬 Starting video generation with prompt:",
                initialPrompt
            );

            this.notifyProgress({
                status: VideoGenerationStatus.QUEUED,
                message: "Creating generation request...",
                progress: 10,
            });

            const generationId = await this.createGeneration(initialPrompt);
            console.log("✅ Generation started with ID:", generationId);

            // Step 2: Wait for initial video completion
            this.notifyProgress({
                status: VideoGenerationStatus.GENERATING,
                message: "AI is creating your dream video...",
                progress: 20,
                estimatedTimeRemaining: 120, // ~2 minutes typical
            });

            const initialVideoUrl = await this.pollForCompletion(generationId);
            console.log("✅ Initial video completed:", initialVideoUrl);

            let finalVideoUrl = initialVideoUrl;
            let finalGenerationId = generationId;

            // Step 3: Extend video if requested
            if (extendMode) {
                console.log("🔄 Extending video with prompt:", extPrompt);

                this.notifyProgress({
                    status: VideoGenerationStatus.GENERATING,
                    message: "Extending video with additional content...",
                    progress: 60,
                });

                const extendedId = await this.extendVideo(
                    generationId,
                    extPrompt
                );
                console.log("✅ Extension started with ID:", extendedId);

                finalVideoUrl = await this.pollForCompletion(extendedId);
                finalGenerationId = extendedId;
                console.log("✅ Extended video completed:", finalVideoUrl);
            }

            // Notify completion
            this.notifyProgress({
                status: VideoGenerationStatus.COMPLETED,
                message: "Video generated successfully!",
                progress: 100,
            });

            return {
                videoUrl: finalVideoUrl,
                generationId: finalGenerationId,
                prompt: initialPrompt,
                extendedPrompt: extendMode ? extPrompt : undefined,
            };
        } catch (error) {
            console.error("❌ Video generation failed:", error);

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            this.notifyProgress({
                status: VideoGenerationStatus.ERROR,
                message: `Video generation failed: ${errorMessage}`,
            });

            throw error;
        }
    }

    /**
     * Parse structured prompt from GPT (JSON) or fall back to simple string
     */
    private parseStructuredPrompt(prompt: string): {
        lumaPrompt: string;
        cameraMotion?: string;
        style?: string;
        lighting?: string;
    } {
        try {
            // Try to parse as JSON first
            const structured: StructuredPrompt = JSON.parse(prompt);

            console.log("🎨 Using structured prompt:", structured);

            return {
                lumaPrompt: structured.prompt,
                cameraMotion: this.mapCameraMovement(structured.camera),
                style: structured.style,
                lighting: structured.lighting,
            };
        } catch (error) {
            // Fall back to simple string prompt
            console.log("📝 Using simple text prompt:", prompt);
            return {
                lumaPrompt: prompt,
            };
        }
    }

    /**
     * Map camera descriptions to Luma's expected values
     */
    private mapCameraMovement(camera: string): string {
        const cameraLower = camera.toLowerCase();

        if (cameraLower.includes("static") || cameraLower.includes("still"))
            return "static";
        if (cameraLower.includes("slow") || cameraLower.includes("gentle"))
            return "slow";
        if (cameraLower.includes("fast") || cameraLower.includes("quick"))
            return "fast";
        if (cameraLower.includes("dynamic") || cameraLower.includes("moving"))
            return "dynamic";

        // Default to dynamic for dreamlike motion
        return "dynamic";
    }

    /**
     * Create a new video generation request with enhanced parameters
     */
    private async createGeneration(prompt: string): Promise<string> {
        const parsedPrompt = this.parseStructuredPrompt(prompt);

        // Build enhanced request body
        const requestBody: any = {
            prompt: parsedPrompt.lumaPrompt,
            model: this.model,
            resolution: this.resolution,
            duration: this.duration,
            aspect_ratio: this.aspectRatio,
            loop: true, // Perfect loops for dream aesthetic
        };

        // Add enhanced parameters if available
        if (parsedPrompt.cameraMotion) {
            requestBody.camera_motion = parsedPrompt.cameraMotion;
        }

        // Add style hints (Luma may not support all of these yet, but future-proofing)
        if (parsedPrompt.style) {
            // Extract style keywords for potential future parameters
            const styleKeywords = parsedPrompt.style.toLowerCase();
            if (styleKeywords.includes("cinematic")) {
                requestBody.style_preset = "cinematic";
            }
            if (
                styleKeywords.includes("dreamlike") ||
                styleKeywords.includes("ethereal")
            ) {
                requestBody.style_preset = "dreamy";
            }
        }

        console.log("🎬 Sending enhanced request to Luma:", requestBody);

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

        return data.id;
    }

    /**
     * Extend an existing video with additional content
     */
    private async extendVideo(
        baseGenerationId: string,
        extensionPrompt: string
    ): Promise<string> {
        const response = await fetch(this.GENERATIONS_ENDPOINT, {
            method: "POST",
            headers: {
                accept: "application/json",
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                resolution: this.resolution,
                duration: this.duration,
                aspect_ratio: this.aspectRatio,
                prompt: extensionPrompt,
                keyframes: {
                    frame0: {
                        type: "generation",
                        id: baseGenerationId,
                    },
                },
            }),
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

        return data.id;
    }

    /**
     * Poll for video generation completion
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
                    console.warn(
                        `Status check failed with code ${response.status}, retrying...`
                    );
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

                // Log progress periodically
                if (attempt === 0 || attempt % 10 === 0) {
                    console.log(
                        `📊 Generation status: ${state} (attempt ${
                            attempt + 1
                        }/${this.maxPollAttempts})`
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

                    console.log("🎉 Video generation completed successfully");
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
                console.warn(
                    `Polling attempt ${attempt + 1} failed, retrying...`,
                    error
                );
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

            // Create blob URL for React Native
            const blobUrl = URL.createObjectURL(blob);

            console.log("📥 Video downloaded successfully");
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
 * Helper function to generate a video directly
 * @param prompt - The cinematic prompt
 * @param apiKey - LumaLabs API key
 * @param extendMode - Whether to use extended mode (default: false)
 * @param extensionPrompt - Optional extension prompt
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
 * Enhanced generateDreamVideo with progress tracking
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

export default DreamVideoGenerator;
