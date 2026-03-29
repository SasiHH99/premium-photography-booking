# Élesítési és élő QA checklist

## 0. Kiindulás
- [ ] A legfrissebb deploy ment ki a `main` branchről.
- [ ] Telefonon és desktopon is teljes újratöltést csináltál.
- [ ] Ha korábban régi header vagy régi nyelvi tartalom maradt bent, törölted a site data-t.
- [ ] A teszteket éles domainen futtatod: `https://bphoto.at`.

## 1. Mobil kritikus ellenőrzés
### 1.1 Header / hamburger
- [ ] `HU` főoldalon a hamburger ikon látható.
- [ ] A hamburger megnyitásakor a menü nem jelenik meg felül összecsúszott szövegként.
- [ ] A mobil menü elemei kattinthatók.
- [ ] A mobil menü bezárható `X` gombbal.
- [ ] A mobil menü bezárható a backdropra kattintva.
- [ ] A mobil menü után az oldal újra görgethető.
- [ ] Ugyanez rendben van `DE` és `EN` főoldalon is.

### 1.2 Hero és CTA-k
- [ ] A hero headline nem fut ki a képre vagy a képernyőből.
- [ ] A primary CTA látható és kattintható.
- [ ] A secondary CTA látható és kattintható.
- [ ] Nincs levágott vagy törött szöveg mobilon.

## 2. Nyelvi ellenőrzés
### 2.1 HU
- [ ] `https://bphoto.at/hu/index.html` magyar szöveggel jön be.
- [ ] `Portfólió`, `Árak`, `Foglalás`, `Kapcsolat`, `Online galéria` linkek jó oldalakra visznek.
- [ ] Nincs német vagy angol maradványszöveg látható helyen.

### 2.2 DE
- [ ] `https://bphoto.at/de/index.html` német szöveggel jön be.
- [ ] Nincs törött umlaut vagy hibás karakter.
- [ ] A fő navigáció németül jelenik meg.

### 2.3 EN
- [ ] `https://bphoto.at/en/index.html` angol szöveggel jön be.
- [ ] Nem német fallback szöveg látszik.
- [ ] Az EN navigáció kattintható és angol oldalakra visz.
- [ ] A legal oldalak is angolul jelennek meg:
  - [ ] `/en/privacy.html`
  - [ ] `/en/terms.html`
  - [ ] `/en/imprint.html`

## 3. Publikus oldalak vizuális ellenőrzése
### 3.1 Főoldal
- [ ] Trust row nem törik szét csúnyán.
- [ ] Services kártyák ritmusa rendben van.
- [ ] Pricing szekcióban a középső kártya kiemelése rendben van.
- [ ] Testimonials jól olvashatók.
- [ ] Footer nem csúszik szét mobilon.

### 3.2 Portfólió
- [ ] A felső rész nem üres hatású.
- [ ] A filter gombok kattinthatók mobilon.
- [ ] A filter váltáskor a képek jól frissülnek.
- [ ] A lightbox megnyílik.
- [ ] A lightbox bezárható.
- [ ] A lightbox előző/következő navigáció működik.
- [ ] A CTA blokk vizuálisan külön áll a galériától.

### 3.3 Árak / pricing
- [ ] Mindhárom csomag jól olvasható mobilon.
- [ ] A CTA gombok kattinthatók.
- [ ] Nincs törött ár- vagy kedvezményszöveg.

### 3.4 Kapcsolat
- [ ] A kontakt csatornák kártyái rendben jelennek meg.
- [ ] A form mezők nem csúsznak szét.
- [ ] A success állapot jól jelenik meg.

### 3.5 Foglalás
- [ ] A csomagválasztó lenyíló működik.
- [ ] A dátumválasztó működik.
- [ ] A hírlevél checkbox látható.
- [ ] A hírlevél checkbox kattintható.
- [ ] A success state vagy thank-you átirányítás rendben van.

## 4. Booking flow teljes teszt
- [ ] Küldj egy teszt foglalást HU oldalon.
- [ ] Küldj egy teszt foglalást DE oldalon.
- [ ] Az ügyfél visszaigazoló email megérkezik.
- [ ] Az admin értesítés megérkezik a jelenlegi stabil címre.
- [ ] A booking mentődik az adminba.
- [ ] A booking thank-you oldal helyes szöveget mutat.
- [ ] Ha a hírlevél pipa be van jelölve, megy a newsletter subscribe flow.

## 5. Kontakt flow teljes teszt
- [ ] Küldj egy teszt kontakt üzenetet HU oldalon.
- [ ] Küldj egy teszt kontakt üzenetet DE oldalon.
- [ ] Az admin email megérkezik.
- [ ] Az üzenet megjelenik az adminban.
- [ ] A thank-you állapot vagy külön thank-you oldal rendben van.

## 6. Newsletter flow teljes teszt
### 6.1 Feliratkozás
- [ ] Főoldali feliratkozás működik HU oldalon.
- [ ] Főoldali feliratkozás működik DE oldalon.
- [ ] Főoldali feliratkozás működik EN oldalon.
- [ ] A megerősítő email megérkezik.
- [ ] A megerősítő link jó domainre mutat.
- [ ] A megerősítő oldal rendben jelenik meg.
- [ ] A státusz `confirmed` lesz az adminban.

### 6.2 Leiratkozás
- [ ] A leiratkozó link működik.
- [ ] A leiratkozó oldal rendben jelenik meg.
- [ ] A státusz `unsubscribed` lesz az adminban.

### 6.3 Admin kampány
- [ ] A hírlevél admin oldalon nincs piros hiba sáv.
- [ ] Az `Aktív küldő` mező értelmes sendert mutat.
- [ ] A `Tesztküldés` működik.
- [ ] A `Kampány küldése` működik legalább 1 confirmed címre.
- [ ] A `Legutóbbi küldések` log frissül.
- [ ] A küldési visszajelző dobozban látszik sender, siker és hiba szám.

## 7. Galéria flow
- [ ] Galéria login oldal betölt HU/DE/EN nyelven.
- [ ] A login sikeres a teszt userrel.
- [ ] Első belépésnél kötelező jelszócsere működik.
- [ ] Elfelejtett jelszó flow működik.
- [ ] A kliens látja a feltöltött képeket.
- [ ] A kedvencek szív ikon működik.
- [ ] A kedvencek szűrő működik.

## 8. Admin alap QA
- [ ] Dashboard betölt.
- [ ] Foglalások oldal betölt.
- [ ] Kapcsolatok oldal betölt.
- [ ] Galéria oldal betölt.
- [ ] Portfólió oldal betölt.
- [ ] Hírlevél oldal betölt.
- [ ] A szűrők és a `Szűrők törlése` gombok működnek.
- [ ] A detail panelek sticky vagy jól olvasható állapotban vannak desktopon.
- [ ] Mobilon az admin nem esik szét.

## 9. Portfólió admin QA
- [ ] Új kép feltöltése után nem a meglévőt írja felül.
- [ ] Több képet egymás után fel lehet vinni.
- [ ] Szerkesztés külön működik.
- [ ] Törlés külön működik.
- [ ] A publikus portfólión megjelenik az új elem.

## 10. Kézi analitika / tracking QA
- [ ] A Google tag jelen van a publikus oldalakon.
- [ ] Booking siker után `gtag` event megy.
- [ ] Kontakt siker után `gtag` event megy.
- [ ] Newsletter signup után `gtag` event megy.
- [ ] Newsletter confirm után `gtag` event megy.
- [ ] A valódi Google Ads conversion label-ek még külön bekötésre várnak, ha nincsenek meg az `AW-.../...` azonosítók.

## 11. SEO / social preview gyors ellenőrzés
- [ ] `robots.txt` elérhető.
- [ ] `sitemap.xml` elérhető.
- [ ] A főoldalak `<title>` és meta descriptionje rendben van.
- [ ] Megosztáskor az OG kép jelenik meg.

## 12. Ha hiba van
Minden hibánál rögzítsd:
- pontos URL
- eszköz: desktop / iPhone / Android
- nyelv: HU / DE / EN
- mit nyomtál meg előtte
- screenshot
- ha email hiba: Resend státusz (`Delivered`, `Bounced`, `Suppressed`)

## 13. Kilépési feltétel
A site akkor tekinthető lezártnak, ha:
- [ ] mobil hamburger minden nyelven stabil
- [ ] booking, contact, newsletter flow végigtesztelve
- [ ] admin oldalak stabilak
- [ ] nincs látható karaktertörés
- [ ] nincs blokkosító vizuális hiba
- [ ] az email küldés a stabil címekre megy