// Dream Database - Simple Supabase integration based on dream-recorder's dream_db.py
// Keeps everything in one file like the original

import { supabase } from "../lib/supabase"; // You'll need to create this

// Types - keeping it simple like dream-recorder's DreamData
export interface DreamData {
    user_prompt: string;
    generated_prompt: string;
    audio_filename?: string;
    video_filename?: string;
    video_url?: string;
    thumb_filename?: string;
    thumb_url?: string;
    status?: string;
    generation_id?: string;
}

export interface DreamRecord extends DreamData {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

// Storage buckets
const STORAGE_BUCKETS = {
    VIDEOS: "dream-videos",
    AUDIO: "dream-audio",
    THUMBNAILS: "dream-thumbnails",
} as const;

export class DreamDB {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    // Save a new dream record (like dream-recorder's save_dream)
    async saveDream(dreamData: DreamData): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from("dreams")
                .insert([
                    {
                        ...dreamData,
                        user_id: this.userId,
                        status: dreamData.status || "completed",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                console.error("Failed to save dream:", error);
                return null;
            }

            console.log("Dream saved with ID:", data.id);
            return data.id;
        } catch (error) {
            console.error("Error saving dream:", error);
            return null;
        }
    }

    // Get a single dream by ID (like dream-recorder's get_dream)
    async getDream(dreamId: string): Promise<DreamRecord | null> {
        try {
            const { data, error } = await supabase
                .from("dreams")
                .select("*")
                .eq("id", dreamId)
                .eq("user_id", this.userId)
                .single();

            if (error) {
                console.error("Failed to get dream:", error);
                return null;
            }

            return data;
        } catch (error) {
            console.error("Error getting dream:", error);
            return null;
        }
    }

    // Get all dreams (like dream-recorder's get_all_dreams)
    async getAllDreams(): Promise<DreamRecord[]> {
        try {
            const { data, error } = await supabase
                .from("dreams")
                .select("*")
                .eq("user_id", this.userId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to get dreams:", error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error("Error getting dreams:", error);
            return [];
        }
    }

    // Update a dream (like dream-recorder's update_dream)
    async updateDream(
        dreamId: string,
        updates: Partial<DreamData>
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("dreams")
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", dreamId)
                .eq("user_id", this.userId);

            if (error) {
                console.error("Failed to update dream:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error updating dream:", error);
            return false;
        }
    }

    // Delete a dream (like dream-recorder's delete_dream)
    async deleteDream(dreamId: string): Promise<boolean> {
        try {
            // First get the dream to get file names
            const dream = await this.getDream(dreamId);
            if (dream) {
                // Delete associated files
                await this.deleteFiles(dream);
            }

            const { error } = await supabase
                .from("dreams")
                .delete()
                .eq("id", dreamId)
                .eq("user_id", this.userId);

            if (error) {
                console.error("Failed to delete dream:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error deleting dream:", error);
            return false;
        }
    }

    // Upload video from URL (like dream-recorder downloading and saving videos)
    async uploadVideoFromUrl(
        videoUrl: string,
        dreamId?: string
    ): Promise<string | null> {
        try {
            // Download the video
            const response = await fetch(videoUrl);
            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.status}`);
            }

            const blob = await response.blob();

            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = dreamId
                ? `${dreamId}_${timestamp}.mp4`
                : `video_${timestamp}.mp4`;
            const filePath = `${this.userId}/${filename}`;

            // Upload to Supabase Storage
            const { error } = await supabase.storage
                .from(STORAGE_BUCKETS.VIDEOS)
                .upload(filePath, blob, {
                    contentType: "video/mp4",
                });

            if (error) {
                throw new Error(`Upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKETS.VIDEOS)
                .getPublicUrl(filePath);

            console.log("Video uploaded:", filename);
            return urlData.publicUrl;
        } catch (error) {
            console.error("Error uploading video:", error);
            return null;
        }
    }

    // Upload audio file
    async uploadAudio(
        audioBlob: Blob,
        dreamId?: string
    ): Promise<string | null> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = dreamId
                ? `${dreamId}_${timestamp}.wav`
                : `audio_${timestamp}.wav`;
            const filePath = `${this.userId}/${filename}`;

            const { error } = await supabase.storage
                .from(STORAGE_BUCKETS.AUDIO)
                .upload(filePath, audioBlob, {
                    contentType: "audio/wav",
                });

            if (error) {
                throw new Error(`Audio upload failed: ${error.message}`);
            }

            console.log("Audio uploaded:", filename);
            return filename;
        } catch (error) {
            console.error("Error uploading audio:", error);
            return null;
        }
    }

    // Delete associated files
    private async deleteFiles(dream: DreamRecord): Promise<void> {
        const filesToDelete = [
            { bucket: STORAGE_BUCKETS.VIDEOS, filename: dream.video_filename },
            { bucket: STORAGE_BUCKETS.AUDIO, filename: dream.audio_filename },
            {
                bucket: STORAGE_BUCKETS.THUMBNAILS,
                filename: dream.thumb_filename,
            },
        ];

        for (const file of filesToDelete) {
            if (file.filename) {
                try {
                    const filePath = `${this.userId}/${file.filename}`;
                    await supabase.storage.from(file.bucket).remove([filePath]);
                } catch (error) {
                    console.warn(`Failed to delete ${file.filename}:`, error);
                }
            }
        }
    }
}

// Helper function to create DreamDB instance (like dream-recorder pattern)
export const createDreamDB = (userId: string): DreamDB => {
    return new DreamDB(userId);
};
