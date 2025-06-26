// Dream Prompt Enhancer - Convert dream descriptions into cinematic video prompts
// Based on the dream-recorder implementation

interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface DreamPromptConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

class DreamPromptEnhancer {
    private apiKey: string;
    private model: string;
    private temperature: number;
    private maxTokens: number;

    // System prompts extracted from dream-recorder
    private readonly SYSTEM_PROMPT =
        "You are a creative video prompt engineer specializing in Luma Dream Machine. Your task is to transform dream descriptions into cinematic video prompts using clear, simple language. Be specific about useful visual elements and emotional tone. Keep the prompt concise but rich in visual detail, formatted as a single, succinct sentence.";

    private readonly SYSTEM_PROMPT_EXTEND =
        "You are a creative video prompt engineer specializing in Luma Dream Machine. Your task is to transform dream descriptions into cinematic video prompts using clear, simple language. Be specific about useful visual elements and emotional tone. Keep the prompt concise but rich in visual detail, formatted as two succinct sentences. Break down the prompt into exactly two clear separate parts, using '*****' as a separator between part one and part two.";

    constructor(config: DreamPromptConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || "gpt-4o-mini";
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 400;
    }

    /**
     * Transform a dream description into a cinematic video prompt
     * @param dreamDescription - The original dream description from speech/text
     * @param extendMode - Whether to create an extended prompt for longer videos (default: false)
     * @returns Enhanced cinematic prompt
     */
    async enhanceDreamPrompt(
        dreamDescription: string,
        extendMode: boolean = false
    ): Promise<string> {
        if (!dreamDescription.trim()) {
            throw new Error("Dream description cannot be empty");
        }

        try {
            const systemPrompt = extendMode
                ? this.SYSTEM_PROMPT_EXTEND
                : this.SYSTEM_PROMPT;

            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: "system",
                                content: systemPrompt,
                            },
                            {
                                role: "user",
                                content: dreamDescription,
                            },
                        ],
                        temperature: this.temperature,
                        max_tokens: this.maxTokens,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `OpenAI API error: ${response.status} - ${
                        errorData.error?.message || "Unknown error"
                    }`
                );
            }

            const data: OpenAIResponse = await response.json();

            if (!data.choices || data.choices.length === 0) {
                throw new Error("No response from OpenAI");
            }

            const enhancedPrompt = data.choices[0].message.content.trim();

            if (!enhancedPrompt) {
                throw new Error("Empty response from OpenAI");
            }

            return enhancedPrompt;
        } catch (error) {
            console.error("Error enhancing dream prompt:", error);
            throw error;
        }
    }

    /**
     * Parse extended prompt for video generation (when extendMode is true)
     * @param enhancedPrompt - The enhanced prompt from OpenAI
     * @returns Object with initial and extension prompts
     */
    parseExtendedPrompt(enhancedPrompt: string): {
        initialPrompt: string;
        extensionPrompt: string;
    } {
        if (enhancedPrompt.includes("*****")) {
            const [initial, extension] = enhancedPrompt.split("*****", 2);
            return {
                initialPrompt: initial.trim(),
                extensionPrompt: extension.trim(),
            };
        }

        return {
            initialPrompt: enhancedPrompt,
            extensionPrompt: "Continue on with this video", // fallback from dream-recorder
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<DreamPromptConfig>): void {
        if (config.apiKey) this.apiKey = config.apiKey;
        if (config.model) this.model = config.model;
        if (config.temperature !== undefined)
            this.temperature = config.temperature;
        if (config.maxTokens) this.maxTokens = config.maxTokens;
    }

    /**
     * Validate API key format
     */
    private validateApiKey(): boolean {
        return this.apiKey.startsWith("sk-") && this.apiKey.length > 20;
    }

    /**
     * Test connection to OpenAI API
     */
    async testConnection(): Promise<boolean> {
        try {
            if (!this.validateApiKey()) {
                throw new Error("Invalid API key format");
            }

            const response = await fetch("https://api.openai.com/v1/models", {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error("API connection test failed:", error);
            return false;
        }
    }
}

// Export singleton instance management
let dreamEnhancerInstance: DreamPromptEnhancer | null = null;

/**
 * Initialize the dream enhancer with configuration
 */
export const initializeDreamEnhancer = (
    config: DreamPromptConfig
): DreamPromptEnhancer => {
    dreamEnhancerInstance = new DreamPromptEnhancer(config);
    return dreamEnhancerInstance;
};

/**
 * Get the initialized dream enhancer instance
 */
export const getDreamEnhancer = (): DreamPromptEnhancer => {
    if (!dreamEnhancerInstance) {
        throw new Error(
            "Dream enhancer not initialized. Call initializeDreamEnhancer first."
        );
    }
    return dreamEnhancerInstance;
};

/**
 * Helper function to enhance a dream prompt directly
 * @param dreamDescription - The dream description to enhance
 * @param apiKey - OpenAI API key
 * @param extendMode - Whether to use extended mode (default: false)
 * @returns Enhanced cinematic prompt
 */
export const enhanceDreamPrompt = async (
    dreamDescription: string,
    apiKey: string,
    extendMode: boolean = false
): Promise<string> => {
    const enhancer = new DreamPromptEnhancer({ apiKey });
    return enhancer.enhanceDreamPrompt(dreamDescription, extendMode);
};

export default DreamPromptEnhancer;
