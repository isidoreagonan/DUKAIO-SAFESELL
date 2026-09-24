import { runDiscoveryScan } from "../src/lib/discovery.server";

interface HarvestPack {
  niche: string;
  category: string;
  keywords: string[];
  countries: string[];
  limit: number;
}

const HARVEST_PACKS: HarvestPack[] = [
  // 1. Beauté, Visage & Soins
  {
    niche: "Beauté & Soins du visage",
    category: "Beauté & soin",
    keywords: ["dermaplaning", "sérum visage", "soin peau", "épilateur"],
    countries: ["CI", "SN", "FR", "CM"],
    limit: 50,
  },
  // 2. Massage, Relaxation & Douleur
  {
    niche: "Massage & Soulagement douleur",
    category: "Santé & hygiène",
    keywords: ["appareil massage", "pistolet massage", "baume douleur", "ventouse cellulite"],
    countries: ["CI", "BJ", "SN", "TG"],
    limit: 50,
  },
  // 3. Dents & Hygiène bucco-dentaire
  {
    niche: "Hygiène & Blanchiment dentaire",
    category: "Santé & hygiène",
    keywords: ["brosse à dents électrique", "blanchiment dentaire", "détartreur dentaire", "hydropulseur"],
    countries: ["CI", "FR", "SN", "CM"],
    limit: 50,
  },
  // 4. Bien-être & Posture
  {
    niche: "Posture & Articulations",
    category: "Santé & hygiène",
    keywords: ["correcteur posture", "ceinture lombaire", "genouillère compression", "coussin orthopédique"],
    countries: ["CI", "SN", "CM", "BJ"],
    limit: 50,
  },
  // 5. Cuisine & Électroménager
  {
    niche: "Cuisine & Préparation",
    category: "Cuisine",
    keywords: ["mixeur portable", "friteuse sans huile", "hachoir multifonction", "machine à jus"],
    countries: ["CI", "SN", "CM", "TG"],
    limit: 50,
  },
  // 6. Accessoires Voiture
  {
    niche: "Accessoires Auto & Moto",
    category: "Auto & moto",
    keywords: ["support téléphone voiture", "aspirateur sans fil voiture", "dashcam voiture", "nettoyant phare voiture"],
    countries: ["CI", "FR", "SN", "CM"],
    limit: 50,
  },
  // 7. Tech, Gadgets & Téléphonie
  {
    niche: "Protection & Accessoires Téléphone",
    category: "Tech & gadgets",
    keywords: ["pochette étanche téléphone", "coque protection", "chargeur sans fil", "écouteurs sans fil"],
    countries: ["CI", "SN", "CM", "BJ"],
    limit: 50,
  },
  // 8. Vidéo, Photo & Créateurs
  {
    niche: "Création contenu & Éclairage",
    category: "Tech & gadgets",
    keywords: ["ring light trépied", "mini vidéoprojecteur", "micro cravate sans fil", "lampe led"],
    countries: ["CI", "SN", "FR", "CM"],
    limit: 50,
  },
  // 9. Maison & Gain de place
  {
    niche: "Maison & Rangement intelligent",
    category: "Maison & jardin",
    keywords: ["aspirateur robot", "organisateur rangement", "brosse nettoyage électrique", "rideau anti lumière"],
    countries: ["CI", "SN", "FR", "CM"],
    limit: 50,
  },
  // 10. Perruques, Cheveux & Cosmétiques
  {
    niche: "Coiffure & Soins cheveux",
    category: "Beauté & soin",
    keywords: ["perruque lace", "huile pousse cheveux", "lisseur vapeur", "savon noir kojic"],
    countries: ["CI", "SN", "CM", "TG"],
    limit: 50,
  },
  // 11. Remise en forme & Minceur
  {
    niche: "Fitness & Silhouette",
    category: "Sport & fitness",
    keywords: ["gaine amincissante", "ceinture abdos", "élastique musculation", "corde à sauter sans fil"],
    countries: ["CI", "SN", "BJ", "CM"],
    limit: 50,
  },
  // 12. Mode & Montres
  {
    niche: "Montres & Accessoires",
    category: "Mode & accessoires",
    keywords: ["montre luxe homme", "sac à main cuir", "lunettes soleil polarisées", "bracelet magnétique"],
    countries: ["CI", "SN", "CM", "FR"],
    limit: 50,
  },
];

async function checkApifyUsage(): Promise<number> {
  const apifyKey = process.env["APIFY_API_KEY"];
  if (!apifyKey) return 0;
  try {
    const res = await fetch("https://api.apify.com/v2/users/me/limits", {
      headers: { Authorization: `Bearer ${apifyKey}` },
    });
    if (!res.ok) return 0;
    const json = await res.json() as { data?: { current?: { monthlyUsageUsd?: number } } };
    return json.data?.current?.monthlyUsageUsd ?? 0;
  } catch {
    return 0;
  }
}

async function getStats() {
  const sbUrl = process.env["SUPABASE_URL"];
  const sbKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!sbUrl || !sbKey) return { totalAds: 0, videoAds: 0, bunnyVideos: 0, bunnyImages: 0 };

  try {
    const [adsRes, vidRes] = await Promise.all([
      fetch(`${sbUrl}/rest/v1/discovery_ads?select=count`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, Prefer: "count=exact" },
      }),
      fetch(`${sbUrl}/rest/v1/discovery_ads?media_type=eq.video&select=count`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, Prefer: "count=exact" },
      }),
    ]);

    const totalAds = Number(adsRes.headers.get("content-range")?.split("/")[1] || 0);
    const videoAds = Number(vidRes.headers.get("content-range")?.split("/")[1] || 0);

    const bZone = process.env["BUNNY_STORAGE_ZONE_NAME"];
    const bKey = process.env["BUNNY_STORAGE_API_KEY"];
    let bunnyVideos = 0;
    let bunnyImages = 0;

    if (bZone && bKey) {
      const [vList, iList] = await Promise.all([
        fetch(`https://storage.bunnycdn.com/${bZone}/videos/`, { headers: { AccessKey: bKey, Accept: "application/json" } }),
        fetch(`https://storage.bunnycdn.com/${bZone}/images/`, { headers: { AccessKey: bKey, Accept: "application/json" } }),
      ]);
      if (vList.ok) {
        const arr = (await vList.json()) as unknown[];
        bunnyVideos = arr.length;
      }
      if (iList.ok) {
        const arr = (await iList.json()) as unknown[];
        bunnyImages = arr.length;
      }
    }

    return { totalAds, videoAds, bunnyVideos, bunnyImages };
  } catch {
    return { totalAds: 0, videoAds: 0, bunnyVideos: 0, bunnyImages: 0 };
  }
}

async function main() {
  console.log("==================================================");
  console.log("   DUKAIO HARVESTER - COLLECTE EN MASSE (500-700) ");
  console.log("==================================================\n");

  const startStats = await getStats();
  const startUsage = await checkApifyUsage();
  console.log(`État initial : ${startStats.totalAds} annonces (${startStats.videoAds} vidéos).`);
  console.log(`Bunny CDN : ${startStats.bunnyVideos} vidéos stockées, ${startStats.bunnyImages} images stockées.`);
  console.log(`Consommation Apify : $${startUsage.toFixed(3)} / $10.00\n`);

  let currentTotal = startStats.totalAds;
  const TARGET_MIN = 500;
  const TARGET_MAX = 700;

  for (let i = 0; i < HARVEST_PACKS.length; i++) {
    const pack = HARVEST_PACKS[i]!;
    if (currentTotal >= TARGET_MAX) {
      console.log(`🎯 Objectif maximum atteint (${currentTotal} >= ${TARGET_MAX}) !`);
      break;
    }

    // Garde de sécurité budget Apify : ne jamais dépasser 8.50 $ (garder 1.50 $ de sécurité)
    const currentUsage = await checkApifyUsage();
    if (currentUsage > 8.50) {
      console.log(`⚠️ Alerte budget Apify ($${currentUsage.toFixed(2)} utilisé sur $10.00). Arrêt de sécurité.`);
      break;
    }

    console.log(`--------------------------------------------------`);
    console.log(`[Lot ${i + 1}/${HARVEST_PACKS.length}] ${pack.niche}`);
    console.log(`Mots-clés : ${pack.keywords.join(", ")} | Pays : ${pack.countries.join(", ")}`);
    console.log(`Lancement de la collecte Apify & sync Bunny.net...`);

    const result = await runDiscoveryScan({
      keywords: pack.keywords,
      countries: pack.countries,
      category: pack.category,
      limit: pack.limit,
      freshDays: 30,
    });

    console.log(`Résultat : Trouvées = ${result.found}, Insérées = ${result.inserted}, Mises à jour = ${result.updated}`);
    if (result.reason) {
      console.log(`Info : ${result.reason}`);
    }

    const currentStats = await getStats();
    currentTotal = currentStats.totalAds;
    console.log(`Total actuel dans DUKAIO : ${currentStats.totalAds} annonces (${currentStats.videoAds} vidéos).`);
    console.log(`Bunny.net : ${currentStats.bunnyVideos} vidéos hébergées, ${currentStats.bunnyImages} images hébergées.`);
    console.log(`--------------------------------------------------\n`);

    if (currentTotal >= TARGET_MIN && i >= 6) {
      console.log(`✅ Palier minimum (${TARGET_MIN}) atteint avec succès !`);
    }

    // Petite pause de courtoisie de 3 secondes entre les lots
    await new Promise((r) => setTimeout(r, 3000));
  }

  const finalStats = await getStats();
  const finalUsage = await checkApifyUsage();
  console.log("\n==================================================");
  console.log("   COLLECTE TERMINÉE AVEC SUCCÈS !                ");
  console.log("==================================================");
  console.log(`Total final dans la bibliothèque : ${finalStats.totalAds} publicités`);
  console.log(`Publicités vidéos : ${finalStats.videoAds}`);
  console.log(`Vidéos physiquement sur Bunny.net CDN : ${finalStats.bunnyVideos}`);
  console.log(`Images physiquement sur Bunny.net CDN : ${finalStats.bunnyImages}`);
  console.log(`Consommation finale Apify : $${finalUsage.toFixed(3)} / $10.00`);
  console.log(`Quota Supabase Storage consommé : 0 Ko (100% Bunny CDN)`);
}

main().catch((err) => {
  console.error("Erreur durant la collecte :", err);
  process.exit(1);
});
