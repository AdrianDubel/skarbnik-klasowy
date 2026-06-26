# Skarbnik Klasowy 💚

Aplikacja webowa (mobile-first) dla **skarbnika klasy szkolnej** do zarządzania
składkami, wydatkami i rozliczeniami uczniów. Zbudowana w **React + Vite**,
z naciskiem na wyrazisty, „nie-generyczny” interfejs (motyw *Mint Ledger*)
zgodnie ze skillem `distinctive-frontend`.

## Funkcjonalności

| Zakładka | Opis |
|----------|------|
| **Kasa** | Saldo kasy klasowej, suma wpłat per uczeń (ze wszystkich zbiórek) oraz suma całkowita. |
| **Klasa** | Dodawanie, edycja i usuwanie uczniów. |
| **Zbiórki** | Tworzenie zbiórek (nazwa, kwota docelowa/os., termin). Każdy uczeń ma status wpłaty: *opłacone / częściowe / zalega*. Import wyciągu bankowego. |
| **Wydatki** | Dodawanie wydatków klasowych — odejmowane od salda kasy. |
| **Dłużnicy** | Lista uczniów zalegających — w wybranej zbiórce lub globalnie. Kopiowanie listy do schowka. |

### Import wyciągu bankowego (CSV / PDF)
W szczegółach zbiórki kliknij **„Importuj wyciąg bankowy”** i wgraj plik:

- **CSV** – kolumny wykrywane automatycznie (separator `;` lub `,`, kwoty `120,00` lub `120.00`).
- **PDF** – tekst jest ekstrahowany i analizowany linia po linii.

Aplikacja dopasowuje wpłaty do uczniów po **imieniu i nazwisku** lub samym
**nazwisku** (ignorując polskie znaki i wielkość liter), a następnie pozwala
ręcznie poprawić każde dopasowanie przed zaksięgowaniem. Plik
[przyklad-wyciag.csv](przyklad-wyciag.csv) służy do szybkiego testu.

## Uruchomienie

```bash
cd skarbnik-app
npm install
npm run dev
```

Aplikacja otworzy się na `http://localhost:5173`.

```bash
npm run build    # produkcyjny build do ./dist
npm run preview  # podgląd builda
```

## Dane

Aplikacja działa w **dwóch trybach**:

- **Tryb lokalny (domyślny)** – dane przechowywane w przeglądarce
  (`localStorage`, klucz `skarbnik-klasowy:v1`). Działa bez żadnej konfiguracji.
- **Tryb chmurowy (Firebase)** – po podaniu konfiguracji Firebase aplikacja
  wymaga logowania (Google) i synchronizuje dane w czasie rzeczywistym między
  urządzeniami (Firestore). Przy pierwszym logowaniu istniejące dane lokalne są
  automatycznie przenoszone do chmury.

### Konfiguracja Firebase (opcjonalnie)

1. Wejdź na [console.firebase.google.com](https://console.firebase.google.com)
   i utwórz nowy projekt.
2. **Authentication** → Sign-in method → włącz **Google**.
3. **Firestore Database** → utwórz bazę (tryb produkcyjny).
4. W zakładce **Rules** wklej zawartość pliku
   [firestore.rules](firestore.rules) i opublikuj — gwarantuje to, że każdy
   użytkownik widzi wyłącznie własne dane.
5. **Project settings → General → Your apps** → dodaj aplikację Web i skopiuj
   wartości konfiguracji.
6. Skopiuj `.env.example` do `.env` i uzupełnij zmienne `VITE_FIREBASE_*`:
   ```bash
   cp .env.example .env
   ```
7. (Dla localhost dodaj `localhost` w Authentication → Settings → Authorized
   domains — zwykle jest już dodany.)
8. Zrestartuj `npm run dev`. Aplikacja pokaże ekran logowania i przełączy się
   na tryb chmurowy.

> Bez pliku `.env` (lub z pustymi kluczami) aplikacja po prostu działa lokalnie.

## Architektura

```
src/
  main.jsx                 # punkt wejścia
  App.jsx                  # powłoka + dolna nawigacja + bramka logowania
  index.css                # design system „Slate & Emerald”
  store/useStore.jsx       # stan (useReducer + Context) + persystencja (local/cloud) + auth + selektory
  firebase/
    config.js              # inicjalizacja Firebase z env (flaga firebaseEnabled)
    sync.js                # auth (Google) + realtime sync Firestore
  utils/
    money.js               # formatowanie/parsowanie PLN
    matching.js            # parsowanie transakcji + dopasowanie do uczniów
    parseStatement.js      # czytanie plików CSV (PapaParse) i PDF (pdf.js)
  components/
    Icons.jsx              # zestaw ikon SVG
    Sheet.jsx              # modal typu bottom-sheet
  views/
    LoginView.jsx          # ekran logowania (tryb chmurowy)
    SummaryView.jsx        # Kasa
    StudentsView.jsx       # Klasa
    CollectionsView.jsx    # Zbiórki + szczegóły + statusy wpłat
    ImportStatement.jsx    # Import wyciągu
    ExpensesView.jsx       # Wydatki
    DebtorsView.jsx        # Dłużnicy
```

## Stack

- **React 18** + **Vite 5**
- **Firebase** (Auth + Firestore) – logowanie i synchronizacja w chmurze (opcjonalnie)
- **PapaParse** – parsowanie CSV
- **pdf.js (pdfjs-dist)** – ekstrakcja tekstu z PDF
- Czysty CSS (zmienne / design tokens), bez bibliotek UI
