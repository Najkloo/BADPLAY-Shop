# BADPLAY Store — GitHub Pages

Gotowy statyczny frontend sklepu BADPLAY dla GitHub Pages.

## Co robi
- pobiera sklep/serwery/produkty z VIshop API,
- automatycznie pokazuje ceny i obrazki,
- obsługuje produkty ze sliderem,
- dla BadCoin może pobrać zakres 2–1000 bezpośrednio z konfiguracji VIshop,
- preferuje dostępne metody HotPay,
- tworzy płatność przez VIshop API.

## GitHub Pages
1. Utwórz repozytorium `BADPLAY-Shop`.
2. Wgraj `index.html`, `style.css`, `app.js`.
3. Settings → Pages → Deploy from branch → `main` → `/ (root)`.
4. Ustaw Custom domain na `sklep.badplay.pl`.
5. W Cloudflare utwórz CNAME:
   `sklep` → `TWOJ_LOGIN.github.io`
   DNS only.

## Ważne
`SHOP_ID` w `app.js` = `31216`.

Nie umieszczaj prywatnych sekretów/API keys w frontendzie. VIshop API używane tutaj jest przeznaczone do wywołań z frontendu i obsługuje CORS.

Jeżeli produkt BadCoin w VIshop ma slider 2–1000, strona pobierze te wartości automatycznie.


## Regulamin
Plik `regulamin.pdf` zawiera regulamin przekazany dla sklepu BADPLAY i jest wyświetlany bezpośrednio na stronie w sekcji „REGULAMIN”.


Regulamin jest dostępny jako osobna, responsywna podstrona `regulamin.html`.


Nawigacja: Sklep, Strona główna BADPLAY, Regulamin, Discord oraz przycisk Voucher.


Assets: logo BADPLAY oraz grafika BadCoin znajdują się w katalogu `assets/` i są używane bezpośrednio na stronie.
