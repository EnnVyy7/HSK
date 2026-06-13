const { useState, useEffect, useRef } = React;

export default function HSKQuizApp() {
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  // --- SCREEN STATE ---
  // "select" = pemilihan soal, "quiz" = kuis berjalan
  const [screen, setScreen] = useState("select");

  // Nomor soal yang dipilih (1-based index, mengacu ke array words)
  const [selectedNums, setSelectedNums] = useState(() =>
    Array.from({ length: words.length }, (_, i) => i + 1),
  );
  // Untuk range selection: menyimpan anchor (titik awal klik)
  const [rangeAnchor, setRangeAnchor] = useState(null);

  const [mode, setMode] = useState("quiz");
  const [list, setList] = useState([]);
  const [index, setIndex] = useState(0);
  const [pinyin, setPinyin] = useState("");
  const [meaning, setMeaning] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [answered, setAnswered] = useState({});
  const [wrongAnswers, setWrongAnswers] = useState([]);

  const totalQuestions = list.length;
  const maxScore = totalQuestions * 2;
  const finalScore100 = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const current = list[index];

  const meaningRef = useRef(null);
  const pinyinRef = useRef(null);

  // --- TIMER (hardcore) ---
  useEffect(() => {
    if (mode === "hardcore" && started && !finished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, started, finished, timeLeft]);

  // --- AUTO FOCUS ---
  useEffect(() => {
    if (screen === "quiz") {
      pinyinRef.current?.focus();
    }
  }, [index, screen]);

  // --- NORMALISASI PINYIN ---
  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[âáǎà]/g, "a")
      .replace(/[êéěè]/g, "e")
      .replace(/[îíǐì]/g, "i")
      .replace(/[ôóǒò]/g, "o")
      .replace(/[ûúǔù]/g, "u");

  // --- MULAI QUIZ ---
  const startQuiz = () => {
    if (selectedNums.length === 0) return;
    const selected = selectedNums.map((n) => words[n - 1]);
    setList(shuffle(selected));
    setIndex(0);
    setPinyin("");
    setMeaning("");
    setScore(0);
    setFinished(false);
    setShowResult(false);
    setTimeLeft(1800);
    setStarted(false);
    setAnswered({});
    setWrongAnswers([]);
    setScreen("quiz");
  };

  // --- RANGE SELECTION ---
  // Klik pertama = set anchor, klik kedua = pilih/hapus semua nomor dalam range
  const handleNumClick = (n) => {
    if (rangeAnchor === null) {
      // Klik pertama: set anchor, toggle nomor ini
      setRangeAnchor(n);
      setSelectedNums((prev) =>
        prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
      );
    } else {
      // Klik kedua: tentukan range dari anchor ke n
      const lo = Math.min(rangeAnchor, n);
      const hi = Math.max(rangeAnchor, n);
      const rangeNums = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

      // Jika anchor sudah terpilih → pilih seluruh range
      // Jika anchor tidak terpilih → hapus seluruh range
      const anchorSelected = selectedNums.includes(rangeAnchor);

      setSelectedNums((prev) => {
        if (anchorSelected) {
          const merged = new Set([...prev, ...rangeNums]);
          return [...merged].sort((a, b) => a - b);
        } else {
          return prev.filter((x) => !rangeNums.includes(x));
        }
      });

      setRangeAnchor(null); // reset anchor setelah range dipilih
    }
  };

  const selectAll = () => {
    setRangeAnchor(null);
    setSelectedNums(Array.from({ length: words.length }, (_, i) => i + 1));
  };

  const deselectAll = () => {
    setRangeAnchor(null);
    setSelectedNums([]);
  };

  // --- CHECK ANSWER ---
  const checkAnswer = () => {
    let earned = 0;

    if (
      normalize(pinyin).trim() !== "" &&
      normalize(pinyin) === normalize(current[1])
    ) {
      earned += 1;
    }

    if (
      normalize(meaning).trim() !== "" &&
      (normalize(current[2]).includes(normalize(meaning)) ||
        normalize(meaning).includes(normalize(current[2])))
    ) {
      earned += 1;
    }

    setScore((prev) => prev + earned);

    if (earned < 2) {
      setWrongAnswers((prev) => [
        ...prev,
        { hanzi: current[0], pinyin: current[1], meaning: current[2] },
      ]);
    }

    setAnswered((prev) => ({
      ...prev,
      [index]: { pinyin: current[1], meaning: current[2], revealed: true },
    }));

    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setPinyin("");
    setMeaning("");

    if (index + 1 >= list.length) {
      setFinished(true);
      if (mode === "hardcore") {
        const finalScore = Math.round((score / maxScore) * 100);
        setHistory((prev) => [
          {
            nilai: finalScore,
            waktu: `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`,
          },
          ...prev,
        ]);
      }
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    const selected = selectedNums.map((n) => words[n - 1]);
    setList(shuffle(selected));
    setIndex(0);
    setPinyin("");
    setMeaning("");
    setScore(0);
    setFinished(false);
    setShowResult(false);
    setTimeLeft(1800);
    setStarted(false);
    setAnswered({});
    setWrongAnswers([]);
  };

  function handleEnter(event) {
    if (event.key === "Enter") {
      if (!showResult) checkAnswer();
      else nextQuestion();
    }
  }

  // ===========================
  // SCREEN: PEMILIHAN SOAL
  // ===========================
  if (screen === "select") {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-6">
          <h1 className="text-3xl font-bold text-center mb-2">HSK 1 Quiz</h1>
          <p className="text-center text-gray-500 mb-6">
            Pilih nomor soal yang ingin dikerjakan
          </p>

          {/* Tombol Pilih Semua / Hapus Semua */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={selectAll}
              className="px-4 py-2 rounded-2xl font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer text-sm"
            >
              Pilih Semua
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 rounded-2xl font-bold bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer text-sm"
            >
              Hapus Semua
            </button>
            <span className="ml-auto text-sm text-gray-500 self-center">
              {selectedNums.length} / {words.length} dipilih
            </span>
          </div>

          {/* Petunjuk range */}
          <div className="text-sm text-gray-400 mb-3">
            {rangeAnchor === null
              ? "💡 Klik nomor pertama untuk menentukan awal range"
              : `📍 Anchor: ${rangeAnchor} — sekarang klik nomor akhir range`}
          </div>

          {/* Grid Nomor */}
          <div className="grid grid-cols-8 gap-2 mb-6">
            {words.map((word, i) => {
              const num = i + 1;
              const isSelected = selectedNums.includes(num);
              const isAnchor = rangeAnchor === num;
              const inPreviewRange =
                rangeAnchor !== null &&
                num >= Math.min(rangeAnchor, num) &&
                num <= Math.max(rangeAnchor, num);

              return (
                <button
                  key={num}
                  onClick={() => handleNumClick(num)}
                  title={`${word[0]} (${word[1]}) — ${word[2]}`}
                  className={`
                    aspect-square rounded-xl font-bold text-sm cursor-pointer transition-all
                    ${
                      isAnchor
                        ? "bg-orange-400 text-white shadow-lg scale-110 ring-2 ring-orange-300"
                        : isSelected
                          ? "bg-blue-500 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }
                  `}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Preview kata yang dipilih */}
          {selectedNums.length > 0 && (
            <div className="bg-blue-50 rounded-2xl p-4 mb-6 max-h-40 overflow-y-auto">
              <p className="text-sm font-bold text-blue-700 mb-2">
                Kata yang dipilih:
              </p>
              <div className="flex flex-wrap gap-2">
                {[...selectedNums]
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <span
                      key={n}
                      className="bg-white text-blue-800 text-sm px-3 py-1 rounded-xl border border-blue-200"
                    >
                      {n}. {words[n - 1][0]}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Tombol Mulai */}
          <button
            onClick={startQuiz}
            disabled={selectedNums.length === 0}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-bold text-lg cursor-pointer transition-colors"
          >
            Mulai Quiz ({selectedNums.length} soal)
          </button>
        </div>
      </div>
    );
  }

  // ===========================
  // SCREEN: QUIZ
  // ===========================
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          {/* Tombol kembali ke pemilihan soal */}
          <button
            onClick={() => setScreen("select")}
            className="px-3 py-2 rounded-2xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer text-sm"
          >
            ← Pilih Soal
          </button>
          <h1 className="text-2xl font-bold flex-1 text-center pr-16">
            HSK 1 Quiz
          </h1>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode("quiz")}
            className={`px-4 py-2 rounded-2xl font-bold cursor-pointer ${mode === "quiz" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Quiz
          </button>

          <button
            onClick={() => setMode("hardcore")}
            className={`px-4 py-2 rounded-2xl font-bold cursor-pointer ${mode === "hardcore" ? "bg-purple-500 text-white" : "bg-gray-200"}`}
          >
            Hardcore
          </button>

          <button
            onClick={resetQuiz}
            className="px-4 py-2 rounded-2xl font-bold bg-green-500 text-white cursor-pointer"
          >
            Acak Ulang
          </button>
        </div>

        {mode === "hardcore" && (
          <div className="flex items-center gap-3 mb-4">
            {!started && (
              <button
                onClick={() => setStarted(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-2xl font-bold cursor-pointer"
              >
                ▶ Mulai Timer
              </button>
            )}

            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-2xl font-bold">
              ⏰ {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
          </div>
        )}

        {!finished ? (
          <>
            <div className="text-center mb-6">
              <p className="text-lg text-gray-500">
                Soal {index + 1} / {totalQuestions}
              </p>

              <h2 className="text-6xl font-bold my-6">{current[0]}</h2>
            </div>

            <div className="space-y-4">
              {answered[index]?.revealed && showResult && (
                <div className="bg-gray-100 rounded-2xl p-4 text-left">
                  <p>
                    <strong>Jawaban Benar:</strong>
                  </p>
                  <p>Pinyin: {answered[index].pinyin}</p>
                  <p>Arti: {answered[index].meaning}</p>
                </div>
              )}

              <input
                ref={pinyinRef}
                type="text"
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    meaningRef.current.focus();
                  }
                }}
                placeholder="Ketik pinyin bernada"
                className="w-full border-2 rounded-2xl px-4 py-3 outline-none focus:border-blue-400"
              />

              <input
                ref={meaningRef}
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEnter(e);
                }}
                placeholder="Ketik arti Indonesia"
                className="w-full border-2 rounded-2xl px-4 py-3 outline-none focus:border-blue-400"
              />

              <div className="flex gap-3">
                <button
                  onClick={prevQuestion}
                  disabled={index === 0}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-2xl font-bold disabled:opacity-50 cursor-pointer"
                >
                  Sebelumnya
                </button>

                {!showResult ? (
                  <button
                    onClick={checkAnswer}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-bold cursor-pointer"
                  >
                    Kirim Jawaban
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-bold cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Selesai 🎉</h2>

            <p className="text-2xl mb-6">Nilai: {finalScore100} / 100</p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={resetQuiz}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold cursor-pointer"
              >
                Main Lagi
              </button>
              <button
                onClick={() => setScreen("select")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold cursor-pointer"
              >
                Pilih Soal Lain
              </button>
            </div>
          </div>
        )}

        {mode === "hardcore" && history.length > 0 && (
          <div className="mt-8 bg-purple-100 rounded-3xl p-4">
            <h3 className="font-bold text-xl mb-3">📜 History Nilai</h3>

            <div className="space-y-2">
              {history.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-3">
                  <p>
                    #{i + 1} • {item.nilai}/100 • Sisa {item.waktu}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {wrongAnswers.length > 0 && (
          <div className="mt-8 bg-red-100 rounded-3xl p-4 text-left">
            <h3 className="font-bold text-xl mb-3">❌ Soal Yang Salah</h3>

            <div className="space-y-3">
              {wrongAnswers.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-3">
                  <p className="text-2xl font-bold">{item.hanzi}</p>
                  <p>Pinyin: {item.pinyin}</p>
                  <p>Arti: {item.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
