# Studio JAAD — Portfolio & Esposizione

Sito portfolio/esposizione per [@studiojaad](https://www.instagram.com/studiojaad).

Statico, zero dipendenze (HTML + CSS + JS vanilla). Design editoriale dark con:

- Preloader animato con contatore
- Tipografia cinetica (reveal lettera per lettera)
- Cursore custom magnetico con stati hover/view
- Marquee infinito, badge rotante, grana pellicola
- Galleria con layout editoriale asimmetrico, filtri per categoria e lightbox (frecce + tastiera)
- Statement con parole che si "accendono" allo scroll, contatori animati
- Pulsanti magnetici, parallasse, barra di progresso scroll
- Responsive completo + supporto `prefers-reduced-motion`

## Come inserire le foto reali di Instagram

Le opere in mostra sono definite in cima ad `app.js` nell'array `WORKS`.
Al momento ogni opera usa una tavola astratta generata (segnaposto elegante).

1. Scarica le foto dal profilo e salvale in `studio-jaad/assets/` (es. `01.jpg`, `02.jpg`…)
2. In `app.js` aggiungi il campo `src` alla voce corrispondente:

```js
{ title: "Nome del progetto", category: "Serie", year: "2026", src: "assets/01.jpg" },
```

3. Aggiorna `title`, `category` e `year` come preferisci: i filtri si generano da soli in base alle categorie usate.

## Avvio locale

```bash
cd studio-jaad
python3 -m http.server 4180
```

Apri `http://localhost:4180`.

## Deploy

È un sito statico: funziona su GitHub Pages, Vercel o Netlify senza configurazione.
Con GitHub Pages attivo su questo repo: `https://butacuenrico.github.io/TheraViz/studio-jaad/`
