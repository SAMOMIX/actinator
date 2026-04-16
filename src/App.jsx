import { useEffect, useMemo, useState } from "react";
import { fetchMeta, fetchRecommendation } from "./api";

function App() {
  const [meta, setMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentValue, setCurrentValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      setLoading(true);
      const metaResponse = await fetchMeta();
      const recommendation = await fetchRecommendation({});
      setMeta(metaResponse);
      setResult(recommendation);
      seedAnswerInput(recommendation.nextQuestion);
      setError("");
    } catch (err) {
      setError("Impossible de charger l'application.");
    } finally {
      setLoading(false);
    }
  }

  function seedAnswerInput(question) {
    if (!question) {
      setCurrentValue("");
      return;
    }

    if (question.type === "multi") {
      setCurrentValue([]);
      return;
    }

    if (question.type === "boolean") {
      setCurrentValue("true");
      return;
    }

    if (question.type === "number") {
      setCurrentValue("2");
      return;
    }

    setCurrentValue(question.options?.[0] ?? "");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!result?.nextQuestion) {
      return;
    }

    const answer = normalizeAnswer(result.nextQuestion, currentValue);
    if (answer === undefined) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [result.nextQuestion.key]: answer,
    };

    try {
      setSubmitting(true);
      const nextResult = await fetchRecommendation(nextAnswers);
      setAnswers(nextAnswers);
      setResult(nextResult);
      seedAnswerInput(nextResult.nextQuestion);
      setError("");
    } catch (err) {
      setError("La recommandation a echoue. Reessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    setAnswers({});
    setResult(null);
    setError("");
    void bootstrap();
  }

  function toggleMultiValue(value) {
    setCurrentValue((previous) => {
      const values = Array.isArray(previous) ? previous : [];
      return values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
    });
  }

  const topItems = useMemo(() => {
    if (!result) {
      return [];
    }

    if (result.top3?.length) {
      return result.top3;
    }

    return result.fallback?.top3 || [];
  }, [result]);

  const answeredEntries = useMemo(() => Object.entries(answers), [answers]);
  const progressCount = answeredEntries.length;
  const progressPercent = result?.nextQuestion
    ? Math.min(90, 0 + progressCount * 6)
    : 100;

  return (
    <main className="app-shell">
        <section className="hero hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">ACTINATOR® - Le génie des activités en famille</p>
          <h1>Trouver la bonne activité en quelques questions</h1>
          <p className="lead">
            Une large séléction d'occupations pensées comme un carnet de bord familial,
            pour converger rapidement vers l'activité qui colle parfaitement au moment.
          </p>

          <div className="stats">
            <span className="stat-pill">
              {meta ? `${meta.totalActivities} activités chargées` : "Chargement"}
            </span>
            {meta &&
              Object.values(meta.categories)
                .slice(0,8)
                .map((label) => (
                  <span className="choice-chip" key={label}>
                    {label}
                  </span>
                ))}
          </div>
        </div>

        <div className="hero-board">
          <div className="hero-meter">
            <span className="hero-meter-label">Progression</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="progress-track">
            <span
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="hero-notes">
            <article className="mini-card">
              <span className="mini-card-label">Etape</span>
              <strong>
                {loading
                  ? "Préparation"
                  : result?.nextQuestion
                    ? `Question ${progressCount + 1}`
                    : "Décision finale"}
              </strong>
            </article>
            <article className="mini-card">
              <span className="mini-card-label">Réponses</span>
              <strong>{progressCount}</strong>
            </article>
          </div>
        </div>
      </section>

       <section className="content-grid">
        <aside className="panel side-panel">
          <div className="panel-head side-head">
            <div>
              <p className="step">Tableau de bord</p>
              <h2>Le fil du parcours</h2>
            </div>
            <button className="ghost-button" onClick={resetFlow} type="button">
              Réinitialiser
            </button>
          </div>

           <div className="progress-stack">
            <div className="timeline-item timeline-item-active">
              <span className="timeline-dot" />
              <div>
                <strong>
                  {loading
                    ? "Chargement"
                    : result?.nextQuestion
                      ? "Question en cours"
                      : "Recommandation prête"}
                </strong>
                <p>
                  {result?.nextQuestion
                    ? result.nextQuestion.label
                    : "Le moteur a terminé son arbitrage."}
                </p>
              </div>
            </div>

            {answeredEntries.length > 0 ? (
              answeredEntries.map(([key, value]) => (
                <div className="timeline-item" key={key}>
                  <span className="timeline-dot timeline-dot-soft" />
                  <div>
                    <strong>{humanizeKey(key)}</strong>
                    <p>{formatAnswer(value)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                Les réponses apparaitront ici au fil du questionnaire.
              </div>
            )}
          </div>
        </aside>

        <div className="main-stack">
          {error ? <section className="panel error-banner">{error}</section> : null}

          {loading ? (
            <section className="panel feature-panel">
              <p className="step">Chargement</p>
              <h2>Préparation du questionnaire...</h2>
            </section>
          ) : null}

           {!loading && result?.nextQuestion ? (
            <section className="panel feature-panel">
              <div className="panel-head">
                <div>
                  <p className="step">Question {progressCount + 1}</p>
                  <h2>{result.nextQuestion.label}</h2>
                </div>
                <span className="question-badge">
                  {result.nextQuestion.type === "multi"
                    ? "Choix multiples"
                    : "Choix guide"}
                </span>
                </div>

              <p className="hint">{result.nextQuestion.hint}</p>

              <form className="answer-form" onSubmit={handleSubmit}>
                <QuestionInput
                  question={result.nextQuestion}
                  value={currentValue}
                  onChange={setCurrentValue}
                  onToggleMulti={toggleMultiValue}
                />
                <div className="action-row">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Recherche..." : "Continuer"}
                  </button>
                  <span className="action-note">
                    Le moteur recalculera la meilleure piste à chaque réponse.
                  </span>
                </div>
              </form>
            </section>
          ) : null}

          {!loading && result && !result.nextQuestion ? (
            <section className="panel result-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Recommandation</p>
                  <h2>
                    {result.recommendation
                      ? result.recommendation.name
                      : "Aucune correspondance parfaite"}
                  </h2>
                </div>
                <button
                  className="ghost-button"
                  onClick={resetFlow}
                  type="button"
                >
                  Recommencer
                </button>
              </div>

              <p className="result-meta">
                {result.recommendation
                  ? `${result.recommendation.category} · score ${result.score}`
                  : result.fallback?.message}
              </p>

              <div className="result-spotlight">
                <div className="spotlight-score">
                  <span>Score final</span>
                  <strong>{result.score ?? "-"}</strong>
                </div>
                <div className="spotlight-copy">
                  <p>
                    {result.recommendation
                      ? "Cette activité ressort comme le meilleur compromis entre tous les paramètres."
                      : "Aucune activité ne coche tout, donc le moteur te propose les options les plus proches."}
                  </p>
                </div>
              </div>
              
              <div className="top-list">
                {topItems.map((item, index) => (
                  <article className="top-card" key={item.name}>
                    <span className="top-rank">0{index + 1}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        Score {item.score}
                        {item.category ? ` · ${item.category}` : ""}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

      

function QuestionInput({ question, value, onChange, onToggleMulti }) {
  if (question.type === "number") {
    return (
      <input
        className="number-input"
        type="number"
        min="1"
        max="12"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    );
  }

  const inputType = question.type === "multi" ? "checkbox" : "radio";

  return (
    <div className="option-grid">
      {question.displayOptions.map((option) => {
        const checked =
          question.type === "multi"
            ? Array.isArray(value) && value.includes(option.value)
            : String(value) === String(option.value);

        return (
          <label className="option-card" key={option.value}>
            <input
              type={inputType}
              name="answer"
              value={option.value}
              checked={checked}
              onChange={() => {
                if (question.type === "multi") {
                  onToggleMulti(option.value);
                } else {
                  onChange(option.value);
                }
              }}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function normalizeAnswer(question, rawValue) {
  if (question.type === "number") {
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (question.type === "boolean") {
    return rawValue === "true";
  }

  if (question.type === "multi") {
    return Array.isArray(rawValue) ? rawValue : [];
  }

  return rawValue;
}

export default App;

function humanizeKey(key) {
  const labels = {
    category: "Catégorie",
    location: "Lieu",
    players: "Joueurs",
    energy: "Energie",
    type: "Type",
    duration: "Durée",
    material: "Matériel",
    noise: "Bruit",
    mood: "Mental",
    objectif: "Objectif",
    result:"Résultat concret",
    meteo:"Météo",
    social:"Social",
    interrupt:"Interruption",
    moment:"Moment journée",
    school:"Ecole",
  };

  return labels[key] || key;
}

function formatAnswer(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "oui" : "non";
  }

  return String(value);
}