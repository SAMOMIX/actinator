export const CATEGORY_LABELS = {
  calme: "Activités calmes",
  jeux_de_société: "Jeux de société",
  sport: "Sport",
  plein_air: "Plein air",
  créatif: "Créatif",
  imaginatif: "Imaginatif",
  cuisine: "Cuisine",
  éducatif: "Educatif",
  numérique: "Numérique",
  famille: "Moments en famille",
};

const QUESTION_LABEL_HINTS = {
  location: "Choisissez un ou plusieurs contextes.",
  players: "Indiquez le nombre de participants.",
  category: "Cette question accélère fortement la recommandation.",
  energy: "Le niveau d'énergie attendu aide à séparer les activités.",
  type: "Vous pouvez selectionner plusieurs styles.",
  duration: "Une durée courte donne souvent une réponse plus vite.",
  material: "Le materiel permet d'éliminer certaines options.",
  noise: "Utile si vous voulez éviter les activités bruyantes.",
  mood: "Décris ton état d'esprit actuel.",
  objectif: "Décris ce que tu souhaiterai tirer de positif de cette activité.",
  result: "Indique si tu souhaite un rendu matériel à la fin de ton activité.",
  meteo: "Précise quel temps il fait dehors.",
  social: "Plutôt pour s'amuser ou pour voir qui est le plus fort ?",
  interrupt: "Précise si ça te dérange de t'arrêter avant la fin de l'activité.",
  moment: "Indique à quelle partie de la journée tu souhaitres consacrer ton temps.",
  school: "Précise si oui ou non tu dois te lever tôt demain pour aller à l'école.",
};

export function enrichQuestion(question) {
  if (!question) {
    return null;
  }

  return {
    ...question,
    hint: QUESTION_LABEL_HINTS[question.key] || null,
    displayOptions: (question.options || []).map((option) => ({
      value: option,
      label: CATEGORY_LABELS[option] || String(option),
    })),
  };
}