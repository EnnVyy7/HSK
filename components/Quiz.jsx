const { useState, useEffect, useMemo, useRef } = React;

export default function HSKQuizApp() {
  // HSK 1 No 1 - 20

  const words = [
    ["爱", "ài", "cinta"],
    ["八", "bā", "delapan"],
    ["爸爸", "bà ba", "ayah"],
    ["吧", "ba", "ajak"],
    ["白天", "bái tiān", "siang hari"],
    ["百", "bǎi", "seratus"],
    ["半", "bàn", "setengah"],
    ["包子", "bāo zi", "bakpao"],
    ["杯子", "bēi zi", "cangkir"],
    ["本", "běn", "sebuah"],
    ["边", "biān", "samping"],
    ["病", "bìng", "sakit"],
    ["不", "bù", "tidak"],
    ["不客气", "bú kè qi", "sama sama"],
    ["不要", "bú yào", "jangan"],
    ["菜", "cài", "sayur"],
    ["茶", "chá", "teh"],
    ["唱", "chàng", "nyanyi"],
    ["超市", "chāo shì", "supermarket"],
    ["车", "chē", "mobil"],
  ];

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const [mode, setMode] = useState("quiz");
  const [list, setList] = useState(shuffle(words));
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

  const totalQuestions = words.length;
  const maxScore = totalQuestions * 2;
  const finalScore100 = Math.round((score / maxScore) * 100);

  const current = list[index];

  const meaningRef = useRef(null);
  const pinyinRef = useRef(null);

  useEffect(() => {
    if (mode === "hardcore" && started && !finished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [mode, started, finished, timeLeft]);

  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[âáǎà]/g, "a")
      .replace(/[êéěè]/g, "e")
      .replace(/[îíǐì]/g, "i")
      .replace(/[ôóǒò]/g, "o")
      .replace(/[ûúǔù]/g, "u");

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
        {
          hanzi: current[0],
          pinyin: current[1],
          meaning: current[2],
        },
      ]);
    }

    setAnswered((prev) => ({
      ...prev,
      [index]: {
        pinyin: current[1],
        meaning: current[2],
        revealed: true,
      },
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
      setShowResult(false);
    }
  };

  const prevQuestion = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    setList(shuffle(words));
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
      if (!showResult) {
        checkAnswer();
      } else {
        nextQuestion();
      }
    }
  }

  useEffect(() => {
    pinyinRef.current?.focus();
  }, [index]);

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6">
          HSK Survival Quiz
        </h1>

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
                id="formPinyin"
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
                id="formMeaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEnter(e);
                  }
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

            <p className="text-2xl mb-4">Nilai: {finalScore100} / 100</p>

            <button
              onClick={resetQuiz}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold cursor-pointer"
            >
              Main Lagi
            </button>
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
