import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, CloudSun, Quote, Brain, Grid2X2, Keyboard, VenetianMask,
  CircleHelp, Languages, Gamepad2, RotateCcw, Copy, RefreshCw, Trophy,
  Timer, CheckCircle2, XCircle, Search, Cloud, Sun, Wind
} from "lucide-react";
import "./MiniProjects.css";

const PROJECTS = [
  { id: "weather", title: "Weather App", description: "Look up current weather by city", icon: CloudSun, color: "blue", tag: "Utility" },
  { id: "quotes", title: "Random Quotes", description: "A little inspiration, one quote at a time", icon: Quote, color: "purple", tag: "Daily" },
  { id: "memory", title: "Memory Card Game", description: "Match pairs and train your memory", icon: Brain, color: "pink", tag: "Game" },
  { id: "tic", title: "Tic Tac Toe", description: "A classic two-player challenge", icon: Grid2X2, color: "cyan", tag: "Game" },
  { id: "typing", title: "Typing Speed Test", description: "Check your speed and accuracy", icon: Keyboard, color: "orange", tag: "Practice" },
  { id: "hangman", title: "Hangman", description: "Guess the hidden word", icon: VenetianMask, color: "green", tag: "Word game" },
  { id: "quiz", title: "Quiz with Timer", description: "Test your knowledge against the clock", icon: CircleHelp, color: "yellow", tag: "Quiz" },
  { id: "translator", title: "Language Translator", description: "Translate text between languages", icon: Languages, color: "indigo", tag: "Utility" },
  { id: "snake", title: "Snake Game", description: "Collect food and beat your high score", icon: Gamepad2, color: "lime", tag: "Arcade" },
];
const QUOTES = [
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
];
const WORDS = ["PLANET", "GARDEN", "JOURNEY", "PYTHON", "FRIEND", "RAINBOW", "PUZZLE", "ORANGE"];
const QUIZ = [
  { q: "Which language runs natively in a web browser?", options: ["Java", "C++", "JavaScript", "Python"], answer: 2 },
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: 1 },
  { q: "How many sides does a hexagon have?", options: ["Five", "Six", "Seven", "Eight"], answer: 1 },
  { q: "Which one is a JavaScript UI library?", options: ["React", "PostgreSQL", "Nginx", "Docker"], answer: 0 },
  { q: "What does CPU commonly stand for?", options: ["Central Processing Unit", "Computer Personal Utility", "Core Program User", "Central Power Utility"], answer: 0 },
];
const LANGUAGES = [{ code: "en", name: "English" }, { code: "hi", name: "Hindi" }, { code: "es", name: "Spanish" }, { code: "fr", name: "French" }, { code: "de", name: "German" }, { code: "it", name: "Italian" }, { code: "pt", name: "Portuguese" }, { code: "ja", name: "Japanese" }];
const TYPING_TEXT = "Learning something new every day helps us grow stronger together. Small steps can create meaningful progress over time.";
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export default function MiniProjects() {
  const [active, setActive] = useState("");
  const [search, setSearch] = useState("");
  const filtered = PROJECTS.filter((p) => `${p.title} ${p.description} ${p.tag}`.toLowerCase().includes(search.toLowerCase()));
  const current = PROJECTS.find((p) => p.id === active);
  return <div className="mini-projects-page">
    {!active ? <>
      <div className="mp-hero"><div><span className="mp-eyebrow"><SparklesIcon /> OUR VISION PLAYGROUND</span><h1><span>Games</span></h1><p>Take a break, learn something new, and have a little fun.</p></div><div className="mp-hero-orb"><Gamepad2 size={44} /></div></div>
      <div className="mp-toolbar"><div><h2>Explore projects</h2><p>Choose any project to get started.</p></div><label className="mp-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a project..." /></label></div>
      <div className="mp-project-grid">{filtered.map((p) => { const Icon = p.icon; return <button className="mp-project-card" key={p.id} onClick={() => setActive(p.id)}><div className={`mp-card-icon ${p.color}`}><Icon size={23} /></div><span className="mp-tag">{p.tag}</span><h3>{p.title}</h3><p>{p.description}</p><span className="mp-open">Open project <span>↗</span></span></button>; })}</div>
      {!filtered.length && <div className="mp-empty">No projects match that search.</div>}
      <p className="mp-footnote">Your games run in this browser. Game scores are kept for the current session.</p>
    </> : <>
      <button className="mp-back" onClick={() => setActive("")}><ArrowLeft size={17} /> Go Back</button>
      <div className="mp-play-heading"><div className={`mp-card-icon ${current?.color}`}>{current && <current.icon size={24} />}</div><div><span className="mp-eyebrow">GAME ZONE</span><h1>{current?.title}</h1><p>{current?.description}</p></div></div>
      <div className="mp-game-panel">{active === "weather" && <WeatherApp />}{active === "quotes" && <QuotesApp />}{active === "memory" && <MemoryGame />}{active === "tic" && <TicTacToe />}{active === "typing" && <TypingTest />}{active === "hangman" && <Hangman />}{active === "quiz" && <QuizGame />}{active === "translator" && <Translator />}{active === "snake" && <SnakeGame />}</div>
    </>}
  </div>;
}
function SparklesIcon(){ return <span aria-hidden="true">✦</span>; }

function WeatherApp() {
  const [city, setCity] = useState("New Delhi"); const [query, setQuery] = useState("New Delhi"); const [weather, setWeather] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function findWeather(e) { e?.preventDefault(); if (!query.trim()) return; setBusy(true); setError(""); setWeather(null); try { const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=1&language=en&format=json`); if (!g.ok) throw new Error("Location search is unavailable."); const gd = await g.json(); const place = gd.results?.[0]; if (!place) throw new Error("City not found. Try another city name."); const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`); if (!w.ok) throw new Error("Weather service is unavailable right now."); const wd = await w.json(); setWeather({ place, current: wd.current, daily: wd.daily }); setCity(place.name); } catch (err) { setError(err.message || "Could not load weather. Check your internet connection."); } finally { setBusy(false); } }
  useEffect(() => { findWeather(); }, []);
  const descriptions = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers", 95: "Thunderstorm" };
  return <div className="mp-tool-content"><form className="mp-inline-form" onSubmit={findWeather}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter city name" /><button className="mp-primary" disabled={busy}>{busy ? "Loading..." : "Get weather"}</button></form>{error && <p className="mp-error">{error}</p>}{weather && <><div className="mp-weather-main"><div><span className="mp-muted">{weather.place.name}{weather.place.country ? `, ${weather.place.country}` : ""}</span><h2>{Math.round(weather.current.temperature_2m)}°C</h2><p>{descriptions[weather.current.weather_code] || "Current conditions"}</p><span className="mp-muted">Feels like {Math.round(weather.current.apparent_temperature)}°C</span></div><div className="mp-weather-symbol">{weather.current.weather_code === 0 ? <Sun size={54} /> : <CloudSun size={54} />}</div></div><div className="mp-weather-stats"><div><Wind /><span>Wind</span><b>{weather.current.wind_speed_10m} km/h</b></div><div><Cloud /><span>Humidity</span><b>{weather.current.relative_humidity_2m}%</b></div><div><Sun /><span>Today's range</span><b>{Math.round(weather.daily.temperature_2m_min[0])}° / {Math.round(weather.daily.temperature_2m_max[0])}°C</b></div></div><p className="mp-muted mp-small">Weather data provided by Open-Meteo.</p></>}</div>;
}
function QuotesApp() { const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length)); const [copied, setCopied] = useState(false); const quote = QUOTES[index]; async function copy() { try { await navigator.clipboard.writeText(`“${quote.text}” — ${quote.author}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } } return <div className="mp-quote-wrap"><Quote size={35} /><blockquote>“{quote.text}”</blockquote><p>— {quote.author}</p><div className="mp-actions"><button className="mp-secondary" onClick={copy}><Copy size={16} /> {copied ? "Copied" : "Copy quote"}</button><button className="mp-primary" onClick={() => setIndex((index + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length)}><RefreshCw size={16} /> New quote</button></div></div>; }
function MemoryGame() { const symbols = ["🚀", "🎧", "🌈", "🍀", "🎮", "🪐", "🎯", "🧩"]; const [deck, setDeck] = useState(() => shuffle([...symbols, ...symbols]).map((symbol, id) => ({ id, symbol }))); const [opened, setOpened] = useState([]); const [matched, setMatched] = useState([]); const [moves, setMoves] = useState(0); const [lock, setLock] = useState(false); const timer = useRef(null); useEffect(() => () => clearTimeout(timer.current), []); function flip(card) { if (lock || opened.includes(card.id) || matched.includes(card.id)) return; const next = [...opened, card.id]; setOpened(next); if (next.length === 2) { setMoves((m) => m + 1); const first = deck.find((x) => x.id === next[0]); if (first.symbol === card.symbol) { setMatched((m) => [...m, ...next]); setOpened([]); } else { setLock(true); timer.current = setTimeout(() => { setOpened([]); setLock(false); }, 750); } } } function reset() { clearTimeout(timer.current); setDeck(shuffle([...symbols, ...symbols]).map((symbol, id) => ({ id, symbol }))); setOpened([]); setMatched([]); setMoves(0); setLock(false); } return <div className="mp-tool-content"><div className="mp-game-stats"><span>Moves <b>{moves}</b></span><span>Pairs <b>{matched.length / 2}/8</b></span><button className="mp-secondary" onClick={reset}><RotateCcw size={15} /> Restart</button></div><div className="mp-memory-grid">{deck.map((c) => <button key={c.id} className={`mp-memory-card ${opened.includes(c.id) || matched.includes(c.id) ? "revealed" : ""} ${matched.includes(c.id) ? "matched" : ""}`} onClick={() => flip(c)} aria-label="Memory card">{opened.includes(c.id) || matched.includes(c.id) ? c.symbol : "✦"}</button>)}</div>{matched.length === 16 && <div className="mp-success"><Trophy /> Brilliant! You matched every pair in {moves} moves.</div>}</div>; }
function TicTacToe() { const [board, setBoard] = useState(Array(9).fill("")); const [turn, setTurn] = useState("X"); const [mode, setMode] = useState("two"); const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; const winner = lines.map((line) => line.every((i) => board[i] && board[i] === board[line[0]]) ? board[line[0]] : null).find(Boolean); const draw = !winner && board.every(Boolean); function play(i) { if (board[i] || winner || draw) return; const next = [...board]; next[i] = turn; setBoard(next); setTurn(turn === "X" ? "O" : "X"); } useEffect(() => { if (mode !== "cpu" || turn !== "O" || winner || draw) return; const id = setTimeout(() => { const free = board.map((v,i) => v ? -1 : i).filter((i) => i >= 0); if (free.length) { const next = [...board]; next[free[Math.floor(Math.random() * free.length)]] = "O"; setBoard(next); setTurn("X"); } }, 400); return () => clearTimeout(id); }, [mode, turn, board, winner, draw]); return <div className="mp-tool-content mp-center"><div className="mp-segment"><button className={mode === "two" ? "selected" : ""} onClick={() => { setMode("two"); setBoard(Array(9).fill("")); setTurn("X"); }}>Two players</button><button className={mode === "cpu" ? "selected" : ""} onClick={() => { setMode("cpu"); setBoard(Array(9).fill("")); setTurn("X"); }}>Vs computer</button></div><p className="mp-game-status">{winner ? `${winner} wins!` : draw ? "It's a draw!" : `${turn}'s turn`}</p><div className="mp-tic-grid">{board.map((v,i) => <button key={i} className={`mp-tic-cell ${v === "X" ? "x" : "o"}`} onClick={() => play(i)}>{v}</button>)}</div><button className="mp-primary" onClick={() => { setBoard(Array(9).fill("")); setTurn("X"); }}><RotateCcw size={16} /> New game</button></div>; }
function TypingTest() { const [text, setText] = useState(""); const [seconds, setSeconds] = useState(60); const [running, setRunning] = useState(false); const [started, setStarted] = useState(false); const inputRef = useRef(null); useEffect(() => { if (!running) return; const id = setInterval(() => setSeconds((s) => { if (s <= 1) { setRunning(false); return 0; } return s - 1; }), 1000); return () => clearInterval(id); }, [running]); const elapsed = 60 - seconds; const correct = text.split("").filter((c,i) => c === TYPING_TEXT[i]).length; const wpm = elapsed ? Math.round((correct / 5) / (elapsed / 60)) : 0; function change(v) { if (!started) { setStarted(true); setRunning(true); } setText(v.slice(0, TYPING_TEXT.length)); } function reset() { setText(""); setSeconds(60); setRunning(false); setStarted(false); } return <div className="mp-tool-content"><div className="mp-game-stats"><span><Timer size={16} /> Time <b>{seconds}s</b></span><span>Speed <b>{wpm} WPM</b></span><span>Accuracy <b>{text.length ? Math.round(correct / text.length * 100) : 100}%</b></span></div><p className="mp-typing-prompt">{TYPING_TEXT.split("").map((c,i) => <span key={i} className={i < text.length ? (text[i] === c ? "correct" : "wrong") : ""}>{c}</span>)}</p><textarea ref={inputRef} className="mp-textarea" value={text} onChange={(e) => change(e.target.value)} disabled={seconds === 0} placeholder="Click here and start typing the text above..." rows={4} /><div className="mp-actions"><button className="mp-primary" onClick={() => inputRef.current?.focus()} disabled={seconds === 0}>Start typing</button><button className="mp-secondary" onClick={reset}><RotateCcw size={16} /> Restart</button></div>{seconds === 0 && <div className="mp-success">Test complete — {wpm} WPM with {text.length ? Math.round(correct / text.length * 100) : 100}% accuracy.</div>}</div>; }
function Hangman() { const [word, setWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]); const [guesses, setGuesses] = useState([]); const [hint, setHint] = useState(false); const misses = guesses.filter((g) => !word.includes(g)).length; const won = [...word].every((c) => guesses.includes(c)); const lost = misses >= 6; function reset() { setWord(WORDS[Math.floor(Math.random() * WORDS.length)]); setGuesses([]); setHint(false); } function guess(c) { if (!guesses.includes(c) && !won && !lost) setGuesses((g) => [...g, c]); } useEffect(() => { const key = (e) => { const c = e.key.toUpperCase(); if (/^[A-Z]$/.test(c)) guess(c); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }); return <div className="mp-tool-content mp-center"><div className="mp-hangman-drawing">{["", "●", "●\n│", "●\n╱│", "●\n╱│╲", "●\n╱│╲\n╱", "●\n╱│╲\n╱ ╲"][Math.min(misses,6)]}</div><p className="mp-muted">Wrong guesses: {misses}/6</p><div className="mp-word">{[...word].map((c,i) => <span key={i}>{guesses.includes(c) || lost ? c : "_"}</span>)}</div>{hint && <p className="mp-muted">Hint: A common everyday word.</p>}<div className="mp-keyboard">{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => <button key={c} disabled={guesses.includes(c) || won || lost} className={guesses.includes(c) ? (word.includes(c) ? "key-good" : "key-bad") : ""} onClick={() => guess(c)}>{c}</button>)}</div>{won && <div className="mp-success">You got it! The word was {word}.</div>}{lost && <div className="mp-error">Game over — the word was {word}.</div>}<div className="mp-actions"><button className="mp-secondary" onClick={() => setHint((h) => !h)}>Toggle hint</button><button className="mp-primary" onClick={reset}><RotateCcw size={16} /> New word</button></div></div>; }
function QuizGame() { const [order, setOrder] = useState(() => shuffle(QUIZ)); const [index, setIndex] = useState(0); const [answers, setAnswers] = useState([]); const [seconds, setSeconds] = useState(15); const [done, setDone] = useState(false); const question = order[index]; useEffect(() => { if (done) return; setSeconds(15); const id = setInterval(() => setSeconds((s) => { if (s <= 1) { clearInterval(id); setAnswers((a) => [...a, -1]); if (index + 1 >= order.length) setDone(true); else setIndex((i) => i + 1); return 0; } return s - 1; }), 1000); return () => clearInterval(id); }, [index, done, order.length]); function answer(i) { if (done) return; const next = [...answers, i]; setAnswers(next); if (index + 1 >= order.length) setDone(true); else setIndex(index + 1); } function reset() { setOrder(shuffle(QUIZ)); setIndex(0); setAnswers([]); setDone(false); setSeconds(15); } const score = answers.reduce((n,a,i) => n + (a === order[i]?.answer ? 1 : 0), 0); return <div className="mp-tool-content">{done ? <div className="mp-quiz-result"><Trophy size={40} /><h2>Quiz complete!</h2><p>You scored {score} out of {order.length}</p><button className="mp-primary" onClick={reset}><RotateCcw size={16} /> Play again</button></div> : <><div className="mp-game-stats"><span>Question <b>{index + 1}/{order.length}</b></span><span className={seconds <= 5 ? "mp-timer-low" : ""}><Timer size={16} /> <b>{seconds}s</b></span><span>Score <b>{answers.reduce((n,a,i) => n + (a === order[i]?.answer ? 1 : 0),0)}</b></span></div><div className="mp-quiz-progress"><span style={{ width: `${(index / order.length) * 100}%` }} /></div><h2 className="mp-quiz-question">{question.q}</h2><div className="mp-quiz-options">{question.options.map((opt,i) => <button key={opt} onClick={() => answer(i)}>{String.fromCharCode(65+i)} <span>{opt}</span></button>)}</div></>}</div>; }


function Translator() {
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("hi");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function translate(e) {
    e?.preventDefault();

    if (!input.trim()) {
      setError("Please enter some text to translate.");
      setOutput("");
      return;
    }

    if (source === target) {
      setOutput(input.trim());
      setError("");
      return;
    }

    setBusy(true);
    setError("");
    setOutput("");

    try {
      const params = new URLSearchParams({
        q: input.trim(),
        langpair: `${source}|${target}`,
      });

      const response = await fetch(
        `https://api.mymemory.translated.net/get?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Translation service error (${response.status}). Please try again.`
        );
      }

      const data = await response.json();
      const translated = data?.responseData?.translatedText;

      if (
        !translated ||
        data?.responseStatus !== 200
      ) {
        throw new Error(
          data?.responseDetails ||
          "Translation could not be completed. Try another language pair."
        );
      }

      setOutput(translated);
    } catch (err) {
      setError(
        err.message ||
        "Unable to translate. Please check your internet connection."
      );
    } finally {
      setBusy(false);
    }
  }

  function swapLanguages() {
    setSource(target);
    setTarget(source);
    setInput(output || input);
    setOutput("");
    setError("");
  }

  return (
    <div className="mp-tool-content mp-translator">
      <div className="mp-language-row">
        <label>
          From
          <select
            value={source}
            onChange={(e) => {
              const nextSource = e.target.value;
              setSource(nextSource);

              if (nextSource === target) {
                setTarget(source);
              }

              setOutput("");
              setError("");
            }}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="mp-swap"
          onClick={swapLanguages}
          aria-label="Swap languages"
          title="Swap languages"
        >
          ⇄
        </button>

        <label>
          To
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setOutput("");
              setError("");
            }}
          >
            {LANGUAGES.filter(
              (language) => language.code !== source
            ).map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mp-translate-grid">
        <textarea
          className="mp-textarea"
          rows={6}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          placeholder="Type or paste text here..."
        />

        <div
          className={`mp-translation-output ${
            output ? "has-translation" : ""
          }`}
          aria-live="polite"
        >
          {output || (
            <span className="mp-muted">
              Your translated text will appear here.
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="mp-primary mp-translate-button"
        onClick={translate}
        disabled={busy}
      >
        {busy ? (
          <>
            <span className="mp-translate-spinner" />
            Translating...
          </>
        ) : (
          <>
            <Languages size={16} />
            Translate text
          </>
        )}
      </button>

      {error && (
        <p className="mp-error" role="alert">
          {error}
        </p>
      )}

      {output && (
        <button
          type="button"
          className="mp-secondary mp-copy-output"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(output);
            } catch {
              setError("Could not copy text. Please copy it manually.");
            }
          }}
        >
          <Copy size={15} />
          Copy translation
        </button>
      )}

      <p className="mp-muted mp-small">
        Translation uses the MyMemory online translation service.
        An internet connection is required, and service limits may apply.
      </p>
    </div>
  );
}

function SnakeGame() { const size = 16; const [snake, setSnake] = useState([[7,8],[6,8],[5,8]]); const [food, setFood] = useState([10,8]); const [direction, setDirection] = useState([1,0]); const [running, setRunning] = useState(false); const [over, setOver] = useState(false); const [score, setScore] = useState(0); const snakeRef = useRef(snake); const dirRef = useRef(direction); useEffect(() => { snakeRef.current = snake; }, [snake]); useEffect(() => { dirRef.current = direction; }, [direction]); useEffect(() => { const key = (e) => { const map = { ArrowUp:[0,-1], w:[0,-1], ArrowDown:[0,1], s:[0,1], ArrowLeft:[-1,0], a:[-1,0], ArrowRight:[1,0], d:[1,0] }; const next = map[e.key]; if (!next) return; e.preventDefault(); const d = dirRef.current; if (next[0] === -d[0] && next[1] === -d[1]) return; setDirection(next); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, []); useEffect(() => { if (!running || over) return; const id = setInterval(() => { const old = snakeRef.current; const d = dirRef.current; const head = [old[0][0]+d[0], old[0][1]+d[1]]; const ate = head[0] === food[0] && head[1] === food[1]; const body = ate ? old : old.slice(0,-1); if (head[0] < 0 || head[0] >= size || head[1] < 0 || head[1] >= size || body.some(([x,y]) => x === head[0] && y === head[1])) { setRunning(false); setOver(true); return; } const next = [head, ...body]; setSnake(next); if (ate) { setScore(s => s + 1); let f; do { f = [Math.floor(Math.random()*size), Math.floor(Math.random()*size)]; } while (next.some(([x,y]) => x === f[0] && y === f[1])); setFood(f); } }, 160); return () => clearInterval(id); }, [running, over, food]); function reset() { setSnake([[7,8],[6,8],[5,8]]); setFood([10,8]); setDirection([1,0]); setScore(0); setOver(false); setRunning(true); } return <div className="mp-tool-content mp-center"><div className="mp-game-stats"><span>Score <b>{score}</b></span><span>{over ? "Game over" : running ? "Game in progress" : "Ready to play"}</span></div><div className="mp-snake-board">{Array.from({length:size*size},(_,i) => { const x=i%size, y=Math.floor(i/size); const isSnake=snake.some(([sx,sy])=>sx===x&&sy===y); const isHead=snake[0][0]===x&&snake[0][1]===y; const isFood=food[0]===x&&food[1]===y; return <div key={i} className={`mp-snake-cell ${isSnake?"snake":""} ${isHead?"head":""} ${isFood?"food":""}`} />; })}</div><p className="mp-muted">Use arrow keys or WASD to move.</p><div className="mp-actions"><button className="mp-primary" onClick={() => running ? setRunning(false) : over ? reset() : setRunning(true)}>{running ? "Pause" : over ? "Play again" : "Start game"}</button><button className="mp-secondary" onClick={reset}><RotateCcw size={16} /> Restart</button></div></div>; }
