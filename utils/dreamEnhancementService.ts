// Dream Enhancement Service
// Uses OpenAI GPT to transform dream descriptions into cinematic video prompts

import { getGPTSystemPrompt } from "../constants/DreamConfig";

// Enhancement states for UI feedback
export enum EnhancementStatus {
    IDLE = "idle",
    ENHANCING = "enhancing",
    COMPLETED = "completed",
    ERROR = "error",
}

export interface EnhancementResult {
    status: EnhancementStatus;
    originalPrompt: string;
    enhancedPrompt?: string;
    error?: string;
    timestamp: Date;
}

export interface EnhancementProgress {
    status: EnhancementStatus;
    message: string;
    progress?: number; // 0-100 for progress bar if needed
}

class DreamEnhancementService {
    private static instance: DreamEnhancementService;
    private apiKey: string;
    private listeners: ((progress: EnhancementProgress) => void)[] = [];
    private systemPrompt: string;

    private constructor() {
        // API key from environment
        this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

        // Get system prompt from config
        this.systemPrompt = getGPTSystemPrompt(false);

        if (!this.apiKey) {
            console.warn(
                "OpenAI API key not found. Dream enhancement will not work."
            );
        }
    }

    public static getInstance(): DreamEnhancementService {
        if (!DreamEnhancementService.instance) {
            DreamEnhancementService.instance = new DreamEnhancementService();
        }
        return DreamEnhancementService.instance;
    }

    // Set API key (for when you implement backend API key management)
    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    // Subscribe to enhancement progress updates
    public onProgress(
        callback: (progress: EnhancementProgress) => void
    ): () => void {
        this.listeners.push(callback);

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(
                (listener) => listener !== callback
            );
        };
    }

    private notifyProgress(progress: EnhancementProgress): void {
        this.listeners.forEach((listener) => listener(progress));
    }

    /**
     * Enhance a dream description using OpenAI GPT
     */
    public async enhanceDream(
        dreamDescription: string
    ): Promise<EnhancementResult> {
        const startTime = new Date();

        // Validate input
        if (!dreamDescription.trim()) {
            const result: EnhancementResult = {
                status: EnhancementStatus.ERROR,
                originalPrompt: dreamDescription,
                error: "Dream description cannot be empty",
                timestamp: startTime,
            };

            this.notifyProgress({
                status: EnhancementStatus.ERROR,
                message: "Dream description cannot be empty",
            });

            return result;
        }

        // Check API key
        if (!this.apiKey) {
            const result: EnhancementResult = {
                status: EnhancementStatus.ERROR,
                originalPrompt: dreamDescription,
                error: "OpenAI API key not configured",
                timestamp: startTime,
            };

            this.notifyProgress({
                status: EnhancementStatus.ERROR,
                message: "Enhancement service not configured",
            });

            return result;
        }

        try {
            // Start enhancement
            this.notifyProgress({
                status: EnhancementStatus.ENHANCING,
                message: "Transforming dream into cinematic prompt...",
                progress: 30,
            });

            const completion = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: this.systemPrompt,
                            },
                            {
                                role: "user",
                                content: dreamDescription,
                            },
                        ],
                        max_tokens: 400,
                        temperature: 0.7,
                    }),
                }
            );

            if (!completion.ok) {
                const errorData = await completion.json().catch(() => ({}));
                throw new Error(
                    `OpenAI API error: ${completion.status} - ${
                        errorData.error?.message ||
                        errorData.message ||
                        "Unknown error"
                    }`
                );
            }

            const data = await completion.json();
            const rawResponse = data.choices[0]?.message?.content?.trim();

            if (!rawResponse) {
                throw new Error("No response from OpenAI");
            }

            console.log("🎨 Raw GPT response:", rawResponse);

            // Parse the response (could be JSON or plain text)
            let enhancedPrompt = rawResponse;

            try {
                // Try to parse as JSON first
                const structuredResponse = JSON.parse(rawResponse);

                if (structuredResponse.prompt) {
                    // Use the combined prompt from structured response
                    enhancedPrompt = rawResponse; // Keep full JSON for video generator
                    console.log(
                        "✅ Parsed structured prompt:",
                        structuredResponse
                    );
                } else {
                    // Fallback if JSON doesn't have expected structure
                    enhancedPrompt = rawResponse;
                }
            } catch (jsonError) {
                // Not JSON, use as-is (backwards compatibility)
                console.log("📝 Using plain text response");
                enhancedPrompt = rawResponse;
            }

            const result: EnhancementResult = {
                status: EnhancementStatus.COMPLETED,
                originalPrompt: dreamDescription,
                enhancedPrompt: enhancedPrompt,
                timestamp: startTime,
            };

            this.notifyProgress({
                status: EnhancementStatus.COMPLETED,
                message: "Dream enhanced successfully!",
                progress: 100,
            });

            return result;
        } catch (error) {
            console.error("Dream enhancement failed:", error);

            let errorMessage = "Failed to enhance dream description";

            if (error instanceof Error) {
                if (
                    error.message.includes("quota") ||
                    error.message.includes("billing")
                ) {
                    errorMessage = "OpenAI quota exceeded or billing issue";
                } else if (
                    error.message.includes("network") ||
                    error.message.includes("fetch")
                ) {
                    errorMessage =
                        "Network error - please check your connection";
                } else if (error.message.includes("API key")) {
                    errorMessage = "Invalid OpenAI API key";
                } else {
                    errorMessage = error.message;
                }
            }

            const result: EnhancementResult = {
                status: EnhancementStatus.ERROR,
                originalPrompt: dreamDescription,
                error: errorMessage,
                timestamp: startTime,
            };

            this.notifyProgress({
                status: EnhancementStatus.ERROR,
                message: errorMessage,
            });

            return result;
        }
    }

    /**
     * Test if the enhancement service is properly configured
     */
    public async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            // Test with a simple dream description
            const result = await this.enhanceDream(
                "I was flying over a beautiful landscape"
            );
            return result.status === EnhancementStatus.COMPLETED;
        } catch (error) {
            console.error("Enhancement service test failed:", error);
            return false;
        }
    }
}

// Export singleton instance and helper functions
export const dreamEnhancementService = DreamEnhancementService.getInstance();

/**
 * Simple function to enhance a dream description
 */
export const enhanceDream = async (
    dreamDescription: string
): Promise<EnhancementResult> => {
    return dreamEnhancementService.enhanceDream(dreamDescription);
};

/**
 * Subscribe to enhancement progress
 */
export const onEnhancementProgress = (
    callback: (progress: EnhancementProgress) => void
): (() => void) => {
    return dreamEnhancementService.onProgress(callback);
};

export default dreamEnhancementService;
