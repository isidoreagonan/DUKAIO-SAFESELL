import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const askSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(1500),
      }),
    )
    .max(10)
    .optional(),
});

const DUKAIO_SYSTEM_PROMPT = `Tu es l'assistant commercial et technique officiel de DUKAIO (dukaio.com).
Ta mission est d'aider les commerçants, entrepreneurs et vendeurs d'Afrique francophone (Bénin, Côte d'Ivoire, Sénégal, Togo, Cameroun, Burkina Faso, Mali, etc.) à comprendre la plateforme, créer leur boutique et développer leurs ventes.

Voici tes consignes strictes :
1. Ton ton est chaleureux, professionnel, concis et encourageant (esprit entrepreneurial africain).
2. Réponds en français clair, avec des phrases percutantes et bien formatées (tirets si besoin).
3. Sois concis : 2 à 4 phrases ou une courte liste à puces suffisent généralement. Pas de romans.
4. Connaissances clés sur DUKAIO :
   - DUKAIO est la plateforme e-commerce tout-en-un pour vendre des produits physiques avec paiement à la livraison (Cash on Delivery - COD) et Mobile Money.
   - Les clients commandent en quelques secondes sans carte bancaire, et paient en liquide ou Mobile Money à la réception du colis.
   - Création de boutique ultra-rapide en moins de 5 minutes, sans coder.
   - Tarifs : Formule Découverte gratuite à 0 FCFA/mois (jusqu'à 20 produits). Formules avancées sans engagement (autour de 15 000 FCFA/mois) avec produits illimités, DUKAIO AI et relances automatiques.
   - DUKAIO AI permet de créer une fiche produit complète et prête à vendre en 10 secondes.
   - Support et contact direct sur WhatsApp disponible pour accompagner chaque commerçant.
5. Si l'utilisateur demande une assistance humaine ou un partenariat, invite-le cordialement à cliquer sur le bouton WhatsApp dans la fenêtre de discussion.`;

async function callGoogleGemini(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  const geminiKey = process.env["GEMINI_API_KEY"];

  if (!geminiKey) {
    // Si la clé Google AI Studio n'est pas encore saisie
    const lower = userMessage.toLowerCase();
    if (lower.includes("prix") || lower.includes("tarif") || lower.includes("combien") || lower.includes("cout")) {
      return "DUKAIO propose une formule Découverte à 0 FCFA par mois (jusqu'à 20 produits, sans carte bancaire requise). Pour les boutiques en pleine croissance, nos formules avancées avec DUKAIO AI sont disponibles sans engagement à partir de 15 000 FCFA/mois.";
    }
    if (lower.includes("livraison") || lower.includes("cod") || lower.includes("paiement") || lower.includes("encaiss")) {
      return "Avec DUKAIO, vos clients commandent en quelques clics sans payer en ligne. Vous leur livrez le colis et ils vous règlent en espèces ou via Mobile Money directement à la réception.";
    }
    if (lower.includes("commencer") || lower.includes("creer") || lower.includes("ouvrir") || lower.includes("boutique")) {
      return "Créer votre boutique prend moins de 5 minutes ! Cliquez simplement sur le bouton « Inscription » en haut à droite, renseignez le nom de votre boutique et commencez à ajouter vos premiers produits immédiatement.";
    }
    if (lower.includes("whatsapp") || lower.includes("contact") || lower.includes("aide") || lower.includes("support")) {
      return "Notre équipe est à votre disposition pour vous assister. Vous pouvez échanger directement avec nous via le bouton WhatsApp situé juste en haut de cette discussion.";
    }
    return "Bonjour ! Pour activer l'analyse IA complète, ajoutez votre clé GEMINI_API_KEY de Google AI Studio dans votre fichier .env. En attendant, vous pouvez cliquer sur les questions fréquentes ci-dessus ou nous contacter sur WhatsApp !";
  }

  // Modèles testés par ordre de préférence sur Google AI Studio
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  const contents = [
    {
      role: "user",
      parts: [{ text: DUKAIO_SYSTEM_PROMPT }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Compris ! Je suis l'assistant officiel de DUKAIO. Je réponds de manière concise, chaleureuse et orientée résultats pour les commerçants.",
        },
      ],
    },
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: 400,
              temperature: 0.7,
            },
          }),
        },
      );

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply?.trim()) return reply.trim();
      }
    } catch {
      // Modèle suivant
    }
  }

  return "Je rencontre une courte indisponibilité temporaire de connexion à Gemini. Vous pouvez utiliser les questions rapides ci-dessus ou échanger directement avec notre équipe sur WhatsApp !";
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((input: unknown) => askSchema.parse(input))
  .handler(async ({ data }) => {
    const reply = await callGoogleGemini(data.message, data.history || []);
    return { reply };
  });
