// Dream Video Generator - Generate videos using Luma Labs API
// Based on the dream-recorder implementation with identical settings

import { getDreamConfig } from "../constants/DreamConfig";

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
            throw new Error("Video prompt cannot be empty");
        }

        try {
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

            const generationId = await this.createGeneration(initialPrompt);
            console.log("✅ Generation started with ID:", generationId);

            // Step 2: Wait for initial video completion
            const initialVideoUrl = await this.pollForCompletion(generationId);
            console.log("✅ Initial video completed:", initialVideoUrl);

            let finalVideoUrl = initialVideoUrl;
            let finalGenerationId = generationId;

            // Step 3: Extend video if requested
            if (extendMode) {
                console.log("🔄 Extending video with prompt:", extPrompt);

                const extendedId = await this.extendVideo(
                    generationId,
                    extPrompt
                );
                console.log("✅ Extension started with ID:", extendedId);

                finalVideoUrl = await this.pollForCompletion(extendedId);
                finalGenerationId = extendedId;
                console.log("✅ Extended video completed:", finalVideoUrl);
            }

            return {
                videoUrl: finalVideoUrl,
                generationId: finalGenerationId,
                prompt: initialPrompt,
                extendedPrompt: extendMode ? extPrompt : undefined,
            };
        } catch (error) {
            console.error("❌ Video generation failed:", error);
            throw error;
        }
    }

    /**
     * Create a new video generation request
     */
    private async createGeneration(prompt: string): Promise<string> {
        const response = await fetch(this.GENERATIONS_ENDPOINT, {
            method: "POST",
            headers: {
                accept: "application/json",
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                prompt: prompt,
                model: this.model,
                resolution: this.resolution,
                duration: this.duration,
                aspect_ratio: this.aspectRatio,
            }),
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

                // Log progress periodically
                if (attempt === 0 || attempt % 10 === 0) {
                    console.log(
                        `📊 Generation status: ${data.state} (attempt ${
                            attempt + 1
                        }/${this.maxPollAttempts})`
                    );
                }

                const state = data.state;

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
    const generator = new DreamVideoGenerator({ apiKey });
    return generator.generateVideo(prompt, extendMode);
};

export default DreamVideoGenerator;
