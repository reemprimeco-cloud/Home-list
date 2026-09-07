import { NextResponse } from "next/server";
import sharp from "sharp";

import { requireAdminAccess } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ONE-OFF, TEMPORARY. Same job as the route this repo already had and
 * removed several times for earlier catalogue batches — see those
 * commits' messages for why this exists (no service-role key / no
 * Storage write access in the environment that generates these images).
 * Delete again once run once.
 */

const BUCKET = "product-images";

const IMAGES: { naturalKey: string; sourceUrl: string }[] = [
  { naturalKey: "beef_steak||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202512_7615d3f0-d13e-43f6-8d06-eeeb177f6e98.png" },
  { naturalKey: "chicken_mince||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202512_346229f2-0870-4928-bb1c-844cd0736697.png" },
  { naturalKey: "chicken_wings||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202512_c5d6e2ba-9741-4c30-9c69-2c9439babecc.png" },
  { naturalKey: "chicken_thighs||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202512_bd3fe9d5-ae3f-40d1-9aa4-cf7a4aaef352.png" },
  { naturalKey: "liver||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202512_eea47c4d-484a-465b-8a94-c3d8f018f9ef.png" },
  { naturalKey: "salmon||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202512_8decc90c-e20c-4dcd-b37b-b7b9ec1242b3.png" },
  { naturalKey: "tilapia||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202612_7d234919-c496-4df7-88c5-0df5ff869d59.png" },
  { naturalKey: "sausages||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202512_677fd86a-101f-44e1-a80c-509d7e62d81b.png" },
  { naturalKey: "luncheon_meat||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202612_439f7571-909d-4c0a-bddc-f72f28a2b6fa.png" },
  { naturalKey: "calamari||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202612_45fe598f-83f3-470e-ab07-9bfec08e9c26.png" },
  { naturalKey: "tortilla_bread||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202612_64cb1246-c12c-496f-b6aa-b646f7015acc.png" },
  { naturalKey: "donut||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202612_76a2ff04-53b2-4255-8458-ad2266669e53.png" },
  { naturalKey: "bagel||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202613_a8b8738c-8fb4-443f-9b55-696fed38da23.png" },
  { naturalKey: "tandoor_bread||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202612_23fad960-4ab4-4451-aebc-f19de6751c3f.png" },
  { naturalKey: "bbq_sauce||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202612_ee94a07a-4673-4a2c-a6b8-5216f78dcfc1.png" },
  { naturalKey: "pickles||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_ced2b3de-8991-4441-89ca-590c4d756b50.png" },
  { naturalKey: "olives||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_47963bec-9137-42cf-aab7-862fbdffbb43.png" },
  { naturalKey: "salad_dressing||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_0f61f8a3-9a19-4741-a704-32290d67c4e6.png" },
  { naturalKey: "pasta_sauce||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_1344078f-5a6d-4235-b3ae-cad57c7a5327.png" },
  { naturalKey: "canned_mushrooms||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_9331bead-d9fa-4022-933e-5aff6caa0da0.png" },
  { naturalKey: "canned_peas||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_552c9c19-74da-4405-abce-bbf9f79d56c0.png" },
  { naturalKey: "date_syrup||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_44419709-b882-442b-a0ed-4c286812e5e0.png" },
  { naturalKey: "baking_soda||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202723_b59a2f58-adee-4ae4-99e8-fda20f66915e.png" },
  { naturalKey: "vanilla_extract||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202851_b84ca80b-9c35-41c7-88b7-3ae5b0692f07.png" },
  { naturalKey: "saffron||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202851_773e200e-1d79-4374-b51c-6a3365cda68b.png" },
  { naturalKey: "bay_leaves||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202851_bd9eb896-9079-4ed3-a86e-5476c0a1c562.png" },
  { naturalKey: "paprika||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202851_e36dc971-115e-43ae-a2ec-5513639efb8e.png" },
  { naturalKey: "garlic_powder||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202851_898d9757-23cd-4162-9386-84f0bec6c593.png" },
  { naturalKey: "coconut_milk||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202851_a24c574c-5c31-4f71-a3ce-9bd66e6f3450.png" },
  { naturalKey: "cornstarch||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202851_55566dcf-193e-465a-912f-8c8b255f1f34.png" },
  { naturalKey: "onion_powder||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_b3aef7dd-c6a9-47c2-b567-c3a140123c22.png" },
  { naturalKey: "sesame_seeds||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_3fffb7c2-8b79-453a-adb6-bb59416c71e4.png" },
  { naturalKey: "dried_lime||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_94b22747-9e5c-4187-b81f-2cade8fd47b9.png" },
  { naturalKey: "sumac||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_a8ba46f8-d7c1-4e05-bed4-9729ed5bbc29.png" },
  { naturalKey: "greek_yogurt||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_676bb9f2-8b40-4af3-9e9f-f780182403ce.png" },
  { naturalKey: "cottage_cheese||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_11d364df-0be3-4075-b877-ffb3716f9769.png" },
  { naturalKey: "cream_cheese||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_6df25442-0b6b-4e61-b1bd-2277e9ff2522.png" },
  { naturalKey: "mozzarella||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_202950_0fc7db82-bcd0-4f72-9cbe-3ad243627f6c.png" },
  { naturalKey: "halloumi||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_0a2aa6f5-24d4-4558-9735-c6183a203d80.png" },
  { naturalKey: "feta_cheese||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_b794de26-03c6-45c4-ab10-e54753f4c47d.png" },
  { naturalKey: "energy_drink||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_9e86bc76-8eba-40fd-95f0-0c782d9e9075.png" },
  { naturalKey: "lemonade||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_b6b2b9ad-eb18-4e40-aa69-bc5126300589.png" },
  { naturalKey: "cordial||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_3432b55d-e2b2-46cd-84e1-1f826967b459.png" },
  { naturalKey: "sparkling_water||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_0c07a729-e9b8-4dbf-a840-99cb3a8a51bc.png" },
  { naturalKey: "karak_tea||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_b56f15d3-c0b3-4294-a426-739ec5f600c9.png" },
  { naturalKey: "grape_juice||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203040_94bdc803-4571-4fde-a06a-0e3a13d99989.png" },
  { naturalKey: "all_purpose_cleaner||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_5a0f52e5-bbcc-41bf-9c61-2d3ee09e4b27.png" },
  { naturalKey: "mop||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_e78a0818-6a50-4833-9948-b9fcf1c5c09a.png" },
  { naturalKey: "broom||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_88189f82-d4fb-4719-bff9-d41ef610fdc9.png" },
  { naturalKey: "stain_remover||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_54a5f86c-1cbf-4205-810f-b7e0978532cc.png" },
  { naturalKey: "disinfectant_spray||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_24ac8371-a0aa-4cac-b35f-08b3c2138576.png" },
  { naturalKey: "mouthwash||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_63045b08-7c0c-4d55-b93f-6ebe3a2562a0.png" },
  { naturalKey: "dental_floss||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_f39616be-df26-4356-8528-1531272ee228.png" },
  { naturalKey: "cotton_buds||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203132_ade4443e-1883-46c0-88d5-573227d7391c.png" },
  { naturalKey: "wet_wipes||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203233_a3f3f658-b3d4-4c2b-91c7-cd2b846f2b29.png" },
  { naturalKey: "hand_sanitizer||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203232_949800d7-39bc-4ed9-a927-d2faed3c1478.png" },
  { naturalKey: "sunscreen||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203232_5d889b3f-0e3d-43cc-bec8-fd4e9c769c3f.png" },
  { naturalKey: "shaving_cream||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203232_61378b69-e44c-4ee6-981e-274350347f85.png" },
  { naturalKey: "lighter||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203232_869453c9-3e98-42af-b229-f8d8ff8325e0.png" },
  { naturalKey: "storage_bags||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203232_c68513db-70b2-43d6-8ab9-ac5d1ece9004.png" },
  { naturalKey: "charcoal||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203232_745c72b5-79e6-4cae-889c-bf6daaf1928c.png" },
  { naturalKey: "candles||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203232_8716a32d-b529-4002-a303-787ab491cab2.png" },
  { naturalKey: "baby_bottle||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203536_c2d09669-310f-4d96-a755-a721618ecffd.png" },
  { naturalKey: "pacifier||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203454_bcb00825-753f-42f7-a5de-bfbbb7863cd2.png" },
  { naturalKey: "baby_cereal||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203454_a3d3034e-396d-4481-9aae-82a6352ca612.png" },
  { naturalKey: "baby_powder||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203454_12c51c45-d8bd-4174-891d-cb7515729e66.png" },
  { naturalKey: "baby_oil||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203454_3c3539da-c697-49fe-8ef4-3965f17d442a.png" },
  { naturalKey: "couscous||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203454_09e1a55e-e12c-4165-97b0-bf29edd327f0.png" },
  { naturalKey: "green_lentils||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203454_5153c6b7-3cd9-49fe-9afe-dd0ff666cd6e.png" },
  { naturalKey: "fava_beans||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203536_1b77ab16-8f55-44f4-9dd2-4039b0a93586.png" },
  { naturalKey: "semolina||", sourceUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3AGhTHKPN3FQpd6GCElZeyNv3tQ/hf_20260907_203536_f699a37b-3d15-4ddb-b9dc-293d69702664.png" },
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
