import { NextResponse } from "next/server";
import sharp from "sharp";

import { requireAdminAccess } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ONE-OFF, TEMPORARY. Same job as the route this repo already had and
 * removed for the previous catalogue batch — see that commit's message
 * for why this exists (no service-role key / no Storage write access in
 * the environment that generates these images). Reused for the next
 * small addition rather than re-explained; delete again once run once.
 */

const BUCKET = "product-images";

const IMAGES: { naturalKey: string; sourceUrl: string }[] = [
  { naturalKey: "cabbage_red||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_194552_ad1b3a89-a02e-4459-b33c-afaec32a63d2.png" },
  { naturalKey: "frozen_mozzarella_sticks||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_194742_598d0aa1-c0ee-419e-9d00-aa43a4a9232d.png" },
  { naturalKey: "frozen_potato_wedges||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_194742_b2e6749e-b302-4ece-88a5-ceed7cbbd258.png" },
  { naturalKey: "frozen_chicken_burger||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_194742_c04ca65e-5788-4e0e-a8a0-70b9181aed25.png" },
  { naturalKey: "frozen_chicken_fillet||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_194825_c5647c50-b4e6-49fd-b130-69076afd7720.png" },
];

export async function GET() {
  await requireAdminAccess();

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "admin client not configured" }, { status: 500 });
  }

  const results: { naturalKey: string; ok: boolean; error?: string }[] = [];

  for (const { naturalKey, sourceUrl } of IMAGES) {
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`fetch ${response.status}`);
      const original = Buffer.from(await response.arrayBuffer());

      const webp = await sharp(original)
        .resize(400, 400, { fit: "cover", background: "#ffffff" })
        .webp({ quality: 82 })
        .toBuffer();

      const objectPath = `${naturalKey.split("|")[0]}.webp`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, webp, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
      if (uploadError) throw new Error(`upload: ${uploadError.message}`);

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: publicUrl, source_name: "generated", updated_at: new Date().toISOString() })
        .eq("natural_key", naturalKey);
      if (updateError) throw new Error(`db: ${updateError.message}`);

      results.push({ naturalKey, ok: true });
    } catch (error) {
      results.push({ naturalKey, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
