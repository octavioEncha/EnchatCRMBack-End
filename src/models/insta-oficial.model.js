import { supabase } from "../config/supabaseClient.js";

export const saveComments = async ({ data }) => {
  const { data: commentSaved, error } = await supabase
    .from("instagram_comments")
    .insert({
      inbox_id: data.inbox_id,
      lead_id: data.lead_id,
      media_id: data.media_id,
      media_type: data.media_type,
      comment_id: data.comment_id,
      comment_content: data.comment_content,
    })
    .select()
    .single();

  return commentSaved;
};

export const saveReplyToCommentById = async ({ data }) => {
  const { error } = await supabase
    .from("instagram_comments")
    .update({
      comment_response: data.reply,
    })
    .eq("id", data.id)
    .maybeSingle();

  if (error) throw error;
};

export const searchCommentById = async ({ id }) => {
  const { data: comment, error } = await supabase
    .from("instagram_comments")
    .select("*")
    .eq("comment_id", id)
    .maybeSingle();

  if (error) throw error;

  return comment;
};

export const findCommentById = async ({ id }) => {
  const { data: comment, error } = await supabase
    .from("instagram_comments")
    .select("*")
    .eq("comment_id", id)
    .maybeSingle();

  if (error) throw error;

  return comment;
};

export const getAllCommentsByInboxId = async ({ inbox_id }) => {
  const { data, error } = await supabase
    .from("instagram_comments")
    .select(
      `
      *,
      leads (name)
    `,
    )
    .eq("inbox_id", inbox_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const deleteCommentById = async ({ comment_id }) => {
  const { error } = await supabase
    .from("instagram_comments")
    .delete()
    .eq("comment_id", comment_id);

  if (error) throw error;

  return true;
};
