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
      comment_response_id: data.comment_response_id,
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
export const searchReplyById = async ({ id }) => {
  const { data: comment, error } = await supabase
    .from("instagram_comments")
    .select("*")
    .eq("comment_response_id", id)
    .maybeSingle();

  if (error) throw error;

  return comment;
};

export const setPost = async ({ data }) => {
  const { data: post, error } = await supabase
    .from("instagram_posts")
    .insert({
      inbox_id: data.inbox_id,
      post_id: data.post_id,
      caption: data.caption,
      media_type: data.media_type,
      media_url: data.media_url,
      permalink: data.permalink,
      timestamp: data.timestamp,
    })
    .select()
    .single();

  if (error) throw error;

  return post;
};

export const findPostById = async ({ id }) => {
  const { data: post, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .eq("post_id", id)
    .maybeSingle();

  if (error) throw error;

  return post;
};

export const findPostsByInboxId = async ({ id }) => {
  const { data: posts, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .eq("inbox_id", id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return posts;
};

export const deleteAllPostByInboxId = async ({ id }) => {
  const { data: posts, error } = await supabase
    .from("instagram_posts")
    .delete()
    .eq("inbox_id", id);

  if (error) throw error;

  return posts;
};

export const createReplyToPost = async ({ data }) => {
  const { error } = await supabase.from("instagram_post_replys").insert({
    ...data,
    post_id: data.post_id,
  });

  if (error) throw error;
};

export const getReplysToPostById = async ({ id }) => {
  const { data: replies, error } = await supabase
    .from("instagram_post_replys")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return replies;
};

export const findReplyToPostByReplyId = async ({ id }) => {
  const { data: reply, error } = await supabase
    .from("instagram_post_replys")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return reply;
};

export const updateReplyById = async ({ id, data }) => {
  const { error } = await supabase
    .from("instagram_post_replys")
    .update({
      ...data,
    })
    .eq("id", id);

  if (error) throw error;

  return true;
};

export const deleteReplyById = async ({ id }) => {
  const { error } = await supabase
    .from("instagram_post_replys")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
};

export const findCommentsByPostsId = async ({ id }) => {
  const { data: comments, error } = await supabase
    .from("instagram_comments")
    .select(
      `
      *,
      leads (name)
    `,
    )
    .eq("media_id", id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return comments;
};

export const findCommentById = async ({ id }) => {
  console.log(id);
  const { data: comment, error } = await supabase
    .from("instagram_comments")
    .select("*")
    .eq("comment_id", id)
    .maybeSingle();

  console.log(error);
  if (error) throw error;

  return comment;
};

export const deleteCommentById = async ({ comment_id }) => {
  const { error } = await supabase
    .from("instagram_comments")
    .delete()
    .eq("comment_id", comment_id);

  if (error) throw error;

  return true;
};
