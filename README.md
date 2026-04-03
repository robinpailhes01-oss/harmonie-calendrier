# Harmonie Yacht — Calendrier Business

Calendrier business pour l'équipe Harmonie Yacht.
Connecté en temps réel à Supabase (leads, finances) et à la météo marine de Carnon.

## Déploiement Vercel

1. Créer un nouveau repo GitHub (ex: `harmonie-calendrier`)
2. Push ce dossier entier
3. Sur Vercel → Import → Sélectionner le repo
4. Framework: **Vite**
5. Deploy

Le build se fait automatiquement avec `npm run build`.

## Fonctionnalités

- Calendrier avec météo marine (vagues, vent, température)
- Points colorés : 🔴 chaud non payé, 🟠 tiède avec date, 🟢 réservé
- KPIs financiers en temps réel
- Section prospects par mois
- CRM complet avec filtres Chauds/Tièdes/Froids
- Mode jour/nuit
- Responsive mobile
