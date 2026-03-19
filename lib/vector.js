import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);


/*
Insert a new card with embedding
*/
export async function insertCard({ id, phrase, image_url, embedding }) {

    const { data, error } = await supabase
        .from("cards")
        .insert([
            {
                id,
                phrase,
                image_url,
                embedding
            }
        ]);

    if (error) {
        console.error("Insert error:", error);
        throw error;
    }

    return data;
}


/*
Semantic search for similar cards
*/
export async function searchCards(queryEmbedding, threshold = 0.8, count = 6) {

    const { data, error } = await supabase.rpc("match_cards", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: count
    });

    if (error) {
        console.error("Search error:", error);
        throw error;
    }

    return data;
}