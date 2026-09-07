import { NextResponse } from "next/server";
import sharp from "sharp";

import { requireAdminAccess } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ONE-OFF, TEMPORARY. Fetches the 29 leafy-vegetable/herb and frozen-food
 * images generated for the 2026-09 catalogue expansion from where they
 * were generated, resizes each to the catalogue's 400x400 WebP standard
 * (matching catalog-import/scripts/upload-images.mjs), uploads it to the
 * product-images bucket, and points the matching product row at it.
 *
 * Exists only because the environment that generated these images has no
 * service-role key and cannot reach Supabase Storage's write path — this
 * route runs on Vercel instead, where both are available. Admin-gated the
 * same way /admin itself is, since it performs writes: open it once,
 * logged in as the admin account, then this file gets deleted along with
 * the `sharp` dependency it needed only for this.
 */

const BUCKET = "product-images";

const IMAGES: { naturalKey: string; sourceUrl: string }[] = [
  { naturalKey: "arugula||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_a9d8815a-e92c-441a-8980-b3d83efa440a.png" },
  { naturalKey: "parsley||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_20fe6cc2-46d4-49f0-b9e3-bff13c1750f5.png" },
  { naturalKey: "dill||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_4db77d8b-0b73-442e-bf7b-89fe5729f288.png" },
  { naturalKey: "celery||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_5aa826e4-53c9-4e5a-bda3-29743e157cf1.png" },
  { naturalKey: "chard||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_6cbbaf55-92dc-455f-b994-a43d7234193c.png" },
  { naturalKey: "molokhia_fresh||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_69ebbd86-a79f-40c4-839a-7618eb2a5908.png" },
  { naturalKey: "okra||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_bde21003-9169-4380-bb37-11b83a32aba4.png" },
  { naturalKey: "green_beans||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_20517fb2-920e-4348-b5c7-60bf6149c2d6.png" },
  { naturalKey: "turnip||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185651_ecb140c7-b6e1-41f9-ba9b-bc41592ec031.png" },
  { naturalKey: "cauliflower||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185758_32a07cd8-73e7-4d91-89d3-902e65b3407c.png" },
  { naturalKey: "broccoli||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185758_1f92c1aa-1fd3-44aa-af8a-f14e692b8f84.png" },
  { naturalKey: "green_onion||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185758_7263fd6c-56d5-46d8-a3f4-8613e3a5b574.png" },
  { naturalKey: "radish||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185758_f4e584b5-de37-4e76-8eef-890a4592fda4.png" },
  { naturalKey: "beetroot||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185758_73639b64-6849-4737-ac24-d65e9ea72521.png" },
  { naturalKey: "pumpkin||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185758_d35949ce-6f1f-473b-ae65-f5f2e12d51a9.png" },
  { naturalKey: "mushroom||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185759_1f3410c3-e711-4654-a961-6c03f89f484c.png" },
  { naturalKey: "basil||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185758_56b7f0cc-45b9-49c0-8d8d-6b35b1defa8d.png" },
  { naturalKey: "frozen_chicken||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_b74ebdaa-d5eb-4146-9546-c9e0103319d0.png" },
  { naturalKey: "frozen_shrimp||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_a59bb7f3-4178-42b9-b0ad-4306bda9bb21.png" },
  { naturalKey: "frozen_kibbeh||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_39ab5312-99ea-4fec-ae52-646b2ac289d5.png" },
  { naturalKey: "frozen_spring_rolls||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_e4a17a7d-dc2c-429e-88ce-e99943060e11.png" },
  { naturalKey: "frozen_burger||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_dcf2aca0-a147-4d5e-a74c-7c761cc7dc2d.png" },
  { naturalKey: "frozen_pizza||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_f025a303-78dc-4e70-bda8-963817008ea3.png" },
  { naturalKey: "frozen_okra||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_49af3658-6d2a-4549-a724-3430d98b96b7.png" },
  { naturalKey: "frozen_spinach||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185852_97a34a18-13d0-4717-a4f8-06821072e0c4.png" },
  { naturalKey: "frozen_corn||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185938_67c4b796-a013-424a-ac6e-b772febf6053.png" },
  { naturalKey: "frozen_mixed_berries||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185938_dc4254fa-e73f-4298-aa9c-7d777290c9c4.png" },
  { naturalKey: "frozen_pastry||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185938_b6926534-4330-44fe-bd21-a6f0da4fbc72.png" },
  { naturalKey: "frozen_meatballs||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_185938_69a32306-4efa-4707-a7c3-c3c1ac06a3db.png" },
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
