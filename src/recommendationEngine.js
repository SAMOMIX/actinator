const DEFAULT_WEIGHTS = {
  exact: 3,
  partial: 1,
  contradiction: -2,
};

const DEFAULT_STOP_GAP = 4;

export const QUESTION_DEFINITIONS = [
  {
    key: "location",
    label: "Où faire cette activité ?",
    type: "multi",
    strict: true,
    options: ["interieur", "exterieur"],
    evaluate(answer, activity) {
      return evaluateArrayPreference(answer, activity.location, { strict: true });
    },
  },
  {
    key: "players",
    label: "Combien de joueurs participent ?",
    type: "number",
    strict: true,
    options: [1, 2, 3, 4, 5, 6, 7, 8],
    evaluate(answer, activity) {
      if (typeof answer !== "number") {
        return null;
      }

      if (answer < activity.min_players || answer > activity.max_players) {
        return { incompatible: true, scoreDelta: DEFAULT_WEIGHTS.contradiction };
      }

      const span = Math.max(activity.max_players - activity.min_players, 1);
      const exact =
        answer === activity.min_players ||
        answer === activity.max_players ||
        span <= 2;

      return {
        incompatible: false,
        scoreDelta: exact ? DEFAULT_WEIGHTS.exact : DEFAULT_WEIGHTS.partial,
      };
    },
  },
  {
    key: "category",
    label: "Quelle famille d'activités correspond le mieux ?",
    type: "single",
    options: [
      "calme",
      "jeux de société",
      "sport",
      "plein air",
      "créatif",
      "imaginatif",
      "cuisine",
      "éducatif",
      "numérique",
      "famille",
    ],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.category);
    },
  },
  {
    key: "energy",
    label: "Quel est le niveau d'énergie nécessaire ?",
    type: "single",
    options: ["calme", "moyen", "élevé"],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.energy);
    },
  },
  {
    key: "type",
    label: "Quel type d'activité décrit le mieux ?",
    type: "multi",
    options: ["jeu", "sport", "créatif", "détente", "éducatif"],
    evaluate(answer, activity) {
      return evaluateArrayPreference(answer, activity.type, { strict: false });
    },
  },
  {
    key: "duration",
    label: "Quelle durée est nécessaire à la réalisation de l'occupation ?",
    type: "single",
    options: ["court", "moyen", "long"],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.duration);
    },
  },
  {
    key: "material",
    label: "As-tu besoin de matériel ?",
    type: "single",
    options: ["oui", "non"],
    evaluate(answer, activity) {
      if (typeof answer !== "boolean") {
        return null;
      }

      return {
        incompatible: false,
        scoreDelta:
          answer === activity.material
            ? DEFAULT_WEIGHTS.exact
            : DEFAULT_WEIGHTS.contradiction,
      };
    },
  },
  {
    key: "noise",
    label: "Quel niveau sonore se dégage de l'activité ?",
    type: "single",
    options: ["silencieux", "moyen", "bruyant"],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "mood",
    label: "Quel est ton état mental cible ?",
    type: "single",
    options: ["te vider la tête", "te stimuler", "te réconforter", "te sentir fier"],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "objectif",
    label: "Quel est ton objectif ?",
    type: "single",
    options: ["progresser", "passer le temps", "te défouler", "créer un souvenir"],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "result",
    label: "Veux-tu un résultat concret à la fin ?",
    type: "single",
    options: ["oui", "non"],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "meteo",
    label: "Quelle météo fait-il ?",
    type: "single",
    options: ["pluie", "soleil", "froid"],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "social",
    label: "Quelle est la dynamique sociale ?",
    type: "single",
    options: ["coopératif", "compétitif" ],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "interrupt",
    label: "Peux-tu être interrompu pendant ton activité ?",
    type: "single",
    options: ["oui", "non" ],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "moment",
    label: "Quel moment de la journée est-il ?",
    type: "single",
    options: ["jour", "soir" ],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
  {
    key: "school",
    label: "As-tu école demain ?",
    type: "single",
    options: ["oui", "non" ],
    evaluate(answer, activity) {
      return evaluateScalar(answer, activity.noise);
    },
  },
];

export function recommendActivity(answers = {}, activities = [], options = {}) {
  const config = buildConfig(options);
  const states = activities.map((activity) => ({
    activity,
    score: 0,
    active: true,
    reasons: [],
  }));

  for (const question of config.questions) {
    if (!Object.prototype.hasOwnProperty.call(answers, question.key)) {
      continue;
    }

    const answer = answers[question.key];
    for (const state of states) {
      if (!state.active) {
        continue;
      }

      const evaluation = question.evaluate(answer, state.activity);
      if (!evaluation) {
        continue;
      }

      state.score += evaluation.scoreDelta;
      state.reasons.push({
        question: question.key,
        answer,
        scoreDelta: evaluation.scoreDelta,
        incompatible: evaluation.incompatible,
      });

      if (question.strict && evaluation.incompatible) {
        state.active = false;
      }
    }
  }

  const activeStates = states.filter((state) => state.active);
  const pool = activeStates.length > 0 ? activeStates : states;
  const ranked = rankStates(pool);
  const best = ranked[0] || null;
  const runnerUp = ranked[1] || null;
  const scoreGap =
    best && runnerUp ? best.score - runnerUp.score : Number.POSITIVE_INFINITY;
  const shouldStop =
    Boolean(best) && (ranked.length === 1 || scoreGap >= config.stopGap);

  if (!best) {
    return {
      recommendation: null,
      score: null,
      shouldStop: true,
      nextQuestion: null,
      top3: [],
      fallback: buildFallback(states),
      candidates: [],
    };
  }

  return {
    recommendation: shouldStop ? best.activity : null,
    score: best.score,
    shouldStop,
    nextQuestion: shouldStop
      ? null
      : selectNextQuestion(answers, activeStates, config.questions),
    top3: ranked.slice(0, 3).map((state) => ({
      name: state.activity.name,
      score: state.score,
      active: state.active,
      category: state.activity.category,
    })),
    fallback: activeStates.length === 0 ? buildFallback(states) : null,
    candidates: ranked.map((state) => ({
      activity: state.activity,
      score: state.score,
      active: state.active,
    })),
  };
}

function buildConfig(options) {
  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  return {
    weights,
    stopGap: options.stopGap ?? DEFAULT_STOP_GAP,
    questions:
      options.questions ||
      QUESTION_DEFINITIONS.map((question) => ({
        ...question,
        evaluate(answer, activity) {
          return normalizeScore(question.evaluate(answer, activity), weights);
        },
      })),
  };
}

function selectNextQuestion(answers, activeStates, questions) {
  if (activeStates.length <= 1) {
    return null;
  }

  const unanswered = questions.filter(
    (question) => !Object.prototype.hasOwnProperty.call(answers, question.key),
  );

  if (unanswered.length === 0) {
    return null;
  }

  return unanswered
    .map((question) => ({
      question,
      gain: calculateQuestionGain(question, activeStates),
    }))
    .sort((left, right) => right.gain - left.gain)[0].question;
}

function calculateQuestionGain(question, activeStates) {
  const total = activeStates.length;
  const groups = new Map();

  for (const state of activeStates) {
    const bucket = computeBucket(question, state.activity);
    groups.set(bucket, (groups.get(bucket) || 0) + 1);
  }

  let entropy = 0;
  for (const count of groups.values()) {
    const ratio = count / total;
    entropy -= ratio * Math.log2(ratio);
  }

  return entropy;
}

function computeBucket(question, activity) {
  if (question.key === "players") {
    return `${activity.min_players}-${activity.max_players}`;
  }

  if (Array.isArray(activity[question.key])) {
    return [...activity[question.key]].sort().join("|");
  }

  return String(activity[question.key]);
}

function normalizeScore(result, weights) {
  if (!result) {
    return null;
  }

  const mapping = {
    [DEFAULT_WEIGHTS.exact]: weights.exact,
    [DEFAULT_WEIGHTS.partial]: weights.partial,
    [DEFAULT_WEIGHTS.contradiction]: weights.contradiction,
  };

  return {
    incompatible: Boolean(result.incompatible),
    scoreDelta: mapping[result.scoreDelta] ?? result.scoreDelta,
  };
}

function rankStates(states) {
  return [...states].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (right.active !== left.active) {
      return Number(right.active) - Number(left.active);
    }

    return left.activity.name.localeCompare(right.activity.name);
  });
}

function buildFallback(states) {
  const ranked = rankStates(states);
  return {
    message:
      "Aucune activité ne correspond parfaitement. Voici les options les plus proches.",
    top3: ranked.slice(0, 3).map((state) => ({
      name: state.activity.name,
      score: state.score,
      category: state.activity.category,
    })),
  };
}

function evaluateScalar(answer, value) {
  if (answer == null || value == null) {
    return null;
  }

  return {
    incompatible: false,
    scoreDelta:
      answer === value
        ? DEFAULT_WEIGHTS.exact
        : DEFAULT_WEIGHTS.contradiction,
  };
}

function evaluateArrayPreference(answer, values, { strict }) {
  const selected = toArray(answer);
  const pool = toArray(values);

  if (selected.length === 0 || pool.length === 0) {
    return null;
  }

  const matches = selected.filter((value) => pool.includes(value));
  if (matches.length === 0) {
    return {
      incompatible: strict,
      scoreDelta: DEFAULT_WEIGHTS.contradiction,
    };
  }

  const exact = matches.length === selected.length && matches.length === pool.length;
  return {
    incompatible: false,
    scoreDelta: exact ? DEFAULT_WEIGHTS.exact : DEFAULT_WEIGHTS.partial,
  };
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value == null) {
    return [];
  }

  return [value];
}