# Checkster

**Pehle samjhein, phir paise dein.** Understand it before you pay.

Checkster is a second opinion for home repairs in Pakistan. A homeowner takes a photo of the problem (seelan, leak, darar), a panel of AI experts discusses it, the price is checked against **official government rates**, and nearby kaarigars reply to the homeowner's offer.

> **Prototype.** AI results, kaarigar profiles, job requests and material prices are **sample data** and are labelled "Demo data" in the app. Labour rates are **real published figures**, shown with their source and date. Not a certified building inspection.

## What you can try

| Page | What it does |
|---|---|
| `/` | Landing page: describe or photograph your problem, see official rates, how it works |
| `/check` | Homeowner flow: Photo → Checkup → Experts chat → Price → Kaarigar → Report |
| `/check?sample=1` | The same flow with a sample photo and description |
| `/worker` | Kaarigar portal: sign up in 3 simple steps, go online, accept jobs or offer your price |

Every screen has a **English ↔ اردو** switch (Urdu is right-to-left, in Nastaliq).

### Homeowner flow
1. **Photo**: camera or gallery, problem type, describe in your words (typing or voice), room, size, city
2. **Checkup**: the photo is scanned; problem areas are marked and numbered
3. **Experts**: Plumber, Mason and Waterproofing experts discuss in a group chat, ask 2 questions, and give a final decision with safety advice
4. **Price**: either a fair price built from official day rates, or a line-by-line check of the contractor's quote (fixed rules, no AI maths, never calls anyone a cheat)
5. **Kaarigar**: offer your price; nearby kaarigars accept or counter, with distance, arrival time and rating on a map
6. **Report**: before-you-pay checklist, print / save as PDF, share on WhatsApp

## Official rates used

| Figure | Source |
|---|---|
| Mason Rs 1,987/day · Plumber Rs 1,754/day · Painter Rs 1,709/day · Electrician Rs 279/point | Pakistan Bureau of Statistics (SPI), national average, reported Jan 2026 |
| Skilled worker Rs 2,000/day | Finance Department Punjab, labour rates for government works, Jul–Dec 2026 |

Next: item-level rates from the KP Market Rate System (MRS).

## Run it

Needs Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Code map

```
app/
  page.tsx            landing page
  check/page.tsx      homeowner flow
  worker/page.tsx     kaarigar portal
components/
  site/               header, footer, mascot, line illustrations
  landing/            landing page sections
  check/              one file per step + map + shared shell
  worker/             kaarigar portal
lib/
  i18n.tsx            English ↔ Urdu switch ({ en, ur } text pairs)
  data.ts             official rates (real) and sample data (labelled)
  audit.ts            quote-checking rules
```

## Next steps
1. FastAPI backend with the same shapes as `lib/data.ts`
2. Vision model for the photo checkup; reading quotes from photo/PDF
3. Real kaarigar accounts with CNIC verification, real maps
4. Item-level official prices (KP MRS) for one pilot city
