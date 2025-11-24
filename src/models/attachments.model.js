import { supabase } from "../config/supabaseClient.js";

export const uploadAttachment = async ({ buffer, contentType }) => {
  const { data, error } = await supabase.storage
    .from("attachmentsCRM")
    .upload(`attachment-${Date.now()}`, buffer, {
      contentType: contentType,
    });

  const { data: publicURL } = supabase.storage
    .from("attachmentsCRM")
    .getPublicUrl(data.path);

  return publicURL.publicUrl;
};
